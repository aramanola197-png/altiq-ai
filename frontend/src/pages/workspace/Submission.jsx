import React, { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { GlassCard } from '../../components/Glass';
import { matchForProject, draftSubmission } from '../../api/opportunitiesApi';
import MarkdownContent from '../../components/MarkdownContent';
import { useToast } from '../../context/ToastContext';

export default function Submission() {
  const { project } = useOutletContext();
  const { projectId } = useParams();
  const [matches, setMatches] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(null);
  const [draft, setDraft] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    matchForProject(projectId)
      .then((data) => {
        setMatches(data.matches || []);
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-heading text-xl font-semibold">Submission Assistant</h2>
        <p className="text-dark-ash text-sm mt-1">
          Matched official opportunities for {project.name}. Drafts are editable and never submitted automatically.
        </p>
      </div>

      {loading ? (
        <GlassCard className="p-8">
          <div className="h-4 bg-light-ash/50 rounded animate-pulse w-2/3" />
        </GlassCard>
      ) : matches.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-charcoal text-sm max-w-md mx-auto leading-relaxed">
            {meta?.message ||
              'No matched opportunities yet. Sync official sources from the Opportunities page, then return here. ALTIQ AI never invents grants or bounties.'}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {matches.map((m) => (
            <GlassCard key={m.opportunityId || m.opportunity?._id} className="p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading font-semibold text-lg">
                      {m.opportunity?.title || 'Opportunity'}
                    </h3>
                    {m.opportunity?.status === 'closed' && (
                      <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-charcoal text-white shrink-0">
                        Closed
                      </span>
                    )}
                  </div>
                  {m.score != null && (
                    <p className="text-sm text-dark-ash mt-1">Match score: {m.score}%</p>
                  )}
                  {m.estimatedReadiness != null && (
                    <p className="text-sm text-dark-ash">Estimated readiness: {m.estimatedReadiness}%</p>
                  )}
                  {m.whyMatches?.length > 0 && (
                    <ul className="mt-3 text-sm text-charcoal list-disc list-inside space-y-1">
                      {m.whyMatches.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                  {m.suggestedImprovements?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-dark-ash uppercase tracking-wide mb-1">Suggested improvements</p>
                      <ul className="text-sm text-charcoal list-disc list-inside space-y-1">
                        {m.suggestedImprovements.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDraft(m.opportunity?._id || m.opportunityId)}
                  disabled={!!drafting}
                  className="shrink-0 px-5 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-charcoal transition disabled:opacity-60 h-fit"
                >
                  {drafting === (m.opportunity?._id || m.opportunityId) ? 'Drafting…' : 'Prepare draft'}
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {draft && (
        <GlassCard className="p-8">
          <div className="flex justify-between items-start mb-6 gap-4">
            <div>
              <h3 className="font-heading font-semibold text-lg">Draft — {draft.opportunity?.title}</h3>
              <p className="text-xs text-dark-ash mt-1">{draft.note}</p>
            </div>
          </div>
          <MarkdownContent content={draft.draft} />
        </GlassCard>
      )}
    </div>
  );
}
