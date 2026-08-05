/**
 * Ecosystem data — Zero Authority DAO (primary) + Stacks (secondary).
 * Server-side only. Never fabricate opportunity records.
 *
 * Public builder-facing sources on ZADAO:
 *   - /api/bounties  (public board at /bounty) — primary
 *   - /api/quests    (public board at /quests)
 *   - /api/grants    (historical / DeGrants)
 *
 * /api/gigs is NOT treated as a public opportunity feed. On the live
 * site, /gigs is a private "Received gigs" contractor view (often empty
 * for the public). Those records are completed client/worker jobs, not
 * open calls for builders — listing them as opportunities was wrong.
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

function formatTokenAmount(rawAmount, token) {
  if (rawAmount === undefined || rawAmount === null) return '';
  const symbol = token && token.symbol ? token.symbol : '';
  const decimals = token && typeof token.decimals === 'number' ? token.decimals : null;
  const numeric = Number(rawAmount);
  if (Number.isNaN(numeric)) return String(rawAmount);
  const value =
    decimals !== null ? numeric / Math.pow(10, decimals) : numeric;
  const formatted = Number.isFinite(value)
    ? value.toLocaleString(undefined, { maximumFractionDigits: 6 })
    : String(rawAmount);
  return symbol ? `${formatted} ${symbol}` : formatted;
}

function personName(user) {
  if (!user) return '';
  return user.username || user.stxAddress || '';
}

/**
 * Derive open/closed from API fields only.
 * Explicit isExpired / past endDate / terminal status keywords → closed.
 * Unrecognized status defaults to open so live items are not hidden.
 */
function deriveStatus({ isExpired, endDate, rawStatus } = {}) {
  if (isExpired === true) return 'closed';

  if (endDate != null && endDate !== '') {
    let end;
    if (typeof endDate === 'number') {
      // ZADAO bounties use epoch ms; guard against accidental seconds.
      end = new Date(endDate < 1e12 ? endDate * 1000 : endDate);
    } else {
      end = new Date(endDate);
    }
    if (!Number.isNaN(end.getTime()) && end.getTime() < Date.now()) return 'closed';
  }

  if (rawStatus) {
    const s = String(rawStatus).toLowerCase();
    const closedKeywords = [
      'completed',
      'complete',
      'cancel',
      'reject',
      'closed',
      'expired',
      'terminated',
      'archived',
      'winner',
      'paid',
      'done',
    ];
    if (closedKeywords.some((k) => s.includes(k))) return 'closed';
  }

  return 'open';
}

function normalizeGrant(raw, zBase) {
  return {
    externalId: String(raw.id),
    source: 'zero_authority_dao',
    type: 'grant',
    title: raw.projectName || '',
    description: raw.projectDescription || '',
    organizer: personName(raw.steward) || 'Zero Authority DAO',
    deadline: undefined,
    amount:
      raw.awardedAmount != null
        ? String(raw.awardedAmount)
        : raw.requestedAmount != null
          ? String(raw.requestedAmount)
          : '',
    url: `${zBase}/funding/degrants`,
    eligibility: undefined,
    skills: [],
    status: deriveStatus({ rawStatus: raw.status }),
    raw,
  };
}

function normalizeBounty(raw, zBase) {
  const id = raw.id != null ? String(raw.id) : '';
  return {
    externalId: id,
    source: 'zero_authority_dao',
    type: 'bounty',
    title: raw.name || '',
    description: raw.details || '',
    organizer:
      (raw.organization && raw.organization.name) || personName(raw.creator) || 'Zero Authority DAO',
    deadline: raw.endDate != null ? new Date(raw.endDate < 1e12 ? raw.endDate * 1000 : raw.endDate) : undefined,
    amount: formatTokenAmount(raw.totalPayment, raw.token),
    // Live site detail path confirmed: /bounty/{id}
    url: id ? `${zBase}/bounty/${id}` : `${zBase}/bounty`,
    eligibility: undefined,
    skills: [],
    status: deriveStatus({
      isExpired: raw.isExpired,
      endDate: raw.endDate,
      rawStatus: raw.status,
    }),
    raw,
  };
}

function normalizeQuest(raw, zBase) {
  const id = raw.id != null ? String(raw.id) : '';
  const repPart = raw.totalRep != null ? `${raw.totalRep} REP` : '';
  const nftPart = raw.nftReward ? 'NFT' : '';
  const amount = [repPart, nftPart].filter(Boolean).join(' + ');

  return {
    externalId: id,
    source: 'zero_authority_dao',
    type: 'quest',
    title: raw.title || '',
    description: raw.description || '',
    organizer: personName(raw.creator) || (raw.campaign && raw.campaign.name) || 'Zero Authority DAO',
    deadline: raw.endDate ? new Date(raw.endDate) : undefined,
    amount,
    url: id ? `${zBase}/quests/${id}` : `${zBase}/quests`,
    eligibility: undefined,
    skills: [],
    status: deriveStatus({ endDate: raw.endDate, rawStatus: raw.status }),
    raw,
  };
}

/**
 * Paginated fetch. Optional extraQuery is appended (e.g. status=Open).
 */
