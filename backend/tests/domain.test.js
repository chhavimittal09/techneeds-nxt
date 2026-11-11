const test = require('node:test');
const assert = require('node:assert/strict');
const { buildRecord } = require('../src/domain/records');
const { computeMetrics, computeStreak, rankRows, scoreTrend } = require('../src/domain/scoring');
const { evaluateBadges } = require('../src/domain/badges');
const { buildProfile } = require('../src/domain/insights');

const DAY = 86400000;
const now = new Date('2026-11-11T10:00:00Z');
const ago = (d) => new Date(now.getTime() - d * DAY);
const ahead = (d) => new Date(now.getTime() + d * DAY);

const res = (over) => ({ _id: Math.random().toString(36).slice(2), type: 'quiz', title: 'R', skills: [], maxMarks: 10, deadline: ahead(3), ...over });

test('video without progress is not_started and becomes overdue after deadline', () => {
  assert.equal(buildRecord(res({ type: 'video', deadline: ahead(2) }), {}, now).status, 'not_started');
  assert.equal(buildRecord(res({ type: 'video', deadline: ago(1) }), {}, now).status, 'overdue');
});

test('video in progress then completed', () => {
  const r = res({ type: 'video', maxMarks: 5 });
  assert.equal(buildRecord(r, { progress: { startedAt: ago(1) } }, now).status, 'in_progress');
  const done = buildRecord(r, { progress: { startedAt: ago(1), completedAt: ago(0.5) } }, now);
  assert.equal(done.status, 'evaluated');
  assert.equal(done.marks, 5);
  assert.equal(done.onTime, true);
});

test('quiz attempt is evaluated with stored score', () => {
  const r = res({ type: 'quiz', maxMarks: 10 });
  const rec = buildRecord(r, { attempt: { submittedAt: ago(1), score: 7, maxScore: 10 } }, now);
  assert.equal(rec.status, 'evaluated');
  assert.equal(rec.pct, 0.7);
});

test('project moves submitted to evaluated and late submissions are flagged by onTime', () => {
  const r = res({ type: 'project', maxMarks: 100, deadline: ago(2) });
  const sub = buildRecord(r, { submission: { submittedAt: ago(1), status: 'submitted' } }, now);
  assert.equal(sub.status, 'submitted');
  assert.equal(sub.onTime, false);
  const ev = buildRecord(r, { submission: { submittedAt: ago(1), status: 'evaluated', marks: 80, feedback: 'ok' } }, now);
  assert.equal(ev.status, 'evaluated');
  assert.equal(ev.pct, 0.8);
  assert.ok(ev.skills.includes('Project Development'));
});

test('assessment only counts evaluated or past-deadline scored resources', () => {
  const upcoming = buildRecord(res({ deadline: ahead(5) }), {}, now);
  const pastMissed = buildRecord(res({ deadline: ago(1) }), {}, now);
  const taken = buildRecord(res({ maxMarks: 10 }), { attempt: { submittedAt: ago(1), score: 10, maxScore: 10 } }, now);
  const m = computeMetrics([upcoming, pastMissed, taken], [ago(1)], now);
  assert.equal(m.detail.marksPossible, 20);
  assert.equal(m.assessment, 50);
});

test('formula weights are 60/25/15', () => {
  const taken = buildRecord(res({ maxMarks: 10 }), { attempt: { submittedAt: ago(1), score: 10, maxScore: 10 } }, now);
  const m = computeMetrics([taken], [], now);
  assert.equal(m.assessment, 100);
  assert.equal(m.completion, 100);
  assert.ok(m.consistency > 0 && m.consistency <= 50);
  const expected = Math.round((0.6 * 100 + 0.25 * 100 + 0.15 * m.consistency) * 10) / 10;
  assert.equal(m.score, expected);
});

test('streak counts consecutive days ending today or yesterday', () => {
  const s = computeStreak([ago(0), ago(1), ago(2), ago(5)], now, 0);
  assert.equal(s.current, 3);
  assert.equal(s.longest, 3);
  assert.equal(computeStreak([ago(3), ago(4)], now, 0).current, 0);
  assert.equal(computeStreak([ago(1), ago(2)], now, 0).current, 2);
});

