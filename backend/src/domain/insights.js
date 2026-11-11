const { levelFor, normalizeSkills } = require('./skills');
const { scoreTrend, computeStreak } = require('./scoring');
const { badgeDef } = require('./badges');
const { DAY } = require('../utils/time');

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ARCHETYPES = {
  consistent_builder: { title: 'The Consistent Builder', tagline: 'Shows up regularly and ships real work.', icon: 'layers' },
  analytical_thinker: { title: 'The Analytical Thinker', tagline: 'Strong at reasoning through assessments.', icon: 'brain' },
  creative_explorer: { title: 'The Creative Explorer', tagline: 'Spreads curiosity across many areas.', icon: 'compass' },
  problem_solver: { title: 'The Problem Solver', tagline: 'Improves by tackling hard problems head on.', icon: 'puzzle' },
  fast_learner: { title: 'The Fast Learner', tagline: 'Finishes work well ahead of the deadline.', icon: 'zap' },
  newcomer: { title: 'The Newcomer', tagline: 'Your archetype unlocks as your activity grows.', icon: 'sprout' }
};

const mean = (arr) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : null);
const pctText = (n) => `${Math.round(n)}%`;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const fmtDate = (d) => new Date(d).toISOString().slice(0, 10);

function computeSkillMap(records, interests) {
  const map = new Map();
  const touch = (name) => {
    if (!map.has(name)) map.set(name, { name, marks: 0, max: 0, scored: 0, exposure: 0, firstAt: null });
    return map.get(name);
  };

  for (const r of records) {
    if (!r.done) continue;
    for (const skill of r.skills) {
      const entry = touch(skill);
      const at = r.completedAt ? new Date(r.completedAt) : null;
      if (at && (!entry.firstAt || at < entry.firstAt)) entry.firstAt = at;
      if (r.type !== 'video' && r.status === 'evaluated' && r.scored && r.marks !== null) {
        entry.marks += r.marks;
        entry.max += r.maxMarks;
        entry.scored += 1;
      } else {
        entry.exposure += 1;
      }
    }
  }

  const skills = [...map.values()].map((e) => {
    if (e.scored > 0) {
      const proficiency = Math.round((100 * e.marks) / e.max);
      return {
        name: e.name,
        proficiency,
        level: levelFor(proficiency),
        source: 'activity',
        evidence: { assessments: e.scored, exposure: e.exposure },
        limitedEvidence: e.scored === 1,
        firstAt: e.firstAt
      };
    }
    return {
      name: e.name,
      proficiency: null,
      level: 'Exposure',
      source: 'activity',
      evidence: { assessments: 0, exposure: e.exposure },
      limitedEvidence: true,
      firstAt: e.firstAt
    };
  });

  const have = new Set(skills.map((s) => s.name.toLowerCase()));
  for (const name of normalizeSkills(interests)) {
    if (!have.has(name.toLowerCase())) {
      skills.push({ name, proficiency: null, level: 'Interest', source: 'interest', evidence: { assessments: 0, exposure: 0 }, limitedEvidence: true, firstAt: null });
    }
  }

  return skills.sort((a, b) => (b.proficiency ?? -1) - (a.proficiency ?? -1) || b.evidence.exposure - a.evidence.exposure);
}

