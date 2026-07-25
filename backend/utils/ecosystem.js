/**
 * Ecosystem data — Zero Authority DAO (primary) + Stacks (secondary).
 * Server-side only. Never fabricate opportunity records.
 */
const Opportunity = require('../models/Opportunity');
const logger = require('./logger');

async function upsertOpportunity(doc) {
  if (!doc.externalId || !doc.source || !doc.title) return null;
  return Opportunity.findOneAndUpdate(
    { source: doc.source, externalId: doc.externalId },
    { ...doc, lastSyncedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/**
 * Attempt live sync. Without credentials or reachable endpoints,
 * returns gracefully with zero invented rows.
 */
async function syncOpportunities() {
  const results = { synced: 0, errors: [], sources: [] };

  // Primary: Zero Authority DAO
  const zBase = process.env.ZADAO_API_BASE_URL;
  const zKey = process.env.ZADAO_API_KEY;
  if (zBase && zKey) {
    try {
      const url = `${zBase.replace(/\/$/, '')}/api/opportunities`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${zKey}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`ZADAO HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.opportunities || data.data || [];
      for (const raw of list) {
        const normalized = {
          externalId: String(raw.id || raw._id || raw.slug || ''),
          source: 'zero_authority_dao',
          type: (raw.type || 'grant').toLowerCase().replace(/\s+/g, '_'),
          title: raw.title || raw.name || '',
          description: raw.description || raw.summary || '',
          organizer: raw.organizer || raw.organization || '',
          eligibility: raw.eligibility || '',
          deadline: raw.deadline ? new Date(raw.deadline) : undefined,
          amount: raw.amount || raw.funding || '',
          url: raw.url || raw.link || raw.applyUrl || '',
          skills: raw.skills || [],
          raw,
        };
        if (normalized.externalId && normalized.title) {
          await upsertOpportunity(normalized);
          results.synced += 1;
        }
      }
      results.sources.push('zero_authority_dao');
      logger.info('zadao_sync_ok', { count: list.length });
    } catch (err) {
      logger.error('zadao_sync_failed', { error: err.message });
      results.errors.push('zero_authority_dao');
    }
  } else {
    logger.debug('zadao_credentials_missing');
  }

  // Secondary: official Stacks-related endpoints if configured
  const sBase = process.env.STACKS_API_BASE_URL;
  if (sBase) {
    try {
      // Placeholder path — only official documented endpoints should be used.
      // If the path 404s, we record the error and never invent rows.
      const url = `${sBase.replace(/\/$/, '')}/extended/v1/tx`;
      const res = await fetch(url + '?limit=1', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
      // We do not treat Stacks chain txs as grants — this is a connectivity probe only.
      if (res.ok) {
        results.sources.push('stacks');
        logger.info('stacks_reachable');
      } else {
        results.errors.push('stacks');
      }
    } catch (err) {
      logger.error('stacks_sync_failed', { error: err.message });
      results.errors.push('stacks');
    }
  }

  return results;
}

async function listCachedOpportunities({ type, limit = 50 } = {}) {
  const query = {};
  if (type) query.type = type;
  return Opportunity.find(query).sort({ lastSyncedAt: -1 }).limit(limit);
}

module.exports = { syncOpportunities, listCachedOpportunities };
