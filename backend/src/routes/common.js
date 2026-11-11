const express = require('express');
const { z } = require('zod');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate, oid, escapeRegex } = require('../middleware/validate');
const { User, Cohort, Program, Resource, Notification, Activity } = require('../models');
const { loadCohortData, leaderboardRows, avatarSpec } = require('../services/cohortData');
const { mentorCohortIds } = require('../services/access');
const { getMyProfile, getPublicProfile } = require('../services/profileService');
const { getNarrative, isEnabled } = require('../services/ai');
const { WEIGHTS } = require('../domain/scoring');
const { BADGE_DEFS } = require('../domain/badges');
const { CANONICAL_SKILLS } = require('../domain/skills');
const { randomToken } = require('../utils/password');
const { forbidden, badRequest } = require('../utils/errors');

const router = express.Router();
const publicRouter = express.Router();

publicRouter.get('/profile/:shareId', async (req, res) => {
  res.json(await getPublicProfile(req.params.shareId));
});

router.use(authenticate);

router.get('/meta/config', (req, res) => {
  res.json({
    weights: WEIGHTS,
    formula: {
      assessment: 'Marks earned divided by marks available on assessed resources (evaluated, or past deadline).',
      completion: 'Resources submitted or completed divided by resources published to your cohort.',
      consistency: 'Half active days in the last 14 (7 days is full marks), half share of resources finished on time.'
    },
    aiEnabled: isEnabled(),
    skills: CANONICAL_SKILLS,
    badges: BADGE_DEFS
  });
});

router.get('/leaderboard', async (req, res) => {
  const user = req.user;
  let cohortId;

  if (user.role === 'mentee') {
    cohortId = user.cohort;
  } else if (user.role === 'mentor') {
    const ids = (await mentorCohortIds(user)).map(String);
    cohortId = req.query.cohort ? oid(req.query.cohort, 'cohort') : ids[0];
    if (cohortId && !ids.includes(String(cohortId))) throw forbidden('You are not assigned to this cohort');
  } else {
    cohortId = req.query.cohort ? oid(req.query.cohort, 'cohort') : (await Cohort.findOne({ status: 'active' }).sort({ createdAt: -1 }))?._id;
  }

  if (!cohortId) return res.json({ cohort: null, rows: [], top3: [], me: null, weights: WEIGHTS });

  const cohort = await Cohort.findById(cohortId).populate('program', 'name').lean();
  const data = await loadCohortData(cohortId);
  const rows = leaderboardRows(data, user.role === 'mentee' ? user._id : null);
  res.json({
    cohort: { id: cohort._id, name: cohort.name, program: cohort.program?.name },
    weights: WEIGHTS,
    rows,
    top3: rows.filter((r) => r.rank <= 3).slice(0, 3),
    me: rows.find((r) => r.isYou) || null,
    totalResources: data.resources.length
  });
});

router.get('/notifications', async (req, res) => {
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30).lean(),
    Notification.countDocuments({ user: req.user._id, read: false })
  ]);
  res.json({ items, unread });
});

router.post('/notifications/read', validate(z.object({ ids: z.array(z.string()).optional() })), async (req, res) => {
  const filter = { user: req.user._id, read: false };
  if (req.body.ids?.length) filter._id = { $in: req.body.ids.filter((i) => oid(i, 'notification id')) };
  await Notification.updateMany(filter, { $set: { read: true } });
  res.json({ ok: true });
});

router.get('/activity', async (req, res) => {
  const user = req.user;
  const filter = {};
  if (user.role === 'mentee') filter.user = user._id;
  else if (user.role === 'mentor') filter.cohort = { $in: await mentorCohortIds(user) };
  const items = await Activity.find(filter).sort({ at: -1 }).limit(25).populate('user', 'name').populate('resource', 'title type').lean();
  res.json({
    items: items.map((a) => ({
      id: a._id,
      kind: a.kind,
      at: a.at,
      label: a.label,
      actor: a.user?.name || 'Someone',
      resource: a.resource ? { id: a.resource._id, title: a.resource.title, type: a.resource.type } : null
    }))
  });
});

