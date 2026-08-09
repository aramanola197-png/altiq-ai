import React, { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { GlassCard } from '../../components/Glass';
import { getDocuments, generateDocument } from '../../api/workspaceApi';
import MarkdownContent from '../../components/MarkdownContent';
import DownloadPdfButton from '../../components/DownloadPdfButton';
import { useToast } from '../../context/ToastContext';

const TYPES = [
  { id: 'readme', label: 'README' },
  { id: 'whitepaper', label: 'Whitepaper' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'pitch', label: 'Pitch outline' },
];

export default function Docs() {
  const { project } = useOutletContext();
  const { projectId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const [active, setActive] = useState(null);
  const { addToast } = useToast();

  const load = () =>
    getDocuments(projectId)
      .then((data) => {
        setDocuments(data.documents || []);
        if (!active && data.documents?.length) setActive(data.documents[0]);
      })
      .catch((err) => addToast(err.message));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [projectId]);

  const handleGenerate = async (type) => {
    setGenerating(type);
    try {
      const data = await generateDocument(projectId, type);
      addToast(`${type} generated.`);
      await load();
      setActive(data.document);
    } catch (err) {
      addToast(err.message || 'Document generation failed. Nothing was lost.');
    } finally {
      setGenerating(null);
    }
  };

  // Latest version per type
  const latestByType = {};
  documents.forEach((d) => {
    if (!latestByType[d.type] || d.version > latestByType[d.type].version) {
      latestByType[d.type] = d;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Documentation</h2>
        <p className="text-dark-ash text-sm mt-1">Professional documents for {project.name}. Editable history is versioned.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => handleGenerate(t.id)}
            disabled={!!generating}
            className="px-4 py-2 rounded-full border border-ash/30 text-sm hover:bg-black/5 transition disabled:opacity-50"
          >
            {generating === t.id ? 'Generating…' : `Generate ${t.label}`}
          </button>
        ))}
      </div>

      {loading ? (
        <GlassCard className="p-8">
          <div className="h-4 bg-light-ash/50 rounded animate-pulse w-2/3" />
        </GlassCard>
      ) : Object.keys(latestByType).length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-charcoal text-sm">
            No documents yet. Generate a README, whitepaper outline, roadmap, or pitch outline to get started.
          </p>
        </GlassCard>
      ) : (
        <div className="grid lg:grid-cols-[200px_1fr] gap-6">
          <div className="space-y-2">
            {Object.values(latestByType).map((d) => (
              <button
                key={d._id}
                onClick={() => setActive(d)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition ${
                  active?._id === d._id ? 'bg-black/5 text-black' : 'text-dark-ash hover:bg-black/5'
                }`}
              >
                <div className="font-heading font-medium capitalize">{d.type}</div>
                <div className="text-xs text-dark-ash mt-0.5">v{d.version}</div>
              </button>
            ))}
          </div>
          {active && (
            <GlassCard className="p-8">
              <div className="flex justify-between items-center mb-6 text-xs text-dark-ash">
                <span className="font-heading font-medium text-black capitalize">{active.type}</span>
                <span>v{active.version} · {new Date(active.createdAt).toLocaleString()}</span>
              </div>
              <MarkdownContent content={active.content} />
              <DownloadPdfButton
                projectId={projectId}
                kind="document"
                type={active.type}
                label={`Download ${active.type} PDF`}
              />
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
