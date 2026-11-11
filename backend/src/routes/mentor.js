const express = require('express');
const { z } = require('zod');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate, oid } = require('../middleware/validate');
const { User, Cohort, Resource, Submission, Attempt, Progress, Activity } = require('../models');
const { loadCohortData, avatarSpec } = require('../services/cohortData');
const { mentorCohort, mentorCohortIds, mentorResource } = require('../services/access');
const { createMentee } = require('../services/menteeService');
const { syncBadges } = require('../services/badgeService');
const { logActivity, notify, notifyMany } = require('../services/events');
const { generatePassword, hashPassword } = require('../utils/password');
const { normalizeSkills } = require('../domain/skills');
const { badRequest, notFound } = require('../utils/errors');

const router = express.Router();
router.use(authenticate, requireRole('mentor'));

const DAY = 24 * 60 * 60 * 1000;
const httpUrl = z.string().trim().url('Enter a valid URL').refine((u) => /^https?:\/\//i.test(u), 'URL must start with http:// or https://');

const question = z
  .object({
    text: z.string().trim().min(3, 'Question text is too short').max(500),
    options: z.array(z.string().trim().min(1, 'Options cannot be empty').max(200)).min(2).max(6),
    correctIndex: z.coerce.number().int().min(0),
    marks: z.coerce.number().min(0.5).max(100).default(1)
  })
  .refine((q) => q.correctIndex < q.options.length, { message: 'Correct answer must point to one of the options', path: ['correctIndex'] });

const baseFields = {
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(140),
  description: z.string().trim().max(2000).default(''),
  instructions: z.string().trim().max(5000).default(''),
  skills: z.array(z.string().trim().min(1).max(40)).max(4).default([]),
  deadline: z.coerce.date({ invalid_type_error: 'Choose a valid deadline' }),
  published: z.boolean().default(false)
};

const videoFields = { ...baseFields, videoUrl: httpUrl, durationMinutes: z.coerce.number().int().min(1).max(600).optional(), maxMarks: z.coerce.number().min(0).max(1000).default(0) };
const quizFields = { ...baseFields, questions: z.array(question).min(1, 'Add at least one question').max(50), timeLimitMinutes: z.coerce.number().int().min(1).max(300).optional() };
const projectFields = { ...baseFields, submissionFormat: z.string().trim().min(3, 'Describe the expected submission format').max(300), maxMarks: z.coerce.number().min(1, 'Set the maximum marks').max(1000) };

const createSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('video'), cohort: z.string().min(1), ...videoFields }),
  z.object({ type: z.literal('quiz'), cohort: z.string().min(1), ...quizFields }),
  z.object({ type: z.literal('project'), cohort: z.string().min(1), ...projectFields })
]);

const updateSchemas = {
  video: z.object(videoFields).partial(),
  quiz: z.object(quizFields).partial(),
  project: z.object(projectFields).partial()
};

const mentorView = (r) => (r.toObject ? r.toObject() : r);

function assertPublishable(deadline) {
  if (new Date(deadline) <= new Date()) throw badRequest('Set a deadline in the future before publishing');
}

async function announce(resource, cohortId) {
  const mentees = await User.find({ cohort: cohortId, role: 'mentee', active: true }).distinct('_id');
  await notifyMany(mentees, {
    type: 'resource',
    title: `New ${resource.type}: ${resource.title}`,
    body: `Due ${resource.deadline.toISOString().slice(0, 10)}`,
    link: `/mentee/resources/${resource._id}`
  });
}