router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 60);
  if (q.length < 2) return res.json({ results: [] });
  const rx = new RegExp(escapeRegex(q), 'i');
  const user = req.user;
  const results = [];

  if (user.role === 'mentee') {
    const resources = await Resource.find({ cohort: user.cohort, published: true, $or: [{ title: rx }, { description: rx }, { skills: rx }] }).limit(8).lean();
    resources.forEach((r) => results.push({ kind: 'resource', id: r._id, title: r.title, subtitle: r.type, href: `/mentee/resources/${r._id}` }));
  } else if (user.role === 'mentor') {
    const cohortIds = await mentorCohortIds(user);
    const [resources, mentees] = await Promise.all([
      Resource.find({ cohort: { $in: cohortIds }, $or: [{ title: rx }, { skills: rx }] }).limit(6).lean(),
      User.find({ cohort: { $in: cohortIds }, role: 'mentee', $or: [{ name: rx }, { enrollmentNumber: rx }] }).limit(6).lean()
    ]);
    resources.forEach((r) => results.push({ kind: 'resource', id: r._id, title: r.title, subtitle: r.type, href: `/mentor/resources/${r._id}` }));
    mentees.forEach((m) => results.push({ kind: 'mentee', id: m._id, title: m.name, subtitle: m.enrollmentNumber, href: `/mentor/mentees/${m._id}` }));
  } else {
    const [programs, cohorts, people] = await Promise.all([
      Program.find({ name: rx }).limit(4).lean(),
      Cohort.find({ name: rx }).limit(4).lean(),
      User.find({ role: { $in: ['mentor', 'mentee'] }, $or: [{ name: rx }, { email: rx }, { enrollmentNumber: rx }] }).limit(8).lean()
    ]);
    programs.forEach((p) => results.push({ kind: 'program', id: p._id, title: p.name, subtitle: 'Program', href: '/admin/programs' }));
    cohorts.forEach((c) => results.push({ kind: 'cohort', id: c._id, title: c.name, subtitle: 'Cohort', href: `/admin/cohorts` }));
    people.forEach((p) => results.push({ kind: p.role, id: p._id, title: p.name, subtitle: p.email || p.enrollmentNumber, href: p.role === 'mentor' ? '/admin/mentors' : '/admin/mentees' }));
  }
  res.json({ results });
});

const profileRouter = express.Router();
profileRouter.use(requireRole('mentee'));

profileRouter.get('/', async (req, res) => {
  const profile = await getMyProfile(req.user._id);
  const narrative = isEnabled() ? await getNarrative(req.user, profile) : { available: false };
  res.json({ ...profile, narrative });
});

const profileUpdate = z.object({
  interests: z.array(z.string().trim().min(1).max(30)).max(8).optional(),
  avatar: z
    .object({
      style: z.enum(['orbit', 'prism', 'pixel', 'wave', 'grid']).optional(),
      seed: z.string().trim().max(40).optional(),
      accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour like #7c5cff').optional()
    })
    .optional()
});

profileRouter.put('/', validate(profileUpdate), async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.interests) user.interests = [...new Set(req.body.interests.map((s) => s.trim()))];
  for (const field of ['style', 'seed', 'accent']) {
    if (req.body.avatar?.[field] !== undefined) user.set(`avatar.${field}`, req.body.avatar[field]);
  }
  await user.save();
  res.json({ avatar: avatarSpec(user), interests: user.interests });
});

profileRouter.post('/share', validate(z.object({ enabled: z.boolean() })), async (req, res) => {
  const user = await User.findById(req.user._id);
  user.share.enabled = req.body.enabled;
  if (req.body.enabled && !user.share.id) user.share.id = randomToken(12);
  await user.save();
  res.json({ enabled: user.share.enabled, id: user.share.enabled ? user.share.id : null });
});

profileRouter.post('/narrative', async (req, res) => {
  if (!isEnabled()) throw badRequest('AI summaries are not configured on this server');
  const profile = await getMyProfile(req.user._id);
  res.json(await getNarrative(req.user, profile, { force: true }));
});

router.use('/profile', profileRouter);

module.exports = { router, publicRouter };
