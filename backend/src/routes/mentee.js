const express = require('express');
const { z } = require('zod');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate, oid, escapeRegex } = require('../middleware/validate');
const { User, Cohort, Progress, Attempt, Submission } = require('../models');
const { loadCohortData } = require('../services/cohortData');
const { menteeResource } = require('../services/access');
const { computeFor, badgeShelf } = require('../services/profileService');
const { syncBadges } = require('../services/badgeService');
const { logActivity, notifyMany } = require('../services/events');
const { buildRecord } = require('../domain/records');
const { conflict, badRequest, notFound } = require('../utils/errors');

const router = express.Router();
router.use(authenticate, requireRole('mentee'));

const httpUrl = z.string().trim().url('Enter a valid URL').refine((u) => /^https?:\/\//i.test(u), 'URL must start with http:// or https://');

const touch = (user) => User.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date() } });

const recordView = (r, resource) => ({
  id: r.id,
  type: r.type,
  title: r.title,
  description: resource?.description || '',
  skills: r.skills,
  status: r.status,
  marks: r.marks,
  maxMarks: r.maxMarks,
  pct: r.pct === null ? null : Math.round(r.pct * 100),
  deadline: r.deadline,
  completedAt: r.completedAt,
  onTime: r.onTime,
  feedback: r.feedback,
  durationMinutes: resource?.durationMinutes || null,
  questionCount: resource?.type === 'quiz' ? resource.questions.length : null
});

const badgeBrief = (b) => ({ key: b.key, title: b.title, tier: b.tier, icon: b.icon, criteria: b.criteria });

async function standing(user, newBadgesPromiseFactory) {
  const data = await loadCohortData(user.cohort);
  const newBadges = await newBadgesPromiseFactory(data);
  const v = data.byMentee.get(String(user._id));
  return {
    newBadges: newBadges.map(badgeBrief),
    standing: { rank: data.rankMap.get(String(user._id)) ?? null, cohortSize: data.cohortSize, score: v.metrics.score }
  };
}

router.get('/dashboard', async (req, res) => {
  const user = req.user;
  const { profile, data, v } = await computeFor(user);
  const cohort = await Cohort.findById(user.cohort).populate('program', 'name description').populate('mentors', 'name').lean();
  const resMap = new Map(data.resources.map((r) => [String(r._id), r]));
  const view = (r) => recordView(r, resMap.get(r.id));
  const records = v.records;

  const counts = { not_started: 0, in_progress: 0, submitted: 0, evaluated: 0, overdue: 0 };
  records.forEach((r) => {
    counts[r.status] += 1;
  });

  const upcoming = records
    .filter((r) => !r.done && r.status !== 'overdue')
    .sort((a, b) => a.deadline - b.deadline)
    .slice(0, 5)
    .map(view);
  const overdue = records.filter((r) => r.status === 'overdue').sort((a, b) => a.deadline - b.deadline).map(view);
  const recentQuizzes = records
    .filter((r) => r.type === 'quiz' && r.status === 'evaluated')
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 4)
    .map(view);
  const projects = records.filter((r) => r.type === 'project').map(view);

  const evaluated = await Submission.find({ mentee: user._id, status: 'evaluated' }).sort({ evaluatedAt: -1 }).limit(3).populate('resource', 'title maxMarks').lean();

  res.json({
    user: { id: user._id, name: user.name, firstName: user.name.split(' ')[0], mustChangePassword: user.mustChangePassword, joinedAt: user.createdAt },
    cohort: { id: cohort._id, name: cohort.name, startDate: cohort.startDate, endDate: cohort.endDate, program: cohort.program?.name, programDescription: cohort.program?.description, mentors: cohort.mentors.map((m) => m.name) },
    progress: { percent: records.length ? Math.round((records.filter((r) => r.done).length / records.length) * 100) : 0, done: records.filter((r) => r.done).length, total: records.length, counts },
    metrics: v.metrics,
    standing: { rank: data.rankMap.get(String(user._id)) ?? null, cohortSize: data.cohortSize },
    streak: v.streak,
    upcoming,
    overdue,
    recentQuizzes,
    projects,
    feedback: evaluated.map((s) => ({ id: s._id, resourceId: s.resource?._id, resource: s.resource?.title, marks: s.marks, maxMarks: s.resource?.maxMarks, feedback: s.feedback, evaluatedAt: s.evaluatedAt })),
    badges: badgeShelf(user).filter((b) => b.earned).map((b) => ({ ...badgeBrief(b), earnedAt: b.earnedAt })),
    archetype: profile.archetype.key === 'newcomer' ? null : { title: profile.archetype.title, tagline: profile.archetype.tagline },
    recommendation: profile.recommendations[0] || null,
    hasActivity: records.some((r) => r.status !== 'not_started' && r.status !== 'overdue')
  });
});