router.get('/dashboard', async (req, res) => {
  const now = new Date();
  const cohorts = await Cohort.find({ mentors: req.user._id, status: 'active' }).populate('program', 'name').lean();
  const ids = cohorts.map((c) => c._id);

  const [pending, recent] = await Promise.all([
    Submission.countDocuments({ cohort: { $in: ids }, status: 'submitted' }),
    Submission.find({ cohort: { $in: ids } }).sort({ submittedAt: -1 }).limit(8).populate('mentee', 'name').populate('resource', 'title maxMarks').lean()
  ]);

  let totalMentees = 0;
  let activeAssignments = 0;
  const upcoming = [];
  const inactive = [];
  const performance = [];
  const cutoff = now.getTime() - 7 * DAY;

  for (const c of cohorts) {
    const data = await loadCohortData(c._id, now);
    totalMentees += data.cohortSize;
    const rows = [...data.byMentee.values()];

    for (const res of data.resources) {
      if (new Date(res.deadline) >= now) {
        activeAssignments += 1;
        const done = rows.filter((v) => v.records.find((r) => r.id === String(res._id))?.done).length;
        upcoming.push({ id: res._id, title: res.title, type: res.type, deadline: res.deadline, cohort: c.name, done, total: rows.length });
      }
    }

    for (const v of rows) {
      const last = v.dates.length ? new Date(Math.max(...v.dates.map((d) => new Date(d).getTime()))) : null;
      if (!last || last.getTime() < cutoff) {
        inactive.push({
          id: v.mentee._id,
          name: v.mentee.name,
          cohort: c.name,
          lastActive: last,
          daysSince: last ? Math.floor((now - last) / DAY) : null
        });
      }
    }

    const avg = (k) => (rows.length ? Math.round((rows.reduce((s, v) => s + v.metrics[k], 0) / rows.length) * 10) / 10 : 0);
    performance.push({ cohortId: c._id, cohort: c.name, program: c.program?.name, mentees: rows.length, avgScore: avg('score'), avgAssessment: avg('assessment'), avgCompletion: avg('completion'), avgConsistency: avg('consistency') });
  }

  upcoming.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  inactive.sort((a, b) => (b.daysSince ?? 999) - (a.daysSince ?? 999));

  res.json({
    totals: { cohorts: cohorts.length, mentees: totalMentees, activeAssignments, pendingEvaluations: pending, inactiveMentees: inactive.length },
    cohorts: cohorts.map((c) => ({ id: c._id, name: c.name, program: c.program?.name })),
    recentSubmissions: recent.map((s) => ({
      id: s._id,
      mentee: s.mentee?.name,
      menteeId: s.mentee?._id,
      resource: s.resource?.title,
      resourceId: s.resource?._id,
      submittedAt: s.submittedAt,
      late: s.late,
      status: s.status,
      marks: s.marks ?? null,
      maxMarks: s.resource?.maxMarks
    })),
    upcomingDeadlines: upcoming.slice(0, 6),
    performance,
    inactiveMentees: inactive.slice(0, 8)
  });
});

router.get('/cohorts', async (req, res) => {
  const cohorts = await Cohort.find({ mentors: req.user._id }).sort({ createdAt: -1 }).populate('program', 'name description').lean();
  const [menteeCounts, resourceCounts] = await Promise.all([
    User.aggregate([{ $match: { role: 'mentee', cohort: { $in: cohorts.map((c) => c._id) } } }, { $group: { _id: '$cohort', n: { $sum: 1 } } }]),
    Resource.aggregate([{ $match: { cohort: { $in: cohorts.map((c) => c._id) } } }, { $group: { _id: '$cohort', n: { $sum: 1 }, live: { $sum: { $cond: ['$published', 1, 0] } } } }])
  ]);
  const mm = new Map(menteeCounts.map((x) => [String(x._id), x.n]));
  const rm = new Map(resourceCounts.map((x) => [String(x._id), x]));
  res.json({
    cohorts: cohorts.map((c) => ({
      ...c,
      menteeCount: mm.get(String(c._id)) || 0,
      resourceCount: rm.get(String(c._id))?.n || 0,
      publishedCount: rm.get(String(c._id))?.live || 0
    }))
  });
});

router.get('/cohorts/:id', async (req, res) => {
  await mentorCohort(req.user, oid(req.params.id));
  const cohort = await Cohort.findById(req.params.id).populate('program', 'name').populate('mentors', 'name').lean();
  const data = await loadCohortData(cohort._id);
  const now = Date.now();

  const mentees = data.ranked.map((r) => {
    const v = data.byMentee.get(r.id);
    const last = v.dates.length ? Math.max(...v.dates.map((d) => new Date(d).getTime())) : null;
    return {
      id: r.id,
      name: v.mentee.name,
      enrollmentNumber: v.mentee.enrollmentNumber,
      email: v.mentee.email || null,
      avatar: avatarSpec(v.mentee),
      rank: r.rank,
      score: v.metrics.score,
      assessment: v.metrics.assessment,
      completion: v.metrics.completion,
      consistency: v.metrics.consistency,
      streak: v.streak.current,
      overdue: v.records.filter((x) => x.status === 'overdue').length,
      lastActiveAt: last ? new Date(last) : null,
      inactive: !last || now - last > 7 * DAY,
      mustChangePassword: v.mentee.mustChangePassword
    };
  });

  const resources = await Resource.find({ cohort: cohort._id }).sort({ deadline: 1 }).lean();
  const subCounts = await Submission.aggregate([{ $match: { cohort: cohort._id, status: 'submitted' } }, { $group: { _id: '$resource', n: { $sum: 1 } } }]);
  const pendingMap = new Map(subCounts.map((s) => [String(s._id), s.n]));
  const rows = [...data.byMentee.values()];

  res.json({
    cohort,
    mentees,
    resources: resources.map((r) => ({
      id: r._id,
      type: r.type,
      title: r.title,
      deadline: r.deadline,
      maxMarks: r.maxMarks,
      published: r.published,
      skills: r.skills,
      completed: r.published ? rows.filter((v) => v.records.find((x) => x.id === String(r._id))?.done).length : 0,
      total: rows.length,
      pendingEvaluation: pendingMap.get(String(r._id)) || 0
    }))
  });
});

