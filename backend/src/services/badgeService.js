const { User } = require('../models');
const { evaluateBadges, badgeDef } = require('../domain/badges');
const { computeStreak } = require('../domain/scoring');
const { loadCohortData } = require('./cohortData');
const { logActivity, notify } = require('./events');
const { tzOffsetMinutes } = require('../config/env');

async function syncBadges(menteeId, preloaded) {
  const user = await User.findById(menteeId);
  if (!user || !user.cohort) return [];
  const data = preloaded || (await loadCohortData(user.cohort));
  const v = data.byMentee.get(String(user._id));
  if (!v) return [];

  const earnedKeys = evaluateBadges({
    records: v.records,
    streak: computeStreak(v.dates, data.now, tzOffsetMinutes),
    rank: data.rankMap.get(String(user._id)) ?? null,
    cohortSize: data.cohortSize
  });

  const have = new Set((user.badges || []).map((b) => b.key));
  const fresh = earnedKeys.filter((k) => !have.has(k));
  if (!fresh.length) return [];

  const now = new Date();
  user.badges.push(...fresh.map((key) => ({ key, earnedAt: now })));
  await user.save();

  for (const key of fresh) {
    const def = badgeDef(key);
    await logActivity({ user: user._id, cohort: user.cohort, kind: 'badge_earned', label: def.title, meta: { key } });
    await notify(user._id, { type: 'badge', title: `Badge unlocked: ${def.title}`, body: def.criteria, link: '/mentee/my-nxt' });
  }
  return fresh.map((key) => badgeDef(key));
}

module.exports = { syncBadges };
