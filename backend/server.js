require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const passport = require('./config/passport');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const required = [
  'MONGODB_URI',
  'JWT_SECRET',
  'SESSION_SECRET',
  'CLIENT_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

connectDB();

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 10 * 60 * 1000 },
  })
);

app.use(passport.initialize());

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/projects', require('./routes/projects.routes'));
app.use('/api/projects/:projectId/chat', require('./routes/chat.routes'));
app.use('/api/projects/:projectId/research', require('./routes/research.routes'));
app.use('/api/projects/:projectId/brand', require('./routes/brand.routes'));
app.use('/api/projects/:projectId/documents', require('./routes/documents.routes'));
app.use('/api/projects/:projectId/timeline', require('./routes/timeline.routes'));
app.use('/api/projects/:projectId/submission', require('./routes/submission.routes'));
app.use('/api/projects/:projectId/export', require('./routes/export.routes'));
app.use('/api/opportunities', require('./routes/opportunities.routes'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'ALTIQ AI Backend' });
});

app.use((err, req, res, next) => {
  logger.error('unhandled_error', { error: err.message, path: req.path });
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Something went wrong.',
    code: err.code,
  });
});

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info('server_started', { port: PORT });
  console.log(`ALTIQ AI backend running on port ${PORT}`);
});