const menteeSchema = z.object({
  name: z.string().trim().min(2, 'Enter the mentee name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').optional().or(z.literal('').transform(() => undefined))
});

router.post('/cohorts/:id/mentees', validate(menteeSchema), async (req, res) => {
  const cohort = await mentorCohort(req.user, oid(req.params.id));
  const { mentee, credentials } = await createMentee({ cohort, name: req.body.name, email: req.body.email, createdBy: req.user._id });
  res.status(201).json({ mentee: { id: mentee._id, name: mentee.name, enrollmentNumber: mentee.enrollmentNumber }, credentials });
});

router.post('/cohorts/:id/mentees/:menteeId/reset-password', async (req, res) => {
  const cohort = await mentorCohort(req.user, oid(req.params.id));
  const mentee = await User.findOne({ _id: oid(req.params.menteeId, 'mentee'), cohort: cohort._id, role: 'mentee' });
  if (!mentee) throw notFound('Mentee not found in this cohort');
  const password = generatePassword();
  mentee.passwordHash = await hashPassword(password);
  mentee.mustChangePassword = true;
  await mentee.save();
  res.json({ credentials: { enrollmentNumber: mentee.enrollmentNumber, password } });
});

router.get('/mentees/:id', async (req, res) => {
  const mentee = await User.findOne({ _id: oid(req.params.id), role: 'mentee' });
  if (!mentee) throw notFound('Mentee not found');
  await mentorCohort(req.user, mentee.cohort);
  const data = await loadCohortData(mentee.cohort);
  const v = data.byMentee.get(String(mentee._id));
  const submissions = await Submission.find({ mentee: mentee._id }).populate('resource', 'title maxMarks').sort({ submittedAt: -1 }).lean();

  res.json({
    mentee: { id: mentee._id, name: mentee.name, enrollmentNumber: mentee.enrollmentNumber, email: mentee.email || null, avatar: avatarSpec(mentee), interests: mentee.interests, joinedAt: mentee.createdAt },
    rank: data.rankMap.get(String(mentee._id)),
    cohortSize: data.cohortSize,
    metrics: v.metrics,
    streak: v.streak,
    badges: mentee.badges,
    records: v.records.map((r) => ({ id: r.id, type: r.type, title: r.title, status: r.status, marks: r.marks, maxMarks: r.maxMarks, deadline: r.deadline, completedAt: r.completedAt, onTime: r.onTime, feedback: r.feedback })),
    submissions: submissions.map((s) => ({ id: s._id, resource: s.resource?.title, link: s.link, status: s.status, marks: s.marks ?? null, maxMarks: s.resource?.maxMarks, submittedAt: s.submittedAt, late: s.late, feedback: s.feedback }))
  });
});

router.get('/cohorts/:id/resources', async (req, res) => {
  await mentorCohort(req.user, oid(req.params.id));
  const resources = await Resource.find({ cohort: req.params.id }).sort({ deadline: 1 }).lean();
  res.json({ resources });
});

router.post('/resources', validate(createSchema), async (req, res) => {
  const cohort = await mentorCohort(req.user, oid(req.body.cohort, 'cohort'));
  const body = req.body;
  if (body.published) assertPublishable(body.deadline);

  const doc = { ...body, program: cohort.program, cohort: cohort._id, skills: normalizeSkills(body.skills), createdBy: req.user._id };
  if (body.type === 'quiz') doc.maxMarks = body.questions.reduce((s, q) => s + q.marks, 0);
  if (body.published) doc.publishedAt = new Date();

  const resource = await Resource.create(doc);
  if (resource.published) await announce(resource, cohort._id);
  res.status(201).json({ resource: mentorView(resource) });
});

