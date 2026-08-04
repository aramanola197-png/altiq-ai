/**
 * Ecosystem data — Zero Authority DAO (primary) + Stacks (secondary).
 * Server-side only. Never fabricate opportunity records.
 *
 * Zero Authority DAO integration is implemented against the official
 * "Zero Authority Platform API" OpenAPI specification (v1.0.0):
 *   - Server: {ZADAO_API_BASE_URL}/api  (spec declares "/api" relative
 *     to the current origin — same domain for testnet or mainnet)
 *   - Resources: /grants, /bounties, /gigs, /quests — each paginated
 *     with `page`/`limit` query params and a `meta` object containing
 *     { page, limit, total, totalPages, hasNext, hasPrev }.
 *   - The spec defines no security scheme on these four GET list
 *     endpoints (no 401/403 responses, no auth header parameter) —
 *     they are public. The only authenticated surface found in the
 *     spec is an unrelated admin report (`/grants/Survey?report=1`),
 *     which this integration does not use. ZADAO_API_KEY is still
 *     sent as a Bearer token on every request when configured, since
 *     it's harmless if unused and may grant higher rate limits — but
 *     its absence does not block syncing, matching what's documented.
 */
const Opportunity = require('../models/Opportunity');
const logger = require('./logger');
const config = require('./config');

async function upsertOpportunity(doc) {
  if (!doc.externalId || !doc.source || !doc.title || !doc.type) return null;
  return Opportunity.findOneAndUpdate(
    { source: doc.source, type: doc.type, externalId: doc.externalId },
    { ...doc, lastSyncedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/* ------------------------------------------------------------------
   Shared helpers
------------------------------------------------------------------ */

// Bounty/gig monetary values are documented as being in the token's
// smallest unit (see /bounties query param docs: "in smallest token
// unit"). Convert using the token's own `decimals` when present;
// otherwise fall back to the raw value rather than guessing a
// conversion that isn't backed by the response itself.
function formatTokenAmount(rawAmount, token) {
  if (rawAmount === undefined || rawAmount === null) return '';
  const symbol = token && token.symbol ? token.symbol : '';
  const decimals = token && typeof token.decimals === 'number' ? token.decimals : null;
  const numeric = Number(rawAmount);
  if (Number.isNaN(numeric)) return String(rawAmount);
  const value = decimals !== null ? numeric / 10 ** decimals : numeric;
  const display = decimals !== null
    ? value.toLocaleString(undefined, { maximumFractionDigits: 4 })
    : String(numeric);
  return symbol ? `${display} ${symbol}` : display;
}

function personName(user) {
  if (!user) return '';
  return user.username || user.stxAddress || '';
}

// Derives open/closed from fields the API itself provides — never a
// guess layered on top. Order of checks: an explicit expiry flag (if
// present) wins, then a past end date, then the resource's own status
// string matched against terminal-state keywords. Anything not
// positively identified as closed is treated as open, since an
// unrecognized status shouldn't hide a genuinely live opportunity.
function deriveStatus({ isExpired, endDate, rawStatus } = {}) {
  if (isExpired === true) return 'closed';

  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime()) && end.getTime() < Date.now()) return 'closed';
  }

  if (rawStatus) {
    const s = String(rawStatus).toLowerCase();
    const closedKeywords = ['completed', 'cancel', 'reject', 'closed', 'expired', 'terminated', 'archived'];
    if (closedKeywords.some((k) => s.includes(k))) return 'closed';
  }

  return 'open';
}

/* ------------------------------------------------------------------
   Type-specific normalizers — every field is mapped from the actual
   OpenAPI response schema for that resource. No generic fallback
   chains guessing at field names that may not exist.
------------------------------------------------------------------ */

