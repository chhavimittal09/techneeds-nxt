const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { User } = require('../models');
const { signToken, authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { verifyPassword, hashPassword } = require('../utils/password');
const { ApiError, badRequest } = require('../utils/errors');
const { avatarSpec } = require('../services/cohortData');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' }
});

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  role: u.role,
  email: u.email || null,
  enrollmentNumber: u.enrollmentNumber || null,
  mustChangePassword: u.mustChangePassword,
  avatar: avatarSpec(u),
  cohort: u.cohort || null,
  program: u.program || null
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or enrollment number').max(120),
  password: z.string().min(1, 'Enter your password').max(200),
  role: z.enum(['admin', 'mentor', 'mentee']).optional()
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const { identifier, password, role } = req.body;
  const query = identifier.includes('@') ? { email: identifier.toLowerCase() } : { enrollmentNumber: identifier.toUpperCase() };
  const user = await User.findOne(query).select('+passwordHash');
  const valid = user && user.active && (await verifyPassword(password, user.passwordHash));
  if (!valid || (role && user.role !== role)) throw new ApiError(401, 'Those credentials do not match an account for this sign-in type');

  user.lastLoginAt = new Date();
  await user.save();
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(100)
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/[0-9]/, 'Include at least one number')
});

router.post('/change-password', authenticate, validate(passwordSchema), async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await verifyPassword(req.body.currentPassword, user.passwordHash))) throw badRequest('Current password is incorrect');
  if (req.body.currentPassword === req.body.newPassword) throw badRequest('Choose a password different from the current one');
  user.passwordHash = await hashPassword(req.body.newPassword);
  user.mustChangePassword = false;
  await user.save();
  res.json({ ok: true, user: publicUser(user) });
});

module.exports = router;
module.exports.publicUser = publicUser;
