const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { User } = require('../models');
const { unauthorized, forbidden } = require('../utils/errors');

function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });
}

async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch {
    throw unauthorized('Session expired. Please sign in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.active) throw unauthorized('Account not available');
  if (user.role !== payload.role) throw unauthorized();

  req.user = user;
  next();
}

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) throw forbidden();
  next();
};

module.exports = { signToken, authenticate, requireRole };