function normalizeGrant(raw, zBase) {
  return {
    externalId: String(raw.id),
    source: 'zero_authority_dao',
    type: 'grant',
    title: raw.projectName || '',
    description: raw.projectDescription || '',
    organizer: personName(raw.steward) || 'Zero Authority DAO',
    // No application-deadline field exists on the grant schema — only
    // milestone due dates, which mean something different. Left unset
    // rather than misrepresenting a milestone date as an application
    // deadline.
    deadline: undefined,
    amount: raw.awardedAmount != null
      ? String(raw.awardedAmount)
      : (raw.requestedAmount != null ? String(raw.requestedAmount) : ''),
    // No per-item URL is provided by the API for any resource type.
    // Linking to the real, confirmed DeGrants section rather than
    // guessing an unconfirmed per-id detail path.
    url: `${zBase}/funding/degrants`,
    eligibility: undefined,
    skills: [],
    status: deriveStatus({ rawStatus: raw.status }),
    raw,
  };
}

function normalizeBounty(raw, zBase) {
  return {
    externalId: String(raw.id),
    source: 'zero_authority_dao',
    type: 'bounty',
    title: raw.name || '',
    description: raw.details || '',
    organizer: (raw.organization && raw.organization.name) || personName(raw.creator),
    deadline: raw.endDate ? new Date(raw.endDate) : undefined,
    amount: formatTokenAmount(raw.totalPayment, raw.token),
    url: `${zBase}/bounty`,
    eligibility: undefined,
    skills: [],
    status: deriveStatus({ isExpired: raw.isExpired, endDate: raw.endDate, rawStatus: raw.status }),
    raw,
  };
}

function normalizeGig(raw, zBase) {
  const firstMilestoneToken = Array.isArray(raw.milestones) && raw.milestones[0]
    ? raw.milestones[0].token
    : undefined;
  return {
    externalId: String(raw.id),
    source: 'zero_authority_dao',
    type: 'gig',
    title: raw.title || '',
    description: raw.description || '',
    organizer: personName(raw.client),
    deadline: raw.endDate ? new Date(raw.endDate) : undefined,
    amount: formatTokenAmount(raw.totalValue, firstMilestoneToken),
    url: `${zBase}/gigs`,
    eligibility: undefined,
    skills: [],
    status: deriveStatus({ endDate: raw.endDate, rawStatus: raw.status }),
    raw,
  };
}

function normalizeQuest(raw, zBase) {
  // Quests reward reputation (and sometimes an NFT), not a token
  // amount — represented honestly rather than forced into a
  // currency-shaped string.
  const repPart = raw.totalRep != null ? `${raw.totalRep} REP` : '';
  const nftPart = raw.nftReward ? 'NFT' : '';
  const amount = [repPart, nftPart].filter(Boolean).join(' + ');

  return {
    externalId: String(raw.id),
    source: 'zero_authority_dao',
    type: 'quest',
    title: raw.title || '',
    description: raw.description || '',
    organizer: personName(raw.creator) || (raw.campaign && raw.campaign.name) || '',
    deadline: raw.endDate ? new Date(raw.endDate) : undefined,
    amount,
    url: `${zBase}/quests`,
    eligibility: undefined,
    skills: [],
    status: deriveStatus({ endDate: raw.endDate, rawStatus: raw.status }),
    raw,
  };
}

const RESOURCE_MAP = {
  grants: { path: '/grants', normalize: normalizeGrant },
  bounties: { path: '/bounties', normalize: normalizeBounty },
  gigs: { path: '/gigs', normalize: normalizeGig },
  quests: { path: '/quests', normalize: normalizeQuest },
};

/* ------------------------------------------------------------------
   Paginated fetch — follows the documented meta.hasNext, capped by
   zadaoSyncMaxPages as a safety net (not a documented API limit).
------------------------------------------------------------------ */
async function fetchAllPages(zBase, resourcePath, headers) {
  const items = [];
  let page = 1;
  const limit = config.zadaoSyncPageSize;

  while (page <= config.zadaoSyncMaxPages) {
    const url = `${zBase}/api${resourcePath}?page=${page}&limit=${limit}`;
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      // 400/404/500 are the documented error responses for these
      // endpoints; surface a clear error rather than silently
      // stopping mid-sync.
      const body = await res.json().catch(() => ({}));
      throw new Error(
        `ZADAO ${resourcePath} HTTP ${res.status}: ${body.message || body.error || 'request failed'}`
      );
    }

    const json = await res.json();
    const pageItems = Array.isArray(json.data) ? json.data : [];
    items.push(...pageItems);

    const meta = json.meta || {};
    if (!meta.hasNext) break;
    page += 1;
  }

  return items;
}

