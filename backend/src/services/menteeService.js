const { User, Counter, Activity } = require('../models');
const { generatePassword, hashPassword, randomToken } = require('../utils/password');
const { conflict, badRequest } = require('../utils/errors');
const { logActivity } = require('./events');

async function nextEnrollmentNumber(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const seq = await Counter.next(`enroll:${yy}`);
  return `TNX${yy}${String(seq).padStart(4, '0')}`;
}

async function createMentee({ cohort, name, email, createdBy }) {
  const count = await User.countDocuments({ cohort: cohort._id, role: 'mentee' });
  if (count >= cohort.capacity) throw badRequest(`This cohort is full (${cohort.capacity} mentees)`);
  if (email && (await User.exists({ email: email.toLowerCase() }))) throw conflict('That email is already registered');

  const password = generatePassword();
  const passwordHash = await hashPassword(password);

  let mentee;
  for (let attempt = 0; attempt < 3 && !mentee; attempt += 1) {
    const enrollmentNumber = await nextEnrollmentNumber();
    try {
      mentee = await User.create({
        name,
        email: email || undefined,
        enrollmentNumber,
        passwordHash,
        role: 'mentee',
        program: cohort.program,
        cohort: cohort._id,
        mustChangePassword: true,
        avatar: { seed: randomToken(6) },
        createdBy
      });
    } catch (err) {
      if (!(err.code === 11000 && attempt < 2)) throw err;
    }
  }

  await logActivity({ user: mentee._id, cohort: cohort._id, kind: 'joined', label: 'Joined the cohort' });
  return { mentee, credentials: { enrollmentNumber: mentee.enrollmentNumber, password } };
}

module.exports = { createMentee, nextEnrollmentNumber };
