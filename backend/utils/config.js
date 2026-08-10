/**
 * Centralized backend configuration.
 * Avoid scattering magic numbers and strings across the codebase.
 */
module.exports = {
  // Auth
  cookieName: 'altiq_token',
  sessionMaxAgeDays: parseInt(process.env.SESSION_MAX_AGE_DAYS || '30', 10),

  // AI
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  geminiTimeoutMs: 60000,
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
  // Zero Authority DAO official API — /grants, /bounties, /gigs, /quests
  // are each paginated (see openapi spec: page/limit + meta.hasNext).
  // These caps are a safety net against an unexpectedly huge dataset
  // looping forever, not a documented API limit.
  zadaoSyncPageSize: 100,
  zadaoSyncMaxPages: 10,

  // Logging
  logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
};
