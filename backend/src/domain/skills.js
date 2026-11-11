const CANONICAL_SKILLS = [
  'Programming',
  'Problem Solving',
  'Web Development',
  'Data Analysis',
  'Technical Communication',
  'Project Development',
  'Machine Learning',
  'Design',
  'Cloud & DevOps'
];

function normalizeSkill(name) {
  const trimmed = String(name || '').trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  const hit = CANONICAL_SKILLS.find((s) => s.toLowerCase() === trimmed.toLowerCase());
  if (hit) return hit;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function normalizeSkills(list) {
  const seen = new Set();
  const out = [];
  for (const raw of list || []) {
    const s = normalizeSkill(raw);
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase());
      out.push(s);
    }
  }
  return out;
}

function levelFor(pct) {
  if (pct < 40) return 'Beginner';
  if (pct < 65) return 'Developing';
  if (pct < 85) return 'Proficient';
  return 'Advanced';
}

module.exports = { CANONICAL_SKILLS, normalizeSkill, normalizeSkills, levelFor };
