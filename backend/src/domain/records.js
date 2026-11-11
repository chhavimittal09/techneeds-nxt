const { normalizeSkills } = require('./skills');

const OPEN = new Set(['not_started', 'in_progress']);

function buildRecord(resource, parts, now = new Date()) {
  const { progress, attempt, submission } = parts || {};
  const deadline = new Date(resource.deadline);
  const skills = normalizeSkills([...(resource.skills || []), ...(resource.type === 'project' ? ['Project Development'] : [])]);
  const rec = {
    id: String(resource._id || resource.id),
    type: resource.type,
    title: resource.title,
    skills,
    maxMarks: resource.maxMarks || 0,
    deadline,
    scored: (resource.maxMarks || 0) > 0,
    createdAt: resource.createdAt || resource.publishedAt || null,
    status: 'not_started',
    marks: null,
    completedAt: null,
    startedAt: null,
    feedback: '',
    evaluatedAt: null
  };

  if (resource.type === 'video' && progress) {
    rec.startedAt = progress.startedAt || null;
    if (progress.completedAt) {
      rec.completedAt = progress.completedAt;
      rec.marks = rec.scored ? rec.maxMarks : null;
      rec.status = rec.scored ? 'evaluated' : 'submitted';
    } else {
      rec.status = 'in_progress';
    }
  }

  if (resource.type === 'quiz' && attempt) {
    rec.startedAt = attempt.startedAt || null;
    if (attempt.submittedAt) {
      rec.completedAt = attempt.submittedAt;
      rec.marks = attempt.score;
      rec.maxMarks = attempt.maxScore || rec.maxMarks;
      rec.scored = rec.maxMarks > 0;
      rec.status = 'evaluated';
    } else {
      rec.status = 'in_progress';
    }
  }

  if (resource.type === 'project' && submission) {
    rec.startedAt = submission.submittedAt;
    rec.completedAt = submission.submittedAt;
    rec.status = submission.status === 'evaluated' ? 'evaluated' : 'submitted';
    if (submission.status === 'evaluated') {
      rec.marks = submission.marks;
      rec.feedback = submission.feedback || '';
      rec.evaluatedAt = submission.evaluatedAt || null;
    }
  }

  if (OPEN.has(rec.status) && deadline < now) rec.status = 'overdue';

  rec.done = rec.status === 'submitted' || rec.status === 'evaluated';
  rec.onTime = rec.completedAt ? new Date(rec.completedAt) <= deadline : null;
  rec.pct = rec.marks != null && rec.maxMarks > 0 ? rec.marks / rec.maxMarks : null;
  return rec;
}

module.exports = { buildRecord };
