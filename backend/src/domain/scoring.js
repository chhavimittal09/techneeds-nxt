const { dayKey, DAY } = require('../utils/time');

const WEIGHTS = { assessment: 0.6, completion: 0.25, consistency: 0.15 };
const CONSISTENCY_WINDOW_DAYS = 14;
const CONSISTENCY_TARGET_DAYS = 7;

const round1 = (n) => Math.round(n * 10) / 10;
const clamp01 = (n) => Math.max(0, Math.min(1, n));

function computeStreak(dates, now = new Date(), tz = 330) {
  const keys = [...new Set((dates || []).map((d) => dayKey(d, tz)))].sort((a, b) => a - b);
  if (!keys.length) return { current: 0, longest: 0, longestEndKey: null };

  let longest = 1;
  let longestEnd = keys[0];
  let run = 1;
  for (let i = 1; i < keys.length; i += 1) {
    run = keys[i] === keys[i - 1] + 1 ? run + 1 : 1;
    if (run >= longest) {
      longest = run;
      longestEnd = keys[i];
    }
  }

  const set = new Set(keys);
  const today = dayKey(now, tz);
  let cursor = set.has(today) ? today : set.has(today - 1) ? today - 1 : null;
  let current = 0;
  while (cursor !== null && set.has(cursor)) {
    current += 1;
    cursor -= 1;
  }
  return { current, longest, longestEndKey: longestEnd };
}

function computeMetrics(records, activityDates, now = new Date(), tz = 330) {
  const counted = records.filter((r) => r.scored && (r.status === 'evaluated' || r.deadline < now));
  const earned = counted.reduce((s, r) => s + (r.status === 'evaluated' ? r.marks || 0 : 0), 0);
  const possible = counted.reduce((s, r) => s + r.maxMarks, 0);
  const assessment = possible > 0 ? clamp01(earned / possible) : 0;

  const done = records.filter((r) => r.done);
  const completion = records.length ? done.length / records.length : 0;

  const windowStart = dayKey(now, tz) - (CONSISTENCY_WINDOW_DAYS - 1);
  const activeDays = new Set(
    (activityDates || []).map((d) => dayKey(d, tz)).filter((k) => k >= windowStart && k <= dayKey(now, tz))
  ).size;
  const withDeadline = done.filter((r) => r.onTime !== null);
  const onTimeRate = withDeadline.length ? withDeadline.filter((r) => r.onTime).length / withDeadline.length : 0;
  const consistency = clamp01(0.5 * Math.min(1, activeDays / CONSISTENCY_TARGET_DAYS) + 0.5 * onTimeRate);

  const score = 100 * (WEIGHTS.assessment * assessment + WEIGHTS.completion * completion + WEIGHTS.consistency * consistency);

  return {
    score: round1(score),
    assessment: round1(assessment * 100),
    completion: round1(completion * 100),
    consistency: round1(consistency * 100),
    detail: {
      marksEarned: earned,
      marksPossible: possible,
      resourcesDone: done.length,
      resourcesTotal: records.length,
      activeDays,
      windowDays: CONSISTENCY_WINDOW_DAYS,
      onTimeRate: round1(onTimeRate * 100),
      onTimeCount: withDeadline.filter((r) => r.onTime).length,
      completedWithDeadline: withDeadline.length,
      assessedCount: counted.length
    }
  };
}

function rankRows(rows) {
  const sorted = [...rows].sort(
    (a, b) =>
      b.metrics.score - a.metrics.score ||
      b.metrics.assessment - a.metrics.assessment ||
      b.metrics.completion - a.metrics.completion ||
      String(a.name).localeCompare(String(b.name))
  );
  let lastKey = null;
  let lastRank = 0;
  return sorted.map((row, i) => {
    const key = `${row.metrics.score}|${row.metrics.assessment}|${row.metrics.completion}`;
    if (key !== lastKey) {
      lastRank = i + 1;
      lastKey = key;
    }
    return { ...row, rank: lastRank };
  });
}

function scoreTrend(records) {
  const series = records
    .filter((r) => r.type !== 'video' && r.status === 'evaluated' && r.pct !== null && r.completedAt)
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
    .map((r) => ({ at: r.completedAt, title: r.title, type: r.type, pct: Math.round(r.pct * 100) }));

  if (series.length < 3) return { series, direction: 'insufficient', delta: 0 };
  const half = Math.floor(series.length / 2);
  const early = series.slice(0, half);
  const late = series.slice(series.length - half);
  const avg = (arr) => arr.reduce((s, p) => s + p.pct, 0) / arr.length;
  const delta = Math.round(avg(late) - avg(early));
  return { series, direction: delta >= 5 ? 'up' : delta <= -5 ? 'down' : 'steady', delta };
}

module.exports = { WEIGHTS, computeStreak, computeMetrics, rankRows, scoreTrend, DAY, round1 };
