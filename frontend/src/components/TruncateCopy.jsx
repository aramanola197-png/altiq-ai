import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * Truncates long values on small screens; full data preserved; copy button.
 */
export default function TruncateCopy({ value, empty = '—', className = '' }) {
  const text = (value || '').trim();
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!text) {
    return <span className={`text-charcoal ${className}`}>{empty}</span>;
  }

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={`flex items-center gap-2 min-w-0 max-w-full justify-end ${className}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        title={text}
        className={`text-right text-charcoal text-sm min-w-0 ${
          expanded ? 'break-all whitespace-normal' : 'truncate max-w-[9.5rem] sm:max-w-[14rem]'
        }`}
      >
        {text}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 p-1.5 rounded-lg border border-ash/25 hover:bg-black/5 transition text-dark-ash"
        aria-label="Copy"
        title="Copy"
      >
        {copied ? <Check size={13} className="text-black" /> : <Copy size={13} />}
      </button>
    </div>
  );
}