async function fetchAllPages(zBase, resourcePath, headers, extraQuery = '') {
  const items = [];
  let page = 1;
  const limit = config.zadaoSyncPageSize || 100;
  const maxPages = config.zadaoSyncMaxPages || 10;

  while (page <= maxPages) {
    const qs = `page=${page}&limit=${limit}${extraQuery ? `&${extraQuery}` : ''}`;
    const url = `${zBase}/api${resourcePath}?${qs}`;
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
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
 * Live sync from official ZADAO public boards.
 * - Bounties: prefer status=Open (public board), then mark stale opens closed
 * - Quests: full list
 * - Grants: limited pages (mostly historical)
 * - Gigs: not synced (not a public opportunity board)
 */
async function syncOpportunities() {
  const results = { synced: 0, errors: [], sources: [], byType: {} };

  const zBaseRaw = process.env.ZADAO_API_BASE_URL;
  const zKey = process.env.ZADAO_API_KEY;

  if (!zBaseRaw) {
    logger.debug('zadao_base_url_missing');
    return results;
  }

  const zBase = zBaseRaw.replace(/\/$/, '');
  const headers = { Accept: 'application/json' };
  if (zKey) headers.Authorization = `Bearer ${zKey}`;

  let anySucceeded = false;

  // --- Bounties (public) — Open first so live items always land ---
  try {
    const openRaw = await fetchAllPages(zBase, '/bounties', headers, 'status=Open');
    const openIds = [];
    let bountyCount = 0;

    for (const raw of openRaw) {
      const normalized = normalizeBounty(raw, zBase);
      // Force open when API Open filter returned them and not expired
      if (raw.isExpired !== true && String(raw.status || '').toLowerCase() === 'open') {
        normalized.status = 'open';
      }
      if (normalized.externalId && normalized.title) {
        await upsertOpportunity(normalized);
        openIds.push(normalized.externalId);
        bountyCount += 1;
      }
    }

    // Any previously open bounty no longer in the Open list → closed
    if (openIds.length >= 0) {
      await Opportunity.updateMany(
        {
          source: 'zero_authority_dao',
          type: 'bounty',
          status: 'open',
          externalId: { $nin: openIds },
        },
        { $set: { status: 'closed', lastSyncedAt: new Date() } }
      );
    }

    // Recently closed / expired sample (first pages, no status filter)
    // so the UI can show a few "just ended" items without pulling all 393.
    try {
      const recentRaw = await fetchAllPages(zBase, '/bounties', headers, '');
      // Only upsert items that derive to closed and have a recent deadline
      const cutoff = Date.now() - 45 * 24 * 60 * 60 * 1000;
      let extra = 0;
      for (const raw of recentRaw.slice(0, 100)) {
        const normalized = normalizeBounty(raw, zBase);
        if (normalized.status !== 'closed') continue;
        if (normalized.deadline && normalized.deadline.getTime() < cutoff) continue;
        if (normalized.externalId && normalized.title) {
          await upsertOpportunity(normalized);
          extra += 1;
        }
      }
      bountyCount += extra;
    } catch (err) {
      logger.warn('zadao_bounty_recent_pass_failed', { error: err.message });
    }

    results.synced += bountyCount;
    results.byType.bounties = bountyCount;
    anySucceeded = true;
    logger.info('zadao_resource_sync_ok', { resource: 'bounties', count: bountyCount, open: openIds.length });
  } catch (err) {
    logger.error('zadao_resource_sync_failed', { resource: 'bounties', error: err.message });
    results.errors.push('bounties');
  }

  // --- Quests (public) ---
  try {
    const rawItems = await fetchAllPages(zBase, '/quests', headers);
    let count = 0;
    for (const raw of rawItems) {
      const normalized = normalizeQuest(raw, zBase);
      if (normalized.externalId && normalized.title) {
        await upsertOpportunity(normalized);
        count += 1;
      }
    }
    results.synced += count;
    results.byType.quests = count;
    anySucceeded = true;
    logger.info('zadao_resource_sync_ok', { resource: 'quests', count });
  } catch (err) {
    logger.error('zadao_resource_sync_failed', { resource: 'quests', error: err.message });
    results.errors.push('quests');
  }

  // --- Grants (mostly historical; keep for completeness) ---
  try {
    const rawItems = await fetchAllPages(zBase, '/grants', headers);
    let count = 0;
    for (const raw of rawItems) {
      const normalized = normalizeGrant(raw, zBase);
      if (normalized.externalId && normalized.title) {
        await upsertOpportunity(normalized);
        count += 1;
      }
    }
    results.synced += count;
    results.byType.grants = count;
    anySucceeded = true;
    logger.info('zadao_resource_sync_ok', { resource: 'grants', count });
  } catch (err) {
    logger.error('zadao_resource_sync_failed', { resource: 'grants', error: err.message });
    results.errors.push('grants');
  }

  // --- Remove gigs from public cache (not a public opportunity board) ---
  try {
    const removed = await Opportunity.deleteMany({
      source: 'zero_authority_dao',
      type: 'gig',
    });
    if (removed.deletedCount) {
      logger.info('zadao_gigs_removed_from_public_cache', { deleted: removed.deletedCount });
      results.byType.gigs_removed = removed.deletedCount;
    }
  } catch (err) {
    logger.warn('zadao_gigs_cleanup_failed', { error: err.message });
  }

  if (anySucceeded) results.sources.push('zero_authority_dao');

  // Stacks connectivity probe only
  const sBase = process.env.STACKS_API_BASE_URL;
  if (sBase) {
    try {
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
 * List cached opportunities.
 * Default: all open (bounty/quest/grant — never gigs), plus a few recently closed.
 */
async function listCachedOpportunities({ type, status, limit } = {}) {
  const baseQuery = {
    // Gigs are not public opportunities
    type: type || { $in: ['bounty', 'quest', 'grant', 'hackathon', 'builder_program', 'campaign', 'challenge', 'incentive', 'funding', 'other'] },
  };
  if (type) baseQuery.type = type;

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
    $or: [
      { deadline: { $gte: recentCutoff } },
      { deadline: null, lastSyncedAt: { $gte: recentCutoff } },
    ],
  })
    .sort({ deadline: -1, lastSyncedAt: -1 })
    .limit(RECENTLY_CLOSED_MAX);

  return [...openItems, ...recentlyClosed];
}

module.exports = { syncOpportunities, listCachedOpportunities };