router.get('/resources/:id', async (req, res) => {
  const resource = await mentorResource(req.user, oid(req.params.id));
  res.json({ resource: mentorView(resource) });
});

router.put('/resources/:id', async (req, res) => {
  const resource = await mentorResource(req.user, oid(req.params.id));
  const patch = updateSchemas[resource.type].parse(req.body);
  const locked = await Promise.all([Attempt.exists({ resource: resource._id, submittedAt: { $ne: null } }), Submission.exists({ resource: resource._id })]);
  if (patch.questions && locked[0]) throw badRequest('Questions cannot be changed after mentees have attempted the quiz');

  Object.assign(resource, patch);
  if (patch.skills) resource.skills = normalizeSkills(patch.skills);
  if (resource.type === 'quiz' && patch.questions) resource.maxMarks = resource.questions.reduce((s, q) => s + q.marks, 0);
  if (resource.type === 'project' && patch.maxMarks !== undefined && locked[1]) {
    const over = await Submission.exists({ resource: resource._id, marks: { $gt: patch.maxMarks } });
    if (over) throw badRequest('Some evaluated submissions already exceed that maximum');
  }
  await resource.save();
  res.json({ resource: mentorView(resource) });
});

router.post('/resources/:id/publish', validate(z.object({ published: z.boolean() })), async (req, res) => {
  const resource = await mentorResource(req.user, oid(req.params.id));
  if (req.body.published && !resource.published) {
    assertPublishable(resource.deadline);
    resource.published = true;
    resource.publishedAt = new Date();
    await resource.save();
    await announce(resource, resource.cohort);
  } else if (!req.body.published && resource.published) {
    const started = await Promise.all([
      Attempt.exists({ resource: resource._id }),
      Submission.exists({ resource: resource._id }),
      Progress.exists({ resource: resource._id })
    ]);
    if (started.some(Boolean)) throw badRequest('This resource already has mentee activity and cannot be unpublished');
    resource.published = false;
    await resource.save();
  }
  res.json({ resource: mentorView(resource) });
});

router.delete('/resources/:id', async (req, res) => {
  const resource = await mentorResource(req.user, oid(req.params.id));
  const used = await Promise.all([Attempt.exists({ resource: resource._id }), Submission.exists({ resource: resource._id }), Progress.exists({ resource: resource._id })]);
  if (used.some(Boolean)) throw badRequest('Resources with mentee activity cannot be deleted');
  await resource.deleteOne();
  res.json({ ok: true });
});

router.get('/resources/:id/submissions', async (req, res) => {
  const resource = await mentorResource(req.user, oid(req.params.id));
  const mentees = await User.find({ cohort: resource.cohort, role: 'mentee', active: true }).select('name enrollmentNumber avatar').lean();
  const byId = new Map(mentees.map((m) => [String(m._id), m]));
  const base = { id: resource._id, type: resource.type, title: resource.title, maxMarks: resource.maxMarks, deadline: resource.deadline, published: resource.published };

  let entries = [];
  let doneIds = new Set();
  let questionStats = null;

  if (resource.type === 'project') {
    const subs = await Submission.find({ resource: resource._id }).sort({ submittedAt: 1 }).lean();
    entries = subs.map((s) => ({
      id: s._id,
      mentee: { id: s.mentee, name: byId.get(String(s.mentee))?.name, enrollmentNumber: byId.get(String(s.mentee))?.enrollmentNumber },
      link: s.link,
      notes: s.notes,
      submittedAt: s.submittedAt,
      late: s.late,
      status: s.status,
      marks: s.marks ?? null,
      feedback: s.feedback,
      evaluatedAt: s.evaluatedAt || null,
      history: s.history
    }));
    doneIds = new Set(subs.map((s) => String(s.mentee)));
  } else if (resource.type === 'quiz') {
    const attempts = await Attempt.find({ resource: resource._id, submittedAt: { $ne: null } }).sort({ submittedAt: 1 }).lean();
    entries = attempts.map((a) => ({
      id: a._id,
      mentee: { id: a.mentee, name: byId.get(String(a.mentee))?.name, enrollmentNumber: byId.get(String(a.mentee))?.enrollmentNumber },
      submittedAt: a.submittedAt,
      late: a.late,
      marks: a.score,
      maxMarks: a.maxScore
    }));
    doneIds = new Set(attempts.map((a) => String(a.mentee)));
    questionStats = resource.questions.map((q, i) => {
      const answered = attempts.filter((a) => a.answers.some((x) => x.questionId === String(q._id)));
      const correct = answered.filter((a) => a.answers.find((x) => x.questionId === String(q._id)).selectedIndex === q.correctIndex).length;
      return { index: i + 1, text: q.text, attempts: attempts.length, correct, percentCorrect: attempts.length ? Math.round((correct / attempts.length) * 100) : null };
    });
  } else {
    const prog = await Progress.find({ resource: resource._id }).lean();
    entries = prog.map((p) => ({
      id: p._id,
      mentee: { id: p.mentee, name: byId.get(String(p.mentee))?.name, enrollmentNumber: byId.get(String(p.mentee))?.enrollmentNumber },
      startedAt: p.startedAt,
      submittedAt: p.completedAt || null,
      marks: p.completedAt ? p.marks : null
    }));
    doneIds = new Set(prog.filter((p) => p.completedAt).map((p) => String(p.mentee)));
  }

  res.json({
    resource: base,
    entries,
    questionStats,
    notDone: mentees.filter((m) => !doneIds.has(String(m._id))).map((m) => ({ id: m._id, name: m.name, enrollmentNumber: m.enrollmentNumber }))
  });
});

