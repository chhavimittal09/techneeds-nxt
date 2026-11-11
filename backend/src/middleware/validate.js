const mongoose = require('mongoose');
const { badRequest } = require('../utils/errors');

const validate = (schema) => (req, res, next) => {
  req.body = schema.parse(req.body ?? {});
  next();
};

const oid = (value, label = 'id') => {
  if (!mongoose.isValidObjectId(value)) throw badRequest(`Invalid ${label}`);
  return String(value);
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { validate, oid, escapeRegex };
