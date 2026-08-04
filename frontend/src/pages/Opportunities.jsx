import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { GlassCard } from '../components/Glass';
import { listOpportunities, syncOpportunities } from '../api/opportunitiesApi';
import { useToast } from '../context/ToastContext';

export default function Opportunities() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { addToast } = useToast();

  const load = () =>
    listOpportunities()
      .then((data) => {
        setItems(data.opportunities || []);
        setMeta(data.meta || null);
      })
      .catch((err) => addToast(err.message));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const data = await syncOpportunities();
      addToast(data.message || 'Sync complete.');
      await load();
    } catch (err) {
      addToast(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-5 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="font-heading text-3xl font-bold mb-2">Opportunities</h1>
            <p className="text-dark-ash text-sm">
              Official grants, bounties, and programs from Zero Authority DAO and Stacks only.
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-5 py-2.5 rounded-full border border-ash/30 text-sm font-medium hover:bg-black/5 transition disabled:opacity-60"
          >
            {syncing ? 'Syncing…' : 'Sync official sources'}
          </button>
        </div>

        {meta?.lastSyncedAt && (
          <p className="text-xs text-dark-ash mb-6">
            Last synced: {new Date(meta.lastSyncedAt).toLocaleString()}
          </p>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-card bg-charcoal/60 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <h3 className="font-heading font-semibold text-lg mb-3">Opportunities expired or not found. Check back later.</h3>
            <p className="text-charcoal text-sm max-w-md mx-auto mb-6 leading-relaxed">
              {meta?.note ||
                'Opportunity data comes only from Zero Authority DAO (primary) and official Stacks APIs (secondary). Nothing is ever fabricated.'}
            </p>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-6 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-charcoal transition disabled:opacity-60"
            >
              {syncing ? 'Syncing…' : 'Retry sync'}
            </button>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {items.map((o) => (
              <GlassCard key={o._id} className={`p-6 ${o.status === 'closed' ? 'opacity-70' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs uppercase tracking-wide text-dark-ash">{o.type}</span>
                      <span className="text-xs text-dark-ash">· {o.source?.replace(/_/g, ' ')}</span>
                      {o.status === 'closed' && (
                        <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-charcoal text-white">
                          Closed
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading font-semibold text-lg">{o.title}</h3>
                    {o.organizer && <p className="text-sm text-dark-ash mt-1">{o.organizer}</p>}
                    {o.description && (
                      <p className="text-sm text-charcoal mt-3 line-clamp-3">{o.description}</p>
                    )}
                  </div>
                  <div className="text-xs text-dark-ash shrink-0">
                    {o.deadline ? `Deadline: ${new Date(o.deadline).toLocaleDateString()}` : 'No deadline listed'}
                  </div>
                </div>
                {o.url && (
                  <a
                    href={o.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 text-sm text-black underline underline-offset-4 hover:text-charcoal"
                  >
                    Official resource
                  </a>
                )}
              </GlassCard>
            ))}
          </div>
        )}

        <p className="text-xs text-dark-ash mt-10">
          To match opportunities to a specific project, open the project workspace and use Submission preparation after matches are available.
        </p>
      </div>
    </AppShell>
  );
}