/**
 * Attempt live sync. Without ZADAO_API_BASE_URL configured, returns
 * gracefully with zero invented rows. Each resource type (grants,
 * bounties, gigs, quests) is synced independently so one failing
 * doesn't block the others.
 */
async function syncOpportunities() {
  const results = { synced: 0, errors: [], sources: [], byType: {} };

  const zBaseRaw = process.env.ZADAO_API_BASE_URL;
  const zKey = process.env.ZADAO_API_KEY;

  if (zBaseRaw) {
    const zBase = zBaseRaw.replace(/\/$/, '');
    const headers = { Accept: 'application/json' };
    // Not required by the documented spec for these endpoints, but
    // sent whenever configured — see file header for why.
    if (zKey) headers.Authorization = `Bearer ${zKey}`;

    let anySucceeded = false;

    for (const [resourceName, { path, normalize }] of Object.entries(RESOURCE_MAP)) {
      try {
        const rawItems = await fetchAllPages(zBase, path, headers);
        let count = 0;
        for (const raw of rawItems) {
          const normalized = normalize(raw, zBase);
          if (normalized.externalId && normalized.title) {
            await upsertOpportunity(normalized);
            count += 1;
          }
        }
        results.synced += count;
        results.byType[resourceName] = count;
        anySucceeded = true;
        logger.info('zadao_resource_sync_ok', { resource: resourceName, count });
      } catch (err) {
        logger.error('zadao_resource_sync_failed', { resource: resourceName, error: err.message });
        results.errors.push(resourceName);
      }
    }

    if (anySucceeded) results.sources.push('zero_authority_dao');
  } else {
    logger.debug('zadao_base_url_missing');
  }

  // Secondary: official Stacks-related endpoints if configured
  const sBase = process.env.STACKS_API_BASE_URL;
  if (sBase) {
    try {
      // Connectivity probe only — Stacks chain txs are never treated
      // as grants/bounties/gigs/quests.
      const url = `${sBase.replace(/\/$/, '')}/extended/v1/tx`;
      const res = await fetch(url + '?limit=1', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });
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

const RECENTLY_CLOSED_WINDOW_DAYS = 30;
const RECENTLY_CLOSED_MAX = 5;

/**
 * Default listing behavior (no explicit status filter requested):
 * every open opportunity (sorted soonest-deadline-first, no artificial
 * cap — if 40 are genuinely open, all 40 come back), plus a small
 * number of opportunities that closed recently (so a bounty someone
 * just missed isn't invisible), badged separately by the frontend via
 * `status`. Anything closed longer than RECENTLY_CLOSED_WINDOW_DAYS
 * ago — including years-old records — is excluded entirely rather
 * than clutter the list with stale closed items.
 */
async function listCachedOpportunities({ type, status, limit } = {}) {
  const baseQuery = {};
  if (type) baseQuery.type = type;

  // Explicit status filter requested (e.g. an admin/debug view) —
  // honor it directly instead of the smart open+recent default.
  if (status) {
    const query = { ...baseQuery, status };
    const q = Opportunity.find(query).sort({ deadline: 1, lastSyncedAt: -1 });
    if (limit) q.limit(limit);
    return q;
  }

  const openItems = await Opportunity.find({ ...baseQuery, status: 'open' })
    .sort({ deadline: 1, lastSyncedAt: -1 })
    .limit(limit || 500);

  const recentCutoff = new Date(Date.now() - RECENTLY_CLOSED_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const recentlyClosed = await Opportunity.find({
    ...baseQuery,
    status: 'closed',
    deadline: { $gte: recentCutoff },
  })
    .sort({ deadline: -1 })
    .limit(RECENTLY_CLOSED_MAX);

  return [...openItems, ...recentlyClosed];
}

module.exports = { syncOpportunities, listCachedOpportunities };