test('ranking uses standard competition ranking for ties', () => {
  const row = (name, score) => ({ id: name, name, metrics: { score, assessment: score, completion: score } });
  const ranked = rankRows([row('b', 50), row('a', 80), row('c', 80), row('d', 10)]);
  assert.deepEqual(ranked.map((r) => [r.name, r.rank]), [['a', 1], ['c', 1], ['b', 3], ['d', 4]]);
});

test('trend needs three assessments and detects improvement', () => {
  const mk = (pct, d) => buildRecord(res({ maxMarks: 100 }), { attempt: { submittedAt: ago(d), score: pct, maxScore: 100 } }, now);
  assert.equal(scoreTrend([mk(50, 5), mk(60, 3)]).direction, 'insufficient');
  const t = scoreTrend([mk(40, 6), mk(55, 4), mk(60, 3), mk(85, 1)]);
  assert.equal(t.direction, 'up');
  assert.ok(t.delta >= 10);
});

test('badges are earned only from real milestones', () => {
  const empty = evaluateBadges({ records: [], streak: { longest: 0 }, rank: null, cohortSize: 5 });
  assert.deepEqual(empty, []);
  const perfect = buildRecord(res({ maxMarks: 5 }), { attempt: { submittedAt: ago(1), score: 5, maxScore: 5 } }, now);
  const earned = evaluateBadges({ records: [perfect], streak: { longest: 1 }, rank: 1, cohortSize: 5 });
  assert.ok(earned.includes('first_step'));
  assert.ok(earned.includes('quiz_master'));
  assert.ok(!earned.includes('top_performer'));
});

function profileFor(records, interests = []) {
  const dates = records.filter((r) => r.completedAt).map((r) => r.completedAt);
  const metrics = computeMetrics(records, dates, now);
  return buildProfile({ user: { name: 'T', interests, createdAt: ago(20) }, records, activityDates: dates, earnedBadges: [], rank: 2, cohortSize: 6, metrics, now, tz: 0 });
}

test('profile is the newcomer archetype with no evidence and never invents skills', () => {
  const p = profileFor([buildRecord(res({ skills: ['Web Development'] }), {}, now)]);
  assert.equal(p.archetype.key, 'newcomer');
  assert.equal(p.skills.length, 0);
  assert.equal(p.hasEnoughData, false);
});

test('interest-only skills carry no proficiency', () => {
  const p = profileFor([], ['Machine Learning']);
  const ml = p.skills.find((s) => s.name === 'Machine Learning');
  assert.equal(ml.proficiency, null);
  assert.equal(ml.level, 'Interest');
});

test('different activity produces different profiles', () => {
  const quiz = (pct, d, skills) => buildRecord(res({ maxMarks: 100, skills, deadline: ahead(2) }), { attempt: { submittedAt: ago(d), score: pct, maxScore: 100 } }, now);
  const analytical = profileFor([quiz(95, 3, ['Programming']), quiz(92, 2, ['Programming']), quiz(98, 1, ['Data Analysis'])]);
  const weak = profileFor([quiz(30, 3, ['Web Development']), quiz(35, 2, ['Web Development'])]);
  assert.notEqual(analytical.archetype.key, 'newcomer');
  assert.ok(analytical.strengths.length > 0);
  assert.ok(weak.improvements.some((i) => i.title.includes('Web Development')));
  assert.notDeepEqual(analytical.skills.map((s) => s.proficiency), weak.skills.map((s) => s.proficiency));
});

test('recommendations prioritise overdue work and explain why', () => {
  const overdue = buildRecord(res({ title: 'Late one', deadline: ago(3) }), {}, now);
  const next = buildRecord(res({ title: 'Soon', deadline: ahead(2) }), {}, now);
  const p = profileFor([overdue, next]);
  assert.equal(p.recommendations[0].kind, 'overdue');
  assert.ok(p.recommendations[0].reason.length > 10);
  assert.ok(p.recommendations.some((r) => r.kind === 'next'));
});
