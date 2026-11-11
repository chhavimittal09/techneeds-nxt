const express = require('express');
const { z } = require('zod');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate, oid, escapeRegex } = require('../middleware/validate');
const { User, Program, Cohort, Resource, Submission, Activity } = require('../models');
const { loadCohortData, leaderboardRows, avatarSpec } = require('../services/cohortData');
const { notify } = require('../services/events');
const { generatePassword, hashPassword } = require('../utils/password');
const { notFound, conflict, badRequest } = require('../utils/errors');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

const WEEK = 7 * 24 * 60 * 60 * 1000;
const tagList = z.array(z.string().trim().min(1).max(30)).max(10).default([]);

const programSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().trim().max(1000).default(''),
  tags: tagList,
  status: z.enum(['active', 'archived']).default('active')
});

const cohortSchema = z
  .object({
    program: z.string().min(1),
    name: z.string().trim().min(2).max(100),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    capacity: z.coerce.number().int().min(1).max(1000).default(60),
    status: z.enum(['active', 'archived']).default('active')
  })
  .refine((c) => c.endDate > c.startDate, { message: 'End date must be after the start date', path: ['endDate'] });

const mentorSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address')
});

async function cohortStats(cohort) {
  const data = await loadCohortData(cohort._id);
  const rows = [...data.byMentee.values()];
  const avg = (key) => (rows.length ? Math.round((rows.reduce((s, r) => s + r.metrics[key], 0) / rows.length) * 10) / 10 : 0);
  const sevenDaysAgo = Date.now() - WEEK;
  const active = rows.filter((r) => r.dates.some((d) => new Date(d).getTime() >= sevenDaysAgo)).length;
  return {
    data,
    stats: {
      mentees: rows.length,
      resources: data.resources.length,
      avgScore: avg('score'),
      avgAssessment: avg('assessment'),
      avgCompletion: avg('completion'),
      avgConsistency: avg('consistency'),
      activeLast7Days: active,
      inactive: rows.length - active
    }
  };
}

router.get('/overview', async (req, res) => {
  const since = new Date(Date.now() - WEEK);
  const [programs, cohorts, mentors, mentees, resources, pending, recent, activeUsers] = await Promise.all([
    Program.countDocuments({ status: 'active' }),
    Cohort.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'mentor', active: true }),
    User.countDocuments({ role: 'mentee', active: true }),
    Resource.countDocuments({ published: true }),
    Submission.countDocuments({ status: 'submitted' }),
    Activity.find({ kind: { $ne: 'joined' } }).sort({ at: -1 }).limit(10).populate('user', 'name role').populate('resource', 'title').lean(),
    Activity.distinct('user', { at: { $gte: since }, kind: { $in: ['video_started', 'video_completed', 'quiz_attempted', 'project_submitted'] } })
  ]);

  const cohortDocs = await Cohort.find({ status: 'active' }).populate('program', 'name').lean();
  const attention = [];
  for (const c of cohortDocs) {
    const [menteeCount, resourceCount] = await Promise.all([
      User.countDocuments({ cohort: c._id, role: 'mentee' }),
      Resource.countDocuments({ cohort: c._id, published: true })
    ]);
    if (!c.mentors.length) attention.push({ cohortId: c._id, cohort: c.name, program: c.program?.name, issue: 'No mentor assigned' });
    else if (!menteeCount) attention.push({ cohortId: c._id, cohort: c.name, program: c.program?.name, issue: 'No mentees enrolled yet' });
    else if (!resourceCount) attention.push({ cohortId: c._id, cohort: c.name, program: c.program?.name, issue: 'No resources published yet' });
  }

  res.json({
    totals: { programs, cohorts, mentors, mentees, publishedResources: resources, pendingEvaluations: pending, activeMenteesLast7Days: activeUsers.length },
    attention,
    recentActivity: recent.map((a) => ({
      id: a._id,
      kind: a.kind,
      at: a.at,
      label: a.label,
      actor: a.user?.name || 'Someone',
      resource: a.resource?.title || null
    }))
  });
});

router.get('/programs', async (req, res) => {
  const programs = await Program.find().sort({ createdAt: -1 }).lean();
  const [cohorts, menteeCounts] = await Promise.all([
    Cohort.find().select('program mentors status').lean(),
    User.aggregate([{ $match: { role: 'mentee' } }, { $group: { _id: '$program', count: { $sum: 1 } } }])
  ]);
  const menteeMap = new Map(menteeCounts.map((m) => [String(m._id), m.count]));
  res.json({
    programs: programs.map((p) => {
      const own = cohorts.filter((c) => String(c.program) === String(p._id));
      return {
        ...p,
        cohortCount: own.length,
        mentorCount: new Set(own.flatMap((c) => c.mentors.map(String))).size,
        menteeCount: menteeMap.get(String(p._id)) || 0
      };
    })
  });
});

