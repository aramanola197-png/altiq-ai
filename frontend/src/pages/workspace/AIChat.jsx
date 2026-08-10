import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { GlassCard } from '../../components/Glass';
import MarkdownContent from '../../components/MarkdownContent';
import { getChatHistory, sendMessage } from '../../api/chatApi';
import { useToast } from '../../context/ToastContext';

const MODES = [
  { id: 'general', label: 'General' },
  { id: 'product_strategist', label: 'Product Strategist' },
  { id: 'market_researcher', label: 'Market Researcher' },
  { id: 'brand_strategist', label: 'Brand Strategist' },
  { id: 'grant_advisor', label: 'Grant Advisor' },
];

const COLLAPSE_CHARS = 1400;

function AssistantMessage({ content, animate }) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => typeof content === 'string' && content.length > COLLAPSE_CHARS
  );
  const isLong = typeof content === 'string' && content.length > COLLAPSE_CHARS;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }, [content]);

  const shown =
    collapsed && isLong ? `${content.slice(0, COLLAPSE_CHARS).trim()}…` : content;

  return (
    <div
      className={`relative ${animate ? 'ai-reveal' : ''}`}
    >
      <div className="rounded-2xl border border-ash/20 bg-white/80 px-5 py-5 shadow-sm">
        <MarkdownContent content={shown} />
        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-ash/15">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs text-dark-ash hover:text-black transition px-2 py-1 rounded-lg hover:bg-black/5"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {isLong && (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="inline-flex items-center gap-1 text-xs text-dark-ash hover:text-black transition px-2 py-1 rounded-lg hover:bg-black/5"
            >
              {collapsed ? (
                <>
                  <ChevronDown size={13} /> Expand
                </>
              ) : (
                <>
                  <ChevronUp size={13} /> Collapse
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ThinkingSkeleton() {
  return (
    <div className="ai-skeleton space-y-3 px-1 py-2" aria-hidden>
      <div className="h-3.5 bg-ash/25 rounded-full w-[88%] ai-skel-bar" />
      <div className="h-3.5 bg-ash/20 rounded-full w-[72%] ai-skel-bar" style={{ animationDelay: '0.12s' }} />
      <div className="h-3.5 bg-ash/15 rounded-full w-[64%] ai-skel-bar" style={{ animationDelay: '0.24s' }} />
    </div>
  );
}

export default function AIChat() {
  const { project } = useOutletContext();
  const { projectId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('general');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [latestAssistantId, setLatestAssistantId] = useState(null);
  const bottomRef = useRef(null);
  const { addToast } = useToast();

  useEffect(() => {
    getChatHistory(projectId)
      .then((data) => setMessages(data.messages || []))
      .catch((err) => addToast(err.message))
      .finally(() => setLoading(false));
  }, [projectId, addToast]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setSending(true);
    const optimistic = {
      _id: `tmp-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const data = await sendMessage(projectId, { content: text, mode });
      const incoming = data.messages || [];
      // Prefer full history from server when provided
      if (incoming.length) {
        setMessages(incoming);
        const lastAsst = [...incoming].reverse().find((m) => m.role === 'assistant');
        if (lastAsst) setLatestAssistantId(lastAsst._id || lastAsst.id);
      } else if (data.message) {
        setMessages((prev) => {
          const withoutTmp = prev.filter((m) => m._id !== optimistic._id);
          const userMsg = data.userMessage || optimistic;
          const asst = data.message;
          setLatestAssistantId(asst._id || asst.id || `asst-${Date.now()}`);
          return [...withoutTmp, userMsg, asst];
        });
      }
    } catch (err) {
      addToast(err.message || 'Message failed.');
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">AI Workspace</h2>
        <p className="text-dark-ash text-sm mt-1">
          Project-aware guidance for {project?.name || 'this project'}.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${
              mode === m.id
                ? 'bg-black text-white border-black'
                : 'border-ash/30 text-charcoal hover:bg-black/5'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <GlassCard className="p-5 sm:p-6 min-h-[280px] flex flex-col">
        <div className="flex-1 space-y-4 mb-4 max-h-[min(58vh,560px)] overflow-y-auto pr-1">
          {loading ? (
            <ThinkingSkeleton />
          ) : messages.length === 0 ? (
            <p className="text-sm text-dark-ash text-center py-12">
              Ask anything about this project — positioning, market, grants, or next steps.
            </p>
          ) : (
            messages.map((msg) =>
              msg.role === 'assistant' ? (
                <AssistantMessage
                  key={msg._id || msg.id}
                  content={msg.content}
                  animate={
                    (msg._id || msg.id) === latestAssistantId
                  }
                />
              ) : (
                <div
                  key={msg._id || msg.id}
                  className="ml-auto max-w-[85%] rounded-2xl bg-black text-white px-4 py-3 text-sm leading-relaxed"
                >
                  {msg.content}
                </div>
              )
            )
          )}
          {sending && (
            <div className="rounded-2xl border border-ash/20 bg-white/70 px-5 py-5">
              <ThinkingSkeleton />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() && !sending) {
                  e.currentTarget.form?.requestSubmit();
                }
              }
            }}
            placeholder="Ask about this project… (Shift+Enter for new line)"
            disabled={sending}
            rows={3}
            className="flex-1 px-4 py-3 rounded-2xl bg-page/50 border border-ash/30 text-sm outline-none focus:border-ash/50 resize-y min-h-[3rem] max-h-40 leading-relaxed"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-5 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-charcoal transition disabled:opacity-50 shrink-0"
          >
            Send
          </button>
        </form>
      </GlassCard>

      <style>{`
        @keyframes ai-reveal {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ai-reveal {
          animation: ai-reveal 220ms ease-out;
        }
        @keyframes skel-pulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.85; }
        }
        .ai-skel-bar {
          animation: skel-pulse 1.4s ease-in-out infinite;
        }
        .ai-skeleton {
          animation: ai-reveal 280ms ease-out;
        }
      `}</style>
    </div>
  );
}