function computeArchetype({ records, metrics, skills, interests, trend }) {
  const done = records.filter((r) => r.done);
  const quizzes = records.filter((r) => r.type === 'quiz' && r.status === 'evaluated' && r.pct !== null);
  const projectsDone = records.filter((r) => r.type === 'project' && r.done);
  const projectsEvaluated = records.filter((r) => r.type === 'project' && r.status === 'evaluated' && r.pct !== null);
  const quizAvg = mean(quizzes.map((r) => r.pct));
  const projectAvg = mean(projectsEvaluated.map((r) => r.pct));
  const leads = done.filter((r) => r.completedAt).map((r) => Math.max(0, (new Date(r.deadline) - new Date(r.completedAt)) / DAY));
  const avgLead = mean(leads);
  const evidenced = skills.filter((s) => s.source === 'activity');
  const psSkill = skills.find((s) => s.name === 'Problem Solving' && s.proficiency !== null);
  const consistency = metrics.consistency / 100;
  const completion = metrics.completion / 100;

  if (done.length < 2) {
    return {
      key: 'newcomer',
      ...ARCHETYPES.newcomer,
      confidence: 0,
      reasons: [`${plural(done.length, 'resource')} completed so far. Finish at least 2 to unlock your archetype.`],
      alternatives: []
    };
  }

  const candidates = [];

  candidates.push({
    key: 'consistent_builder',
    score: 0.45 * consistency + 0.3 * Math.min(1, projectsDone.length / 2) + 0.25 * completion,
    reasons: [
      `Active on ${metrics.detail.activeDays} of the last ${metrics.detail.windowDays} days`,
      metrics.detail.completedWithDeadline
        ? `${metrics.detail.onTimeCount} of ${metrics.detail.completedWithDeadline} completed resources were on time`
        : null,
      projectsDone.length ? `${plural(projectsDone.length, 'project')} submitted` : null
    ]
  });

  if (quizzes.length) {
    candidates.push({
      key: 'analytical_thinker',
      score: 0.7 * quizAvg + 0.3 * Math.min(1, quizzes.length / 3),
      reasons: [`Average quiz score of ${pctText(quizAvg * 100)} across ${plural(quizzes.length, 'quiz', 'quizzes')}`]
    });
  }

  candidates.push({
    key: 'creative_explorer',
    score: 0.6 * Math.min(1, evidenced.length / 5) + 0.4 * Math.min(1, (interests || []).length / 4),
    reasons: [
      `Activity across ${plural(evidenced.length, 'skill area')}`,
      (interests || []).length ? `${plural(interests.length, 'interest tag')} declared` : null
    ]
  });

  const trendPart = Math.min(1, Math.max(0, trend.delta) / 25);
  const base = psSkill ? psSkill.proficiency / 100 : projectAvg !== null ? projectAvg * 0.8 : 0;
  candidates.push({
    key: 'problem_solver',
    score: 0.5 * trendPart + 0.5 * base,
    reasons: [
      psSkill ? `${psSkill.proficiency}% in Problem Solving across ${plural(psSkill.evidence.assessments, 'assessment')}` : null,
      projectAvg !== null ? `Project average of ${pctText(projectAvg * 100)}` : null,
      trend.direction === 'up' ? `Assessment scores up ${trend.delta} points over time` : null
    ]
  });

  if (leads.length >= 2) {
    candidates.push({
      key: 'fast_learner',
      score: 0.6 * Math.min(1, avgLead / 3) + 0.4 * completion,
      reasons: [`Finishes work about ${avgLead.toFixed(1)} days before deadlines on average`, `${pctText(metrics.completion)} of published resources completed`]
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const top = candidates[0];
  if (!top || top.score < 0.25) {
    return {
      key: 'newcomer',
      ...ARCHETYPES.newcomer,
      confidence: 0,
      reasons: ['Not enough strong signals yet. Keep completing resources to sharpen your profile.'],
      alternatives: []
    };
  }

  return {
    key: top.key,
    ...ARCHETYPES[top.key],
    confidence: Math.round(top.score * 100),
    reasons: top.reasons.filter(Boolean),
    alternatives: candidates.slice(1, 3).map((c) => ({ key: c.key, title: ARCHETYPES[c.key].title, confidence: Math.round(c.score * 100) }))
  };
}

function computePatterns({ records, activityDates, metrics, streak, tz }) {
  const out = [];
  const dates = (activityDates || []).map((d) => new Date(d));

  if (dates.length >= 4) {
    const days = new Array(7).fill(0);
    const buckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    for (const d of dates) {
      const local = d.getTime() + tz * 60000;
      days[(Math.floor(local / DAY) + 4) % 7] += 1;
      const hour = Math.floor((((local % DAY) + DAY) % DAY) / 3600000);
      if (hour >= 5 && hour < 12) buckets.morning += 1;
      else if (hour >= 12 && hour < 17) buckets.afternoon += 1;
      else if (hour >= 17 && hour < 22) buckets.evening += 1;
      else buckets.night += 1;
    }
    const topDay = days.indexOf(Math.max(...days));
    const topBucket = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
    out.push({ title: `Most active on ${WEEKDAYS[topDay]}s`, detail: `${days[topDay]} of ${dates.length} logged actions happened on that day.` });
    out.push({ title: `Mostly a ${topBucket[0]} learner`, detail: `${topBucket[1]} of ${dates.length} actions fell in the ${topBucket[0]}.` });
  }

  const quizzes = records.filter((r) => r.type === 'quiz' && r.status === 'evaluated' && r.pct !== null);
  const projects = records.filter((r) => r.type === 'project' && r.status === 'evaluated' && r.pct !== null);
  if (quizzes.length && projects.length) {
    const q = mean(quizzes.map((r) => r.pct)) * 100;
    const p = mean(projects.map((r) => r.pct)) * 100;
    out.push({
      title: q >= p ? 'Quizzes outscore projects' : 'Projects outscore quizzes',
      detail: `Quiz average ${pctText(q)} versus project average ${pctText(p)}.`
    });
  }

  const leads = records.filter((r) => r.done && r.completedAt).map((r) => (new Date(r.deadline) - new Date(r.completedAt)) / DAY);
  if (leads.length >= 2) {
    const avg = mean(leads);
    out.push({
      title: avg >= 0 ? 'Tends to finish early' : 'Tends to finish late',
      detail: `On average ${Math.abs(avg).toFixed(1)} days ${avg >= 0 ? 'before' : 'after'} the deadline.`
    });
  }

  if (streak.longest >= 2) {
    out.push({ title: `Longest streak: ${plural(streak.longest, 'day')}`, detail: streak.current ? `Current streak is ${plural(streak.current, 'day')}.` : 'No active streak right now.' });
  }
  return out;
}

function computeStrengthsAndGaps({ records, metrics, skills, trend }) {
  const strengths = [];
  const improvements = [];
  const done = records.filter((r) => r.done);
  const overdue = records.filter((r) => r.status === 'overdue');

  for (const s of skills.filter((x) => x.proficiency !== null)) {
    const evidence = `${s.proficiency}% across ${plural(s.evidence.assessments, 'assessment')}${s.limitedEvidence ? ' (limited evidence)' : ''}`;
    if (s.proficiency >= 75) strengths.push({ title: `Strong in ${s.name}`, detail: evidence });
    else if (s.proficiency < 60) improvements.push({ title: `Strengthen ${s.name}`, detail: evidence });
  }

  if (done.length >= 3 && metrics.consistency >= 70) strengths.push({ title: 'Reliable rhythm', detail: `Consistency score of ${pctText(metrics.consistency)}.` });
  if (metrics.detail.completedWithDeadline >= 3 && metrics.detail.onTimeRate >= 80) {
    strengths.push({ title: 'Dependable on deadlines', detail: `${metrics.detail.onTimeCount} of ${metrics.detail.completedWithDeadline} resources finished on time.` });
  }
  if (trend.direction === 'up') strengths.push({ title: 'Scores are climbing', detail: `Up ${trend.delta} points between early and recent assessments.` });

  if (overdue.length) {
    improvements.push({ title: `${plural(overdue.length, 'overdue resource')}`, detail: overdue.slice(0, 3).map((r) => r.title).join(', ') });
  }
  if (done.length >= 2 && metrics.consistency < 40) improvements.push({ title: 'Build a steadier rhythm', detail: `Consistency score is ${pctText(metrics.consistency)}.` });
  if (trend.direction === 'down') improvements.push({ title: 'Recent scores are slipping', detail: `Down ${Math.abs(trend.delta)} points between early and recent assessments.` });

  const projectsPublished = records.filter((r) => r.type === 'project');
  if (projectsPublished.length && !projectsPublished.some((r) => r.done)) {
    improvements.push({ title: 'No project submitted yet', detail: `${plural(projectsPublished.length, 'project')} available in your cohort.` });
  }
  return { strengths, improvements };
}

function computeRecommendations({ records, skills, interests, now }) {
  const open = records.filter((r) => !r.done);
  const picks = [];
  const used = new Set();
  const add = (rec, kind, reason) => {
    if (!rec || used.has(rec.id) || picks.length >= 4) return;
    used.add(rec.id);
    picks.push({ kind, resourceId: rec.id, resourceType: rec.type, title: rec.title, deadline: rec.deadline, reason });
  };

  open
    .filter((r) => r.status === 'overdue')
    .sort((a, b) => a.deadline - b.deadline)
    .slice(0, 2)
    .forEach((r) => {
      const days = Math.max(1, Math.floor((now - r.deadline) / DAY));
      add(r, 'overdue', `This was due ${plural(days, 'day')} ago. Finishing it now keeps your completion and consistency scores moving.`);
    });

  const weak = skills.filter((s) => s.proficiency !== null && s.proficiency < 60).sort((a, b) => a.proficiency - b.proficiency)[0];
  if (weak) {
    const match = open.find((r) => r.skills.includes(weak.name));
    if (match) add(match, 'improve', `Your ${weak.name} score is ${weak.proficiency}% across ${plural(weak.evidence.assessments, 'assessment')}. This resource covers the same skill.`);
  }

  open
    .filter((r) => r.status !== 'overdue')
    .sort((a, b) => a.deadline - b.deadline)
    .slice(0, 1)
    .forEach((r) => {
      const days = Math.ceil((r.deadline - now) / DAY);
      add(r, 'next', `Closest upcoming deadline, ${days <= 0 ? 'due today' : `in ${plural(days, 'day')}`}.`);
    });

  const interestSet = new Set(normalizeSkills(interests).map((s) => s.toLowerCase()));
  const interestMatch = open.find((r) => r.skills.some((s) => interestSet.has(s.toLowerCase())));
  if (interestMatch) {
    const hit = interestMatch.skills.find((s) => interestSet.has(s.toLowerCase()));
    add(interestMatch, 'interest', `Matches your interest in ${hit}.`);
  }

  if (!picks.length) {
    if (!records.length) {
      return [{ kind: 'wait', title: 'Waiting for your first resource', reason: 'Your mentor has not published anything for your cohort yet.' }];
    }
    return [{ kind: 'caught_up', title: 'You are all caught up', reason: 'Every published resource is done. New work will appear here as your mentor publishes it.' }];
  }
  return picks;
}

function computeTimeline({ user, records, earnedBadges, streak, tz }) {
  const events = [];
  if (user.createdAt) events.push({ at: user.createdAt, kind: 'joined', title: 'Joined TechNeeds NXT', detail: '', tone: 'neutral' });

  const doneSorted = records.filter((r) => r.done && r.completedAt).sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
  const seenType = new Set();
  let lastPct = null;
  const firstSkill = new Map();

  for (const r of doneSorted) {
    const first = !seenType.has(r.type);
    seenType.add(r.type);
    const label = { video: 'video', quiz: 'quiz', project: 'project' }[r.type];
    const resultText =
      r.status === 'evaluated' && r.pct !== null && r.type !== 'video' ? ` Scored ${r.marks}/${r.maxMarks} (${pctText(r.pct * 100)}).` : r.type === 'project' ? ' Awaiting evaluation.' : '';
    events.push({
      at: r.completedAt,
      kind: first ? `first_${r.type}` : r.type,
      title: first ? `First ${label}: ${r.title}` : `Completed ${label}: ${r.title}`,
      detail: resultText.trim(),
      tone: first ? 'milestone' : 'neutral'
    });

    if (r.type !== 'video' && r.status === 'evaluated' && r.pct !== null) {
      const at = r.evaluatedAt || r.completedAt;
      const pct = Math.round(r.pct * 100);
      if (lastPct !== null && pct - lastPct >= 10) {
        events.push({ at, kind: 'improvement', title: `Score improved from ${lastPct}% to ${pct}%`, detail: r.title, tone: 'positive' });
      }
      lastPct = pct;
    }
    for (const s of r.skills) if (!firstSkill.has(s)) firstSkill.set(s, r.completedAt);
  }

  for (const [skill, at] of firstSkill) events.push({ at, kind: 'skill', title: `Started building ${skill}`, detail: '', tone: 'neutral' });

  for (const b of earnedBadges || []) {
    const def = badgeDef(b.key);
    if (def) events.push({ at: b.earnedAt, kind: 'badge', title: `Badge earned: ${def.title}`, detail: def.criteria, tone: 'award' });
  }

  if (streak.longest >= 3 && streak.longestEndKey !== null) {
    const at = new Date(streak.longestEndKey * DAY - tz * 60000 + DAY / 2);
    events.push({ at, kind: 'streak', title: `${streak.longest}-day learning streak`, detail: '', tone: 'positive' });
  }

  return events.sort((a, b) => new Date(b.at) - new Date(a.at));
}

function buildSummary({ stats, skills, trend, archetype }) {
  if (stats.completed === 0) {
    return 'No completed work yet. Your profile will fill in as soon as you finish your first resource.';
  }
  const parts = [`You have completed ${stats.completed} of ${stats.total} resources`];
  if (stats.rank && stats.cohortSize) parts[0] += ` and sit at #${stats.rank} of ${stats.cohortSize} in your cohort`;
  parts[0] += '.';
  const best = skills.find((s) => s.proficiency !== null);
  if (best) parts.push(`${best.name} is your strongest measured skill at ${best.proficiency}%${best.limitedEvidence ? ', based on a single assessment' : ''}.`);
  if (trend.direction === 'up') parts.push(`Your assessment scores are trending up by ${trend.delta} points.`);
  if (trend.direction === 'down') parts.push(`Your assessment scores have dipped by ${Math.abs(trend.delta)} points recently.`);
  if (archetype.key !== 'newcomer') parts.push(`Your activity pattern fits ${archetype.title}.`);
  return parts.join(' ');
}

function buildProfile({ user, records, activityDates, earnedBadges, rank, cohortSize, metrics, now = new Date(), tz = 330 }) {
  const streak = computeStreak(activityDates, now, tz);
  const trend = scoreTrend(records);
  const skills = computeSkillMap(records, user.interests);
  const archetype = computeArchetype({ records, metrics, skills, interests: user.interests, trend });
  const { strengths, improvements } = computeStrengthsAndGaps({ records, metrics, skills, trend });
  const patterns = computePatterns({ records, activityDates, metrics, streak, tz });
  const recommendations = computeRecommendations({ records, skills, interests: user.interests, now });
  const timeline = computeTimeline({ user, records, earnedBadges, streak, tz });

  const quizAvg = mean(records.filter((r) => r.type === 'quiz' && r.pct !== null).map((r) => r.pct * 100));
  const projectAvg = mean(records.filter((r) => r.type === 'project' && r.status === 'evaluated' && r.pct !== null).map((r) => r.pct * 100));

  const stats = {
    completed: records.filter((r) => r.done).length,
    total: records.length,
    overdue: records.filter((r) => r.status === 'overdue').length,
    pending: records.filter((r) => !r.done && r.status !== 'overdue').length,
    quizAverage: quizAvg === null ? null : Math.round(quizAvg),
    projectAverage: projectAvg === null ? null : Math.round(projectAvg),
    streak,
    rank,
    cohortSize,
    score: metrics.score
  };

  return {
    stats,
    metrics,
    archetype,
    skills,
    trend,
    strengths,
    improvements,
    patterns,
    recommendations,
    timeline,
    summary: buildSummary({ stats, skills, trend, archetype }),
    hasEnoughData: stats.completed >= 2,
    source: 'computed'
  };
}

module.exports = { buildProfile, computeSkillMap, computeArchetype, ARCHETYPES };
