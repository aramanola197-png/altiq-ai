/**
 * Lightweight structured logger.
 * Never logs secrets, tokens, or passwords.
 */
const config = require('./config');

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const current = levels[config.logLevel] ?? 2;

function log(level, message, meta = {}) {
  if ((levels[level] ?? 2) > current) return;
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  // Strip any accidental sensitive keys
  ['password', 'token', 'apiKey', 'secret', 'authorization'].forEach((k) => {
    if (entry[k]) entry[k] = '[redacted]';
  });
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else console.log(line);
}

module.exports = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};
