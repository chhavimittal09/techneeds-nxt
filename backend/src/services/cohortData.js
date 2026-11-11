const { Resource, User, Progress, Attempt, Submission, Activity } = require('../models');
const { buildRecord } = require('../domain/records');
const { computeMetrics, computeStreak, rankRows } = require('../domain/scoring');
const { tzOffsetMinutes } = require('../config/env');

const COUNTABLE = ['video_started', 'video_completed', 'quiz_attempted', 'project_submitted'];

async function loadCohortData(cohortId, now = new Date()) {
  const [resources, mentees, progresses, attempts, submissions, activities] = await Promise.all([
    Resource.find({ cohort: cohortId, published: true }).lean(),
    User.find({ cohort: cohortId, role: 'mentee', active: true }).lean(),
    Progress.find({ cohort: cohortId }).lean(),
    Attempt.find({ cohort: cohortId }).lean(),
    Submission.find({ cohort: cohortId }).lean(),
    Activity.find({ cohort: cohortId, kind: { $in: COUNTABLE } }).select('user at').lean()
  ]);

  const key = (r, m) => `${r}:${m}`;
  const progressMap = new Map(progresses.map((p) => [key(p.resource, p.mentee), p]));
  const attemptMap = new Map(attempts.map((a) => [key(a.resource, a.mentee), a]));
  const submissionMap = new Map(submissions.map((s) => [key(s.resource, s.mentee), s]));

  const datesByMentee = new Map();
  for (const a of activities) {
    const k = String(a.user);
    if (!datesByMentee.has(k)) datesByMentee.set(k, []);
    datesByMentee.get(k).push(a.at);
  }

  const byMentee = new Map();
  for (const m of mentees) {
    const id = String(m._id);
    const records = resources.map((res) =>
      buildRecord(
        res,
        {
          progress: progressMap.get(key(res._id, id)),
          attempt: attemptMap.get(key(res._id, id)),
          submission: submissionMap.get(key(res._id, id))
        },
        now
      )
    );
    const dates = datesByMentee.get(id) || [];
    const metrics = computeMetrics(records, dates, now, tzOffsetMinutes);
    const streak = computeStreak(dates, now, tzOffsetMinutes);
    byMentee.set(id, { mentee: m, records, dates, metrics, streak });
  }

  const ranked = rankRows([...byMentee.values()].map((v) => ({ id: String(v.mentee._id), name: v.mentee.name, metrics: v.metrics })));
  const rankMap = new Map(ranked.map((r) => [r.id, r.rank]));

  return { resources, mentees, byMentee, rankMap, ranked, cohortSize: mentees.length, now };
}

function leaderboardRows(data, viewerId) {
  return data.ranked.map((r) => {
    const v = data.byMentee.get(r.id);
    return {
      rank: r.rank,
      id: r.id,
      name: v.mentee.name,
      avatar: avatarSpec(v.mentee),
      score: v.metrics.score,
      assessment: v.metrics.assessment,
      completion: v.metrics.completion,
      consistency: v.metrics.consistency,
      resourcesDone: v.metrics.detail.resourcesDone,
      resourcesTotal: v.metrics.detail.resourcesTotal,
      streak: v.streak.current,
      badgeCount: (v.mentee.badges || []).length,
      badges: (v.mentee.badges || []).slice(-3).map((b) => b.key),
      isYou: viewerId ? String(viewerId) === r.id : false
    };
  });
}

const PALETTE = ['#7c5cff', '#4f7cff', '#2bb7ff', '#b6f23a', '#ff7a6b', '#f2b84b'];

function avatarSpec(user) {
  const seed = user.avatar?.seed || user.enrollmentNumber || user.name || 'nxt';
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const initials = String(user.name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
  return {
    style: user.avatar?.style || 'orbit',
    seed,
    accent: user.avatar?.accent || PALETTE[h % PALETTE.length],
    initials
  };
}

module.exports = { loadCohortData, leaderboardRows, avatarSpec, COUNTABLE };
