import React, { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { GlassCard } from '../../components/Glass';
import { getBrand, generateBrand } from '../../api/workspaceApi';
import { useToast } from '../../context/ToastContext';

export default function Brand() {
  const { project } = useOutletContext();
  const { projectId } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    getBrand(projectId)
      .then((data) => setAsset(data.asset))
      .catch((err) => addToast(err.message))
      .finally(() => setLoading(false));
  }, [projectId, addToast]);

  const handleGenerate = async () => {
    setGenerating(true);
    setStatus('Shaping positioning…');
    const interval = setInterval(() => {
      setStatus((s) =>
        s === 'Shaping positioning…' ? 'Defining voice…' : s === 'Defining voice…' ? 'Writing guidance…' : 'Shaping positioning…'
      );
    }, 2000);
    try {
      const data = await generateBrand(projectId);
      setAsset(data.asset);
      addToast('Brand guidance generated.');
    } catch (err) {
      addToast(err.message || 'Brand generation failed. Nothing was lost.');
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
          <h2 className="font-heading text-xl font-semibold">Brand Studio</h2>
          <p className="text-dark-ash text-sm mt-1">Positioning, voice, and brand guidance for {project.name}. Logo assets remain owner-supplied.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-charcoal transition disabled:opacity-60"
        >
          {generating ? status || 'Generating…' : asset ? 'Regenerate' : 'Generate brand guidance'}
        </button>
      </div>

      {loading ? (
        <GlassCard className="p-8 space-y-3">
          <div className="h-4 bg-light-ash/50 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-light-ash/50 rounded animate-pulse w-1/2" />
        </GlassCard>
      ) : !asset ? (
        <GlassCard className="p-12 text-center">
          <p className="text-charcoal text-sm mb-6">
            Generate structured brand guidance: positioning, mission, vision, tone, and direction for logo and banner.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-charcoal transition disabled:opacity-60"
          >
            Generate brand guidance
          </button>
        </GlassCard>
      ) : (
        <GlassCard className="p-8">
          <div className="flex justify-between items-center mb-6 text-xs text-dark-ash">
            <span>Version {asset.version}</span>
            <span>{new Date(asset.createdAt).toLocaleString()}</span>
          </div>
          <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap text-charcoal">
            {asset.content}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
