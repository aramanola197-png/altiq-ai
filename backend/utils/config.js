/**
 * Centralized backend configuration.
 * Avoid scattering magic numbers and strings across the codebase.
 */
module.exports = {
  // Auth
  cookieName: 'altiq_token',
  sessionMaxAgeDays: parseInt(process.env.SESSION_MAX_AGE_DAYS || '30', 10),

  // AI
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  geminiTimeoutMs: 45000,
  geminiMaxRetries: 1,

  // Chat
  chatHistoryLimit: 100,
  chatHistoryPageSize: 40,

  // Projects
  maxProjectsPerUser: 50,

  // Opportunity (Phase 4)
  opportunityCacheTtlMinutes: 60,
  opportunitySources: {
    primary: 'zero_authority_dao',
    secondary: 'stacks',
  },

  // Logging
  logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
};