router.get('/resources', async (req, res) => {
  const { data, v } = await computeFor(req.user);
  const resMap = new Map(data.resources.map((r) => [String(r._id), r]));
  const q = String(req.query.q || '').trim().slice(0, 60);
  const rx = q ? new RegExp(escapeRegex(q), 'i') : null;

  let list = v.records.map((r) => recordView(r, resMap.get(r.id)));
  if (['video', 'quiz', 'project'].includes(req.query.type)) list = list.filter((r) => r.type === req.query.type);
  if (['not_started', 'in_progress', 'submitted', 'evaluated', 'overdue'].includes(req.query.status)) list = list.filter((r) => r.status === req.query.status);
  if (rx) list = list.filter((r) => rx.test(r.title) || rx.test(r.description) || r.skills.some((s) => rx.test(s)));
  list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  res.json({ resources: list });
});

async function loadParts(user, resource) {
  const [progress, attempt, submission] = await Promise.all([
    Progress.findOne({ resource: resource._id, mentee: user._id }).lean(),
    Attempt.findOne({ resource: resource._id, mentee: user._id }).lean(),
    Submission.findOne({ resource: resource._id, mentee: user._id }).lean()
  ]);
  return { progress, attempt, submission };
}

function quizBreakdown(resource, attempt) {
  return resource.questions.map((q) => {
    const given = attempt.answers.find((a) => a.questionId === String(q._id));
    const selected = given ? given.selectedIndex : null;
    const correct = selected === q.correctIndex;
    return {
      questionId: String(q._id),
      text: q.text,
      options: q.options,
      selectedIndex: selected,
      correctIndex: q.correctIndex,
      correct,
      marks: q.marks,
      awarded: correct ? q.marks : 0
    };
  });
}

const questionsForTaking = (resource) => resource.questions.map((q) => ({ id: String(q._id), text: q.text, options: q.options, marks: q.marks }));

router.get('/resources/:id', async (req, res) => {
  const resource = await menteeResource(req.user, oid(req.params.id));
  const parts = await loadParts(req.user, resource);
  const record = buildRecord(resource, parts);

  const payload = {
    resource: {
      id: resource._id,
      type: resource.type,
      title: resource.title,
      description: resource.description,
      instructions: resource.instructions,
      deadline: resource.deadline,
      maxMarks: resource.maxMarks,
      skills: record.skills,
      videoUrl: resource.type === 'video' ? resource.videoUrl : undefined,
      durationMinutes: resource.durationMinutes,
      submissionFormat: resource.type === 'project' ? resource.submissionFormat : undefined,
      timeLimitMinutes: resource.timeLimitMinutes,
      questionCount: resource.type === 'quiz' ? resource.questions.length : undefined
    },
    record: recordView(record, resource)
  };

  if (resource.type === 'quiz' && parts.attempt) {
    if (parts.attempt.submittedAt) {
      payload.quiz = {
        submitted: true,
        score: parts.attempt.score,
        maxScore: parts.attempt.maxScore,
        late: parts.attempt.late,
        submittedAt: parts.attempt.submittedAt,
        breakdown: quizBreakdown(resource, parts.attempt)
      };
    } else {
      payload.quiz = { submitted: false, startedAt: parts.attempt.startedAt, questions: questionsForTaking(resource) };
    }
  }

  if (resource.type === 'project' && parts.submission) {
    const s = parts.submission;
    payload.submission = {
      link: s.link,
      notes: s.notes,
      submittedAt: s.submittedAt,
      late: s.late,
      status: s.status,
      marks: s.marks ?? null,
      feedback: s.feedback,
      evaluatedAt: s.evaluatedAt || null,
      history: (s.history || []).map((h) => ({ marks: h.marks, feedback: h.feedback, at: h.at }))
    };
  }

  if (resource.type === 'video' && parts.progress) {
    payload.progress = { startedAt: parts.progress.startedAt, completedAt: parts.progress.completedAt || null };
  }
  res.json(payload);
});

