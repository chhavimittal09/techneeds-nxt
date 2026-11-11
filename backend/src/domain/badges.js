const { scoreTrend } = require('./scoring');

const BADGE_DEFS = [
  { key: 'first_step', title: 'First Step', tier: 'bronze', icon: 'footprints', criteria: 'Complete your first resource.' },
  { key: 'first_build', title: 'First Build', tier: 'bronze', icon: 'hammer', criteria: 'Submit your first project.' },
  { key: 'quiz_master', title: 'Quiz Master', tier: 'silver', icon: 'brain', criteria: 'Score full marks on a quiz.' },
  { key: 'deadline_pro', title: 'Deadline Pro', tier: 'silver', icon: 'timer', criteria: 'Finish 3 resources on or before their deadlines.' },
  { key: 'consistency_champion', title: 'Consistency Champion', tier: 'gold', icon: 'flame', criteria: 'Be active on 5 consecutive days.' },
  { key: 'project_finisher', title: 'Project Finisher', tier: 'silver', icon: 'flag', criteria: 'Have a project evaluated at 70% or higher.' },
  { key: 'rising_star', title: 'Rising Star', tier: 'gold', icon: 'trending-up', criteria: 'Raise your average assessment score by 10+ points across at least 3 assessments.' },
  { key: 'top_performer', title: 'Top Performer', tier: 'gold', icon: 'trophy', criteria: 'Reach the top 3 of your cohort after completing at least 2 resources.' }
];

const CHECKS = {
  first_step: ({ records }) => records.some((r) => r.done),
  first_build: ({ records }) => records.some((r) => r.type === 'project' && r.done),
  quiz_master: ({ records }) => records.some((r) => r.type === 'quiz' && r.status === 'evaluated' && r.maxMarks > 0 && r.marks === r.maxMarks),
  deadline_pro: ({ records }) => records.filter((r) => r.done && r.onTime === true).length >= 3,
  consistency_champion: ({ streak }) => streak.longest >= 5,
  project_finisher: ({ records }) => records.some((r) => r.type === 'project' && r.status === 'evaluated' && r.pct !== null && r.pct >= 0.7),
  rising_star: ({ records }) => {
    const t = scoreTrend(records);
    return t.series.length >= 3 && t.delta >= 10;
  },
  top_performer: ({ records, rank, cohortSize }) => cohortSize >= 3 && rank !== null && rank <= 3 && records.filter((r) => r.done).length >= 2
};

function evaluateBadges(ctx) {
  return BADGE_DEFS.filter((def) => CHECKS[def.key](ctx)).map((def) => def.key);
}

const badgeDef = (key) => BADGE_DEFS.find((b) => b.key === key);

module.exports = { BADGE_DEFS, evaluateBadges, badgeDef };