router.get('/submissions', async (req, res) => {
  const ids = await mentorCohortIds(req.user);
  const filter = { cohort: { $in: ids } };
  if (req.query.cohort) {
    if (!ids.map(String).includes(String(req.query.cohort))) throw badRequest('You are not assigned to this cohort');
    filter.cohort = req.query.cohort;
  }
  if (['submitted', 'evaluated'].includes(req.query.status)) filter.status = req.query.status;
  const subs = await Submission.find(filter).sort({ submittedAt: -1 }).limit(200).populate('mentee', 'name enrollmentNumber').populate('resource', 'title maxMarks').populate('cohort', 'name').lean();
  res.json({
    submissions: subs.map((s) => ({
      id: s._id,
      mentee: { id: s.mentee?._id, name: s.mentee?.name, enrollmentNumber: s.mentee?.enrollmentNumber },
      resource: { id: s.resource?._id, title: s.resource?.title, maxMarks: s.resource?.maxMarks },
      cohort: s.cohort?.name,
      link: s.link,
      notes: s.notes,
      submittedAt: s.submittedAt,
      late: s.late,
      status: s.status,
      marks: s.marks ?? null,
      feedback: s.feedback
    }))
  });
});

const evaluateSchema = z.object({
  marks: z.coerce.number({ invalid_type_error: 'Enter the marks awarded' }).min(0, 'Marks cannot be negative'),
  feedback: z.string().trim().max(3000).default('')
});

router.put('/submissions/:id/evaluate', validate(evaluateSchema), async (req, res) => {
  const submission = await Submission.findById(oid(req.params.id));
  if (!submission) throw notFound('Submission not found');
  await mentorCohort(req.user, submission.cohort);
  const resource = await Resource.findById(submission.resource);
  if (req.body.marks > resource.maxMarks) throw badRequest(`Marks cannot exceed the maximum of ${resource.maxMarks}`);

  const now = new Date();
  submission.marks = req.body.marks;
  submission.feedback = req.body.feedback;
  submission.status = 'evaluated';
  submission.evaluatedAt = now;
  submission.evaluatedBy = req.user._id;
  submission.history.push({ marks: req.body.marks, feedback: req.body.feedback, by: req.user._id, at: now });
  await submission.save();

  await logActivity({
    user: submission.mentee,
    cohort: submission.cohort,
    kind: 'project_evaluated',
    resource: resource._id,
    label: `${resource.title}: ${req.body.marks}/${resource.maxMarks}`,
    at: now
  });
  await notify(submission.mentee, {
    type: 'evaluation',
    title: `Evaluated: ${resource.title}`,
    body: `You scored ${req.body.marks}/${resource.maxMarks}.`,
    link: `/mentee/resources/${resource._id}`
  });
  const badges = await syncBadges(submission.mentee);
  res.json({ submission, newBadges: badges.map((b) => b.title) });
});

module.exports = router;