router.post('/programs', validate(programSchema), async (req, res) => {
  const program = await Program.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ program });
});

router.put('/programs/:id', validate(programSchema.partial()), async (req, res) => {
  const program = await Program.findByIdAndUpdate(oid(req.params.id), req.body, { new: true, runValidators: true });
  if (!program) throw notFound('Program not found');
  res.json({ program });
});

router.get('/cohorts', async (req, res) => {
  const filter = req.query.program ? { program: oid(req.query.program, 'program') } : {};
  const cohorts = await Cohort.find(filter).sort({ createdAt: -1 }).populate('program', 'name').populate('mentors', 'name email').lean();
  const counts = await User.aggregate([{ $match: { role: 'mentee' } }, { $group: { _id: '$cohort', count: { $sum: 1 } } }]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json({ cohorts: cohorts.map((c) => ({ ...c, menteeCount: countMap.get(String(c._id)) || 0 })) });
});

router.post('/cohorts', validate(cohortSchema), async (req, res) => {
  if (!(await Program.exists({ _id: oid(req.body.program, 'program') }))) throw notFound('Program not found');
  const cohort = await Cohort.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ cohort });
});

router.put('/cohorts/:id', async (req, res) => {
  const cohort = await Cohort.findById(oid(req.params.id));
  if (!cohort) throw notFound('Cohort not found');
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      capacity: z.coerce.number().int().min(1).max(1000).optional(),
      status: z.enum(['active', 'archived']).optional()
    })
    .parse(req.body);
  Object.assign(cohort, parsed);
  if (cohort.endDate <= cohort.startDate) throw badRequest('End date must be after the start date');
  await cohort.save();
  res.json({ cohort });
});

router.get('/cohorts/:id', async (req, res) => {
  const cohort = await Cohort.findById(oid(req.params.id)).populate('program', 'name').populate('mentors', 'name email lastLoginAt').lean();
  if (!cohort) throw notFound('Cohort not found');
  const { data, stats } = await cohortStats(cohort);
  res.json({ cohort, stats, leaderboard: leaderboardRows(data).slice(0, 10) });
});

router.post('/cohorts/:id/mentors', validate(z.object({ mentorId: z.string().min(1) })), async (req, res) => {
  const cohort = await Cohort.findById(oid(req.params.id));
  if (!cohort) throw notFound('Cohort not found');
  const mentor = await User.findOne({ _id: oid(req.body.mentorId, 'mentor'), role: 'mentor', active: true });
  if (!mentor) throw notFound('Mentor not found');
  if (cohort.mentors.some((m) => String(m) === String(mentor._id))) throw conflict('That mentor is already assigned to this cohort');
  cohort.mentors.push(mentor._id);
  await cohort.save();
  await notify(mentor._id, { type: 'assignment', title: 'New cohort assigned', body: `You were assigned to ${cohort.name}.`, link: `/mentor/cohorts/${cohort._id}` });
  res.json({ cohort });
});

router.delete('/cohorts/:id/mentors/:mentorId', async (req, res) => {
  const cohort = await Cohort.findById(oid(req.params.id));
  if (!cohort) throw notFound('Cohort not found');
  cohort.mentors = cohort.mentors.filter((m) => String(m) !== oid(req.params.mentorId, 'mentor'));
  await cohort.save();
  res.json({ cohort });
});

router.get('/mentors', async (req, res) => {
  const mentors = await User.find({ role: 'mentor' }).sort({ createdAt: -1 }).lean();
  const cohorts = await Cohort.find({ mentors: { $in: mentors.map((m) => m._id) } }).populate('program', 'name').select('name program mentors').lean();
  res.json({
    mentors: mentors.map((m) => ({
      id: m._id,
      name: m.name,
      email: m.email,
      active: m.active,
      lastLoginAt: m.lastLoginAt || null,
      createdAt: m.createdAt,
      mustChangePassword: m.mustChangePassword,
      cohorts: cohorts.filter((c) => c.mentors.some((x) => String(x) === String(m._id))).map((c) => ({ id: c._id, name: c.name, program: c.program?.name }))
    }))
  });
});

