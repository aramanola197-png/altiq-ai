import React, { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

/**
 * Premium GFM renderer for AI-generated content.
 * Presentation only — does not alter backend prompts or payloads.
 */

function languageFromClassName(className) {
  if (!className) return '';
  const match = /language-([\w-]+)/.exec(className);
  return match ? match[1] : '';
}

function CodeBlock({ className, children }) {
  const [copied, setCopied] = useState(false);
  const language = languageFromClassName(className);
  const codeText = String(children).replace(/\n$/, '');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard may be unavailable */
    }
  }, [codeText]);

  return (
    <div className="group relative my-4 rounded-[16px] border border-ash/30 bg-[#F6F6F6] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-ash/25 bg-white/70">
        <span className="font-heading text-[11px] uppercase tracking-wider text-dark-ash">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium text-dark-ash hover:text-black hover:bg-black/5 transition-colors duration-150"
          aria-label="Copy code"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed m-0">
        <code className={`${className || ''} font-mono text-charcoal`}>{children}</code>
      </pre>
    </div>
  );
}

function detectCallout(children) {
  // Flatten first text node to detect Tip / Note / Important / Warning prefixes
  const extract = (nodes) => {
    if (typeof nodes === 'string') return nodes;
    if (Array.isArray(nodes)) return nodes.map(extract).join('');
    if (nodes && nodes.props && nodes.props.children != null) return extract(nodes.props.children);
    return '';
  };
  const raw = extract(children).trim();
  const lower = raw.toLowerCase();
  if (/^(tip|hint)\b/.test(lower)) return { kind: 'tip', label: 'Tip' };
  if (/^(important|critical)\b/.test(lower)) return { kind: 'important', label: 'Important' };
  if (/^(warning|caution)\b/.test(lower)) return { kind: 'warning', label: 'Warning' };
  if (/^(note|info)\b/.test(lower)) return { kind: 'note', label: 'Note' };
  return { kind: 'note', label: null };
}

const CALLOUT_STYLES = {
  tip: {
    border: 'border-l-[#6B8F71]',
    bg: 'bg-[#F4F7F4]',
    label: 'text-[#4A6B50]',
  },
  important: {
    border: 'border-l-[#8B7355]',
    bg: 'bg-[#F8F5F1]',
    label: 'text-[#6B5A40]',
  },
  warning: {
    border: 'border-l-[#A67C52]',
    bg: 'bg-[#F9F5F0]',
    label: 'text-[#7A5C3A]',
  },
  note: {
    border: 'border-l-ash',
    bg: 'bg-[#F5F5F5]',
    label: 'text-dark-ash',
  },
};

function Callout({ children }) {
  const { kind, label } = detectCallout(children);
  const style = CALLOUT_STYLES[kind] || CALLOUT_STYLES.note;

  return (
    <aside
      className={`my-4 rounded-[14px] border border-ash/20 border-l-[3px] ${style.border} ${style.bg} px-4 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]`}
    >
      {label && (
        <p className={`font-heading text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${style.label}`}>
          {label}
        </p>
      )}
      <div className="text-[14.5px] leading-[1.7] text-charcoal [&>p]:mb-1.5 [&>p:last-child]:mb-0">
        {children}
      </div>
    </aside>
  );
}

