import React, { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { GlassCard } from '../../components/Glass';
import { matchForProject, draftSubmission } from '../../api/opportunitiesApi';
import MarkdownContent from '../../components/MarkdownContent';
import { useToast } from '../../context/ToastContext';

export default function Submission() {
  const { project } = useOutletContext();
  const { projectId } = useParams();
  const [matches, setMatches] = useState([]);
  const [funding, setFunding] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(null);
  const [draft, setDraft] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    matchForProject(projectId)
      .then((data) => {
        setMatches(data.matches || []);
        setFunding(data.funding || null);
        setMeta(data.meta || null);
      })
      .catch((err) => addToast(err.message))
      .finally(() => setLoading(false));
  }, [projectId, addToast]);

  const handleDraft = async (opportunityId) => {
    setDrafting(opportunityId);
    setDraft(null);
    try {
      const data = await draftSubmission(projectId, opportunityId);
      setDraft(data);
      addToast('Submission draft ready for review.');
    } catch (err) {
      addToast(err.message);
    } finally {
      setDrafting(null);
    }
  };

  const openMatches = matches.filter(
    (m) => m.opportunity && m.opportunity.status === 'open'
  );

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-heading text-xl font-semibold text-black">Submission Assistant</h2>
        <p className="text-dark-ash text-sm mt-1 leading-relaxed max-w-2xl">
          Prepare materials for official Stacks / Zero Authority funding and open opportunities
          matched to <span className="text-charcoal font-medium">{project.name}</span>. Drafts are
          editable and are never submitted automatically.
        </p>
      </div>

      {/* ——— Funding / DeGrants ——— */}
      <section className="space-y-4">
        <div>
          <h3 className="font-heading text-base font-semibold text-black">Funding</h3>
          <p className="text-dark-ash text-sm mt-1">
            Official grant funding is coordinated through Zero Authority DAO DeGrants — not through
            private gigs or closed contractor jobs.
          </p>
        </div>
        <GlassCard className="p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h4 className="font-heading font-semibold text-black text-lg">
                  {funding?.title || 'Zero Authority DeGrants'}
                </h4>
                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-black text-white font-medium">
                  Funding
                </span>
              </div>
              <p className="text-charcoal text-sm leading-relaxed max-w-xl">
                {funding?.description ||
                  'DeGrants is Zero Authority DAO’s funding program for builders in the Stacks ecosystem. Review eligibility, past awards, and application guidance on the official page. ALTIQ AI helps you prepare — it never submits for you.'}
              </p>
            </div>
            <a
              href={
                funding?.url ||
                'https://zeroauthoritydao.com/funding/degrants'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 shrink-0 px-5 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-charcoal transition"
            >
              Open DeGrants
              <ExternalLink size={14} />
            </a>
          </div>
        </GlassCard>
      </section>

      {/* ——— Matched open opportunities ——— */}
      <section className="space-y-4">
        <div>
          <h3 className="font-heading text-base font-semibold text-black">Matched opportunities</h3>
          <p className="text-dark-ash text-sm mt-1">
            Open bounties and programs from official sources that may fit this project. Closed items
            are never offered for draft preparation.
          </p>
        </div>

        {loading ? (
          <GlassCard className="p-8">
            <div className="h-4 bg-light-ash/50 rounded animate-pulse w-2/3" />
          </GlassCard>
        ) : openMatches.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <p className="text-charcoal text-sm max-w-lg mx-auto leading-relaxed">
              {meta?.message ||
                'No open matched opportunities for this project right now. Sync official sources from the Opportunities page, then return here. ALTIQ AI never invents grants or bounties.'}
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {openMatches.map((m) => {
              const o = m.opportunity;
              const typeLabel =
                o.type === 'bounty'
                  ? 'Bounty'
                  : o.type === 'quest'
                    ? 'Quest'
                    : o.type === 'grant'
                      ? 'Grant'
                      : o.type;
              return (
                <GlassCard key={o._id || m.opportunityId} className="p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-heading font-semibold text-black text-lg">{o.title}</h4>
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-black/10 text-charcoal font-medium">
                          {typeLabel}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-900/10 text-emerald-800 font-medium">
                          Open
                        </span>
                      </div>
                      {o.organizer && (
                        <p className="text-dark-ash text-xs mb-2">{o.organizer}</p>
                      )}
                      {(m.score != null || m.estimatedReadiness != null) && (
                        <p className="text-dark-ash text-xs mb-3">
                          {m.score != null && <>Match score: {m.score}%</>}
                          {m.score != null && m.estimatedReadiness != null && ' · '}
                          {m.estimatedReadiness != null && (
                            <>Estimated readiness: {m.estimatedReadiness}%</>
                          )}
                        </p>
                      )}
                      {Array.isArray(m.whyMatches) && m.whyMatches.length > 0 && (
                        <ul className="text-sm text-charcoal space-y-1 mb-3 list-disc list-inside">
                          {m.whyMatches.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      )}
                      {Array.isArray(m.suggestedImprovements) &&
                        m.suggestedImprovements.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-dark-ash mb-1">
                              Suggested improvements
                            </p>
                            <ul className="text-sm text-charcoal space-y-1 list-disc list-inside">
                              {m.suggestedImprovements.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      {o.url && (
                        <a
                          href={o.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-charcoal underline underline-offset-2 mt-3 hover:text-black"
                        >
                          Official resource
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDraft(o._id)}
                      disabled={drafting === o._id}
                      className="shrink-0 px-5 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-charcoal transition disabled:opacity-50"
                    >
                      {drafting === o._id ? 'Preparing…' : 'Prepare draft'}
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </section>

      {draft && (
        <section className="space-y-3">
          <h3 className="font-heading text-base font-semibold text-black">Draft for review</h3>
          <GlassCard className="p-6 sm:p-8">
            <MarkdownContent>
              {typeof draft === 'string'
                ? draft
                : draft.draft || draft.content || JSON.stringify(draft, null, 2)}
            </MarkdownContent>
          </GlassCard>
        </section>
      )}
    </div>
  );
}