router.post('/mentors', validate(mentorSchema), async (req, res) => {
  const password = generatePassword();
  const mentor = await User.create({
    name: req.body.name,
    email: req.body.email,
    passwordHash: await hashPassword(password),
    role: 'mentor',
    mustChangePassword: true,
    createdBy: req.user._id
  });
  res.status(201).json({ mentor, credentials: { email: mentor.email, password } });
});

router.post('/mentors/:id/reset-password', async (req, res) => {
  const mentor = await User.findOne({ _id: oid(req.params.id), role: 'mentor' });
  if (!mentor) throw notFound('Mentor not found');
  const password = generatePassword();
  mentor.passwordHash = await hashPassword(password);
  mentor.mustChangePassword = true;
  await mentor.save();
  res.json({ credentials: { email: mentor.email, password } });
});

router.patch('/mentors/:id', validate(z.object({ active: z.boolean() })), async (req, res) => {
  const mentor = await User.findOneAndUpdate({ _id: oid(req.params.id), role: 'mentor' }, { active: req.body.active }, { new: true });
  if (!mentor) throw notFound('Mentor not found');
  res.json({ mentor });
});

router.get('/mentees', async (req, res) => {
  const filter = { role: 'mentee' };
  if (req.query.cohort) filter.cohort = oid(req.query.cohort, 'cohort');
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).slice(0, 60)), 'i');
    filter.$or = [{ name: rx }, { enrollmentNumber: rx }, { email: rx }];
  }
  const mentees = await User.find(filter).sort({ createdAt: -1 }).limit(300).populate('cohort', 'name').populate('program', 'name').lean();

  const cohortIds = [...new Set(mentees.map((m) => String(m.cohort?._id)).filter(Boolean))];
  const metricsByMentee = new Map();
  for (const id of cohortIds) {
    const data = await loadCohortData(id);
    for (const [mid, v] of data.byMentee) metricsByMentee.set(mid, { ...v.metrics, rank: data.rankMap.get(mid), streak: v.streak.current });
  }

  res.json({
    mentees: mentees.map((m) => {
      const mt = metricsByMentee.get(String(m._id));
      return {
        id: m._id,
        name: m.name,
        enrollmentNumber: m.enrollmentNumber,
        email: m.email || null,
        active: m.active,
        cohort: m.cohort ? { id: m.cohort._id, name: m.cohort.name } : null,
        program: m.program?.name || null,
        lastActiveAt: m.lastActiveAt || null,
        avatar: avatarSpec(m),
        score: mt?.score ?? 0,
        completion: mt?.completion ?? 0,
        rank: mt?.rank ?? null,
        streak: mt?.streak ?? 0
      };
    })
  });
});

router.get('/analytics', async (req, res) => {
  const cohorts = await Cohort.find(req.query.cohort ? { _id: oid(req.query.cohort, 'cohort') } : {}).populate('program', 'name').lean();
  const perCohort = [];
  const buckets = [0, 0, 0, 0, 0];
  for (const c of cohorts) {
    const { data, stats } = await cohortStats(c);
    perCohort.push({ id: c._id, name: c.name, program: c.program?.name, ...stats });
    for (const v of data.byMentee.values()) buckets[Math.min(4, Math.floor(v.metrics.score / 20))] += 1;
  }

  const weeks = 8;
  const start = new Date(Date.now() - weeks * WEEK);
  const cohortFilter = req.query.cohort ? { cohort: oid(req.query.cohort, 'cohort') } : {};
  const acts = await Activity.find({ ...cohortFilter, at: { $gte: start }, kind: { $in: ['video_completed', 'quiz_attempted', 'project_submitted'] } }).select('at kind').lean();
  const weekly = Array.from({ length: weeks }, (_, i) => ({
    label: new Date(start.getTime() + i * WEEK).toISOString().slice(5, 10),
    video: 0,
    quiz: 0,
    project: 0
  }));
  for (const a of acts) {
    const idx = Math.min(weeks - 1, Math.floor((new Date(a.at) - start) / WEEK));
    weekly[idx][a.kind === 'video_completed' ? 'video' : a.kind === 'quiz_attempted' ? 'quiz' : 'project'] += 1;
  }

  const resourceMix = await Resource.aggregate([{ $match: { published: true, ...cohortFilter } }, { $group: { _id: '$type', count: { $sum: 1 } } }]);

  res.json({
    cohorts: perCohort,
    scoreDistribution: ['0-19', '20-39', '40-59', '60-79', '80-100'].map((label, i) => ({ label, count: buckets[i] })),
    weeklyActivity: weekly,
    resourceMix: resourceMix.map((r) => ({ type: r._id, count: r.count }))
  });
});

module.exports = router;
