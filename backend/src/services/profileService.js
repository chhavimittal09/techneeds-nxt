const { User, Cohort } = require('../models');
const { buildProfile } = require('../domain/insights');
const { BADGE_DEFS } = require('../domain/badges');
const { loadCohortData, avatarSpec } = require('./cohortData');
const { tzOffsetMinutes } = require('../config/env');
const { notFound } = require('../utils/errors');

async function computeFor(user) {
  const now = new Date();
  const data = await loadCohortData(user.cohort, now);
  const v = data.byMentee.get(String(user._id));
  const profile = buildProfile({
    user,
    records: v.records,
    activityDates: v.dates,
    earnedBadges: user.badges || [],
    rank: data.rankMap.get(String(user._id)) ?? null,
    cohortSize: data.cohortSize,
    metrics: v.metrics,
    now,
    tz: tzOffsetMinutes
  });
  return { profile, data, v };
}

function badgeShelf(user) {
  const earned = new Map((user.badges || []).map((b) => [b.key, b.earnedAt]));
  return BADGE_DEFS.map((def) => ({ ...def, earned: earned.has(def.key), earnedAt: earned.get(def.key) || null }));
}

async function getMyProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw notFound('User not found');
  const cohort = await Cohort.findById(user.cohort).populate('program', 'name').lean();
  const { profile } = await computeFor(user);
  return {
    user: {
      id: user._id,
      name: user.name,
      interests: user.interests,
      avatar: avatarSpec(user),
      cohort: cohort ? { id: cohort._id, name: cohort.name, program: cohort.program?.name } : null,
      joinedAt: user.createdAt
    },
    share: { enabled: Boolean(user.share?.enabled), id: user.share?.enabled ? user.share.id : null },
    badges: badgeShelf(user),
    ...profile
  };
}

async function getPublicProfile(shareId) {
  const user = await User.findOne({ 'share.id': shareId, 'share.enabled': true, active: true });
  if (!user) throw notFound('This profile is not shared');
  const cohort = await Cohort.findById(user.cohort).populate('program', 'name').lean();
  const { profile } = await computeFor(user);
  const parts = user.name.trim().split(/\s+/);
  const displayName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];

  return {
    user: { name: displayName, avatar: { ...avatarSpec(user), initials: displayName.slice(0, 1).toUpperCase() }, program: cohort?.program?.name || null, joinedAt: user.createdAt },
    badges: badgeShelf(user).filter((b) => b.earned),
    archetype: profile.archetype,
    skills: profile.skills.filter((s) => s.proficiency !== null || s.source === 'interest'),
    stats: {
      completed: profile.stats.completed,
      total: profile.stats.total,
      streakLongest: profile.stats.streak.longest,
      rank: profile.stats.rank,
      cohortSize: profile.stats.cohortSize
    },
    timeline: profile.timeline.filter((e) => ['badge', 'first_quiz', 'first_project', 'first_video', 'improvement', 'streak', 'skill'].includes(e.kind)).slice(0, 12),
    summary: profile.summary
  };
}

module.exports = { computeFor, getMyProfile, getPublicProfile, badgeShelf };
