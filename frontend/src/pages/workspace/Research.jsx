import React, { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { GlassCard } from '../../components/Glass';
import { getResearch, generateResearch } from '../../api/workspaceApi';
import MarkdownContent from '../../components/MarkdownContent';
import DownloadPdfButton from '../../components/DownloadPdfButton';
import { useToast } from '../../context/ToastContext';

export default function Research() {
  const { project } = useOutletContext();
  const { projectId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    getResearch(projectId)
      .then((data) => setReport(data.report))
      .catch((err) => addToast(err.message))
      .finally(() => setLoading(false));
  }, [projectId, addToast]);

  const handleGenerate = async () => {
    setGenerating(true);
    setStatus('Analyzing market…');
    const interval = setInterval(() => {
      setStatus((s) =>
        s === 'Analyzing market…'
          ? 'Mapping competitors…'
          : s === 'Mapping competitors…'
            ? 'Structuring report…'
            : 'Analyzing market…'
      );
    }, 2000);
    try {
      const data = await generateResearch(projectId);
      setReport(data.report);
      addToast('Research report generated.');
    } catch (err) {
      addToast(err.message || 'Research generation failed. Nothing was lost.');
    } finally {
      clearInterval(interval);
      setGenerating(false);
      setStatus('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">Research</h2>
          <p className="text-dark-ash text-sm mt-1">
            Structured market and competitor analysis for {project.name}.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-charcoal transition disabled:opacity-60"
        >
          {generating ? status || 'Generating…' : report ? 'Regenerate' : 'Generate research'}
        </button>
      </div>

      {loading ? (
        <GlassCard className="p-8 space-y-3">
          <div className="h-4 bg-light-ash/50 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-light-ash/50 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-light-ash/50 rounded animate-pulse w-2/3" />
        </GlassCard>
      ) : !report ? (
        <GlassCard className="p-12 text-center">
          <p className="text-charcoal text-sm mb-6">
            No research yet. Generate a structured report covering problem analysis, market overview,
            competitors, risks, and recommendations.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-charcoal transition disabled:opacity-60"
          >
            Generate research
          </button>
        </GlassCard>
      ) : (
        <GlassCard className="p-8">
          <div className="flex justify-between items-center mb-6 text-xs text-dark-ash gap-3 flex-wrap">
            <span>Version {report.version}</span>
            <span>{new Date(report.createdAt).toLocaleString()}</span>
          </div>
          <MarkdownContent content={report.content} />
          <DownloadPdfButton
            projectId={projectId}
            kind="research"
            label="Download Research PDF"
          />
        </GlassCard>
      )}
    </div>
  );
}
