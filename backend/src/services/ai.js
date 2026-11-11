const crypto = require('crypto');
const { anthropicKey, anthropicModel } = require('../config/env');

const isEnabled = () => Boolean(anthropicKey);

const REFRESH_MS = 6 * 60 * 60 * 1000;

function digest(profile) {
  const core = {
    s: profile.stats,
    a: profile.archetype.key,
    k: profile.skills.map((s) => [s.name, s.proficiency]),
    t: profile.trend.direction
  };
  return crypto.createHash('sha256').update(JSON.stringify(core)).digest('hex').slice(0, 16);
}

async function callModel(profile, name) {
  const facts = {
    firstName: name.split(' ')[0],
    completed: `${profile.stats.completed}/${profile.stats.total}`,
    rank: profile.stats.rank ? `${profile.stats.rank} of ${profile.stats.cohortSize}` : null,
    archetype: profile.archetype.title,
    skills: profile.skills.filter((s) => s.proficiency !== null).map((s) => `${s.name} ${s.proficiency}%`),
    strengths: profile.strengths.map((s) => s.title),
    improvements: profile.improvements.map((s) => s.title),
    trend: profile.trend.direction
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: anthropicModel,
      max_tokens: 400,
      system:
        'You write short, encouraging learner summaries for a mentorship platform. Use only the facts provided. Never invent scores, skills or achievements. Two short paragraphs, plain text, no lists, no emojis.',
      messages: [{ role: 'user', content: `Write a personal progress note for this learner.\n${JSON.stringify(facts)}` }]
    }),
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) throw new Error(`AI request failed with status ${response.status}`);
  const body = await response.json();
  const text = (body.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  if (!text) throw new Error('AI response was empty');
  return text;
}

async function getNarrative(user, profile, { force = false } = {}) {
  if (!isEnabled()) return { available: false };
  if (!profile.hasEnoughData) return { available: true, text: null, reason: 'Complete at least 2 resources to unlock an AI-written summary.' };

  const hash = digest(profile);
  const cached = user.aiNarrative;
  const fresh = cached?.text && cached.hash === hash && Date.now() - new Date(cached.generatedAt).getTime() < REFRESH_MS;
  if (fresh && !force) {
    return { available: true, text: cached.text, model: cached.model, generatedAt: cached.generatedAt, cached: true };
  }

  try {
    const text = await callModel(profile, user.name);
    user.aiNarrative = { text, hash, model: anthropicModel, generatedAt: new Date() };
    await user.save();
    return { available: true, text, model: anthropicModel, generatedAt: user.aiNarrative.generatedAt, cached: false };
  } catch (err) {
    console.error('AI narrative failed:', err.message);
    if (cached?.text) return { available: true, text: cached.text, model: cached.model, generatedAt: cached.generatedAt, cached: true, stale: true };
    return { available: true, text: null, reason: 'The AI service is unreachable right now. Your computed insights are unaffected.' };
  }
}

module.exports = { isEnabled, getNarrative };
