import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadExportPdf } from '../api/workspaceApi';
import { useToast } from '../context/ToastContext';

/**
 * Premium branded PDF download — fixed at the bottom of generated content.
 */
export default function DownloadPdfButton({ projectId, kind, type, label }) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handle = async () => {
    setLoading(true);
    try {
      await downloadExportPdf(projectId, kind, type);
      addToast('PDF downloaded.');
    } catch (err) {
      addToast(err.message || 'Could not download PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-8 mt-2 border-t border-ash/25">
      <button
        type="button"
        onClick={handle}
        disabled={loading}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-black text-white text-sm font-semibold tracking-wide hover:bg-charcoal transition disabled:opacity-60 shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
      >
        <Download size={16} strokeWidth={2.25} />
        {loading ? 'Preparing PDF…' : label || 'Download PDF'}
      </button>
      <p className="text-[11px] text-dark-ash mt-3 leading-relaxed max-w-md">
        Branded ALTIQ AI layout — logo header, project name, document title, horizontal rules, and page
        footers. Ready to share.
      </p>
    </div>
  );
}