router.post('/resources/:id/start', async (req, res) => {
  const user = req.user;
  const resource = await menteeResource(user, oid(req.params.id));

  if (resource.type === 'video') {
    const existing = await Progress.findOne({ resource: resource._id, mentee: user._id });
    if (!existing) {
      await Progress.create({ resource: resource._id, mentee: user._id, cohort: user.cohort });
      await logActivity({ user: user._id, cohort: user.cohort, kind: 'video_started', resource: resource._id, label: resource.title });
    }
    await touch(user);
    return res.json({ ok: true });
  }

  if (resource.type === 'quiz') {
    let attempt = await Attempt.findOne({ resource: resource._id, mentee: user._id });
    if (attempt?.submittedAt) throw conflict('You have already submitted this quiz');
    if (!attempt) attempt = await Attempt.create({ resource: resource._id, mentee: user._id, cohort: user.cohort, maxScore: resource.maxMarks });
    await touch(user);
    return res.json({ startedAt: attempt.startedAt, timeLimitMinutes: resource.timeLimitMinutes || null, questions: questionsForTaking(resource) });
  }

  throw badRequest('Projects are submitted directly. There is nothing to start.');
});

router.post('/resources/:id/complete', async (req, res) => {
  const user = req.user;
  const resource = await menteeResource(user, oid(req.params.id));
  if (resource.type !== 'video') throw badRequest('Only videos are marked complete this way');

  let progress = await Progress.findOne({ resource: resource._id, mentee: user._id });
  if (!progress) progress = await Progress.create({ resource: resource._id, mentee: user._id, cohort: user.cohort });
  if (!progress.completedAt) {
    progress.completedAt = new Date();
    progress.marks = resource.maxMarks;
    await progress.save();
    await logActivity({ user: user._id, cohort: user.cohort, kind: 'video_completed', resource: resource._id, label: resource.title });
  }
  await touch(user);
  const result = await standing(user, (data) => syncBadges(user._id, data));
  res.json({ ok: true, marks: progress.marks, maxMarks: resource.maxMarks, ...result });
});

const quizSchema = z.object({
  answers: z.array(z.object({ questionId: z.string().min(1), selectedIndex: z.coerce.number().int().min(0) })).max(100)
});

