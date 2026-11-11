const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { clientOrigins, nodeEnv } = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/error');
const { router: commonRouter, publicRouter } = require('./routes/common');

const app = express();

if (nodeEnv === 'production') app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || clientOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Origin not allowed by CORS'));
    }
  })
);
app.use(express.json({ limit: '200kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'techneeds-nxt-api', time: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/mentor', require('./routes/mentor'));
app.use('/api/mentee', require('./routes/mentee'));
app.use('/api/public', publicRouter);
app.use('/api', commonRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
