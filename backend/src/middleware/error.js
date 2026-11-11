const { ZodError } = require('zod');
const mongoose = require('mongoose');
const { ApiError } = require('../utils/errors');

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return res.status(400).json({ error: details[0] ? `${details[0].field || 'request'}: ${details[0].message}` : 'Invalid request', details });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json({ error: details[0]?.message || 'Validation failed', details });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: `Invalid ${err.path}` });
  }
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    return res.status(409).json({ error: `That ${field} is already in use` });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }

  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side' });
}

module.exports = { notFoundHandler, errorHandler };