router.post('/resources/:id/quiz', validate(quizSchema), async (req, res) => {
  const user = req.user;
  const resource = await menteeResource(user, oid(req.params.id));
  if (resource.type !== 'quiz') throw badRequest('This resource is not a quiz');

  let attempt = await Attempt.findOne({ resource: resource._id, mentee: user._id });
  if (attempt?.submittedAt) throw conflict('You have already submitted this quiz');
  if (!attempt) attempt = new Attempt({ resource: resource._id, mentee: user._id, cohort: user.cohort });

  const byId = new Map(resource.questions.map((q) => [String(q._id), q]));
  const seen = new Set();
  const answers = [];
  for (const a of req.body.answers) {
    const q = byId.get(a.questionId);
    if (!q) throw badRequest('Your answers include a question that is not part of this quiz');
    if (a.selectedIndex >= q.options.length) throw badRequest('Your answers include an option that does not exist');
    if (seen.has(a.questionId)) throw badRequest('Duplicate answer for a question');
    seen.add(a.questionId);
    answers.push({ questionId: a.questionId, selectedIndex: a.selectedIndex });
  }

  const now = new Date();
  attempt.answers = answers;
  attempt.submittedAt = now;
  attempt.late = now > resource.deadline;
  attempt.maxScore = resource.questions.reduce((s, q) => s + q.marks, 0);
  attempt.score = resource.questions.reduce((s, q) => {
    const given = answers.find((x) => x.questionId === String(q._id));
    return s + (given && given.selectedIndex === q.correctIndex ? q.marks : 0);
  }, 0);
  await attempt.save();

  await logActivity({ user: user._id, cohort: user.cohort, kind: 'quiz_attempted', resource: resource._id, label: `${resource.title}: ${attempt.score}/${attempt.maxScore}` });
  await touch(user);
  const result = await standing(user, (data) => syncBadges(user._id, data));

  res.status(201).json({
    score: attempt.score,
    maxScore: attempt.maxScore,
    pct: attempt.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : 0,
    late: attempt.late,
    breakdown: quizBreakdown(resource, attempt),
    ...result
  });
});

router.get('/resources/:id/result', async (req, res) => {
  const resource = await menteeResource(req.user, oid(req.params.id));
  if (resource.type !== 'quiz') throw badRequest('This resource is not a quiz');
  const attempt = await Attempt.findOne({ resource: resource._id, mentee: req.user._id, submittedAt: { $ne: null } });
  if (!attempt) throw notFound('Submit the quiz to see your results');
  res.json({ score: attempt.score, maxScore: attempt.maxScore, pct: attempt.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : 0, late: attempt.late, breakdown: quizBreakdown(resource, attempt) });
});

const projectSchema = z.object({
  link: httpUrl,
  notes: z.string().trim().max(4000).default('')
});

router.post('/resources/:id/project', validate(projectSchema), async (req, res) => {
  const user = req.user;
  const resource = await menteeResource(user, oid(req.params.id));
  if (resource.type !== 'project') throw badRequest('This resource is not a project');

  let submission = await Submission.findOne({ resource: resource._id, mentee: user._id });
  if (submission?.status === 'evaluated') throw conflict('This project has already been evaluated and can no longer be changed');

  const now = new Date();
  const resubmission = Boolean(submission);
  if (!submission) submission = new Submission({ resource: resource._id, mentee: user._id, cohort: user.cohort });
  submission.link = req.body.link;
  submission.notes = req.body.notes;
  submission.submittedAt = now;
  submission.late = now > resource.deadline;
  submission.status = 'submitted';
  await submission.save();

  await logActivity({ user: user._id, cohort: user.cohort, kind: 'project_submitted', resource: resource._id, label: resource.title });
  const cohort = await Cohort.findById(user.cohort).select('mentors name');
  await notifyMany(cohort.mentors, {
    type: 'submission',
    title: `${resubmission ? 'Updated' : 'New'} submission: ${resource.title}`,
    body: `${user.name} submitted${submission.late ? ' (late)' : ''}.`,
    link: `/mentor/resources/${resource._id}`
  });
  await touch(user);
  const result = await standing(user, (data) => syncBadges(user._id, data));

  res.status(201).json({
    submission: { link: submission.link, notes: submission.notes, submittedAt: submission.submittedAt, late: submission.late, status: submission.status },
    ...result
  });
});

router.get('/feedback', async (req, res) => {
  const subs = await Submission.find({ mentee: req.user._id, status: 'evaluated' }).sort({ evaluatedAt: -1 }).populate('resource', 'title maxMarks').lean();
  res.json({
    items: subs.map((s) => ({
      id: s._id,
      resourceId: s.resource?._id,
      resource: s.resource?.title,
      marks: s.marks,
      maxMarks: s.resource?.maxMarks,
      feedback: s.feedback,
      evaluatedAt: s.evaluatedAt,
      history: (s.history || []).map((h) => ({ marks: h.marks, feedback: h.feedback, at: h.at }))
    }))
  });
});

module.exports = router;