export default function MarkdownContent({ content, className = '' }) {
  if (!content) return null;

  const components = useMemo(
    () => ({
      h1: ({ children }) => (
        <h1 className="font-heading text-[1.55rem] sm:text-[1.75rem] font-bold text-ash tracking-tight mt-8 mb-3 first:mt-0 leading-[1.25] pb-2 border-b border-ash/20">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="font-heading text-[1.25rem] sm:text-[1.35rem] font-semibold text-ash tracking-tight mt-7 mb-2.5 first:mt-0 leading-[1.3]">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="font-heading text-[1.05rem] sm:text-[1.15rem] font-semibold text-ash mt-6 mb-2 first:mt-0 leading-[1.35]">
          {children}
        </h3>
      ),
      h4: ({ children }) => (
        <h4 className="font-heading text-[0.95rem] sm:text-base font-semibold text-dark-ash mt-5 mb-1.5 first:mt-0 leading-[1.4]">
          {children}
        </h4>
      ),
      p: ({ children }) => (
        <p className="text-charcoal text-[15px] leading-[1.8] mb-3.5 last:mb-0 break-words [overflow-wrap:anywhere]">
          {children}
        </p>
      ),
      strong: ({ children }) => (
        <strong className="font-semibold text-black">{children}</strong>
      ),
      em: ({ children }) => <em className="italic text-charcoal">{children}</em>,
      ul: ({ children }) => (
        <ul className="list-disc marker:text-ash pl-5 sm:pl-6 mb-3.5 space-y-2 text-charcoal text-[15px] leading-[1.75]">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal marker:text-ash marker:font-heading pl-5 sm:pl-6 mb-3.5 space-y-2 text-charcoal text-[15px] leading-[1.75]">
          {children}
        </ol>
      ),
      li: ({ children }) => (
        <li className="pl-1 break-words [overflow-wrap:anywhere] [&>p]:mb-1 [&>p]:leading-[1.75] [&>ul]:mt-2 [&>ol]:mt-2 [&>ul]:mb-1 [&>ol]:mb-1">
          {children}
        </li>
      ),
      blockquote: ({ children }) => <Callout>{children}</Callout>,
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-black font-medium underline underline-offset-[3px] decoration-ash/50 hover:decoration-black transition-colors break-words [overflow-wrap:anywhere]"
        >
          {children}
        </a>
      ),
      hr: () => <hr className="border-0 border-t border-ash/25 my-6" />,
      code: ({ className: codeClass, children, ...props }) => {
        const isBlock = typeof codeClass === 'string' && codeClass.includes('language-');
        if (isBlock) {
          return (
            <code className={`${codeClass || ''} font-mono text-[13px]`} {...props}>
              {children}
            </code>
          );
        }
        return (
          <code
            className="font-mono text-[12.5px] bg-light-ash/55 text-charcoal px-1.5 py-[2px] rounded-md break-words [overflow-wrap:anywhere] border border-ash/15"
            {...props}
          >
            {children}
          </code>
        );
      },
      pre: ({ children }) => {
        // react-markdown nests <code class="language-..."> inside <pre>
        const codeChild = React.Children.toArray(children).find(
          (c) => React.isValidElement(c) && c.type === 'code'
        );
        if (React.isValidElement(codeChild)) {
          return (
            <CodeBlock className={codeChild.props.className}>
              {codeChild.props.children}
            </CodeBlock>
          );
        }
        return (
          <pre className="bg-[#F6F6F6] border border-ash/25 rounded-[16px] p-4 my-4 overflow-x-auto text-[13px] leading-relaxed">
            {children}
          </pre>
        );
      },
      table: ({ children }) => (
        <div className="my-4 w-full overflow-x-auto -mx-1 px-1">
          <table className="min-w-full text-sm border-collapse">
            {children}
          </table>
        </div>
      ),
      table_UNUSED: ({ children }) => (
        <div className="my-4 w-full overflow-x-auto rounded-[16px] border border-ash/30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <table className="w-full min-w-[420px] text-left text-sm border-collapse">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }) => (
        <thead className="bg-[#F0F0F0] text-black font-heading sticky top-0 z-[1]">
          {children}
        </thead>
      ),
      tbody: ({ children }) => <tbody className="text-charcoal">{children}</tbody>,
      tr: ({ children }) => (
        <tr className="border-b border-ash/15 last:border-0 even:bg-[#FAFAFA]">{children}</tr>
      ),
      th: ({ children }) => (
        <th className="px-3.5 py-2.5 text-left text-[13px] font-semibold whitespace-nowrap border-b border-ash/25">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="px-3.5 py-2.5 align-top text-[13.5px] leading-relaxed break-words [overflow-wrap:anywhere]">
          {children}
        </td>
      ),
      input: ({ checked, ...props }) => (
        <input
          type="checkbox"
          checked={!!checked}
          readOnly
          className="mr-2 mt-0.5 align-middle h-3.5 w-3.5 rounded border-ash/50 accent-black"
          {...props}
        />
      ),
    }),
    []
  );

  return (
    <div className={`alti-md max-w-[820px] w-full mx-auto ${className} overflow-x-auto max-w-full`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
