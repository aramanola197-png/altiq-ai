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

  return (
    <div
      className={`w-full max-w-[85%] sm:max-w-[860px] rounded-[20px] bg-white border border-ash/30 shadow-[0_4px_24px_rgba(0,0,0,0.05)] overflow-hidden ${
        animate ? 'alti-msg-enter' : ''
      }`}
    >
      {/* Subtle top accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-ash/40 via-light-ash to-transparent" />

      <div
        className={`px-4 sm:px-6 pt-5 pb-3 ${
          collapsed ? 'max-h-[280px] overflow-hidden relative' : ''
        }`}
      >
        <MarkdownContent content={content} />
        {collapsed && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-t border-ash/20 bg-[#FAFAFA]/70">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-dark-ash hover:text-black hover:bg-black/5 transition-colors duration-150"
            aria-label="Copy response"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        {isLong && (
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-dark-ash hover:text-black hover:bg-black/5 transition-colors duration-150"
          >
            {collapsed ? (
              <>
                Expand <ChevronDown size={13} />
              </>
            ) : (
              <>
                Collapse <ChevronUp size={13} />
              </>
            )}
          </button>
        )}
      </div>
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
  const [statusLine, setStatusLine] = useState('');
  const [newestAssistantId, setNewestAssistantId] = useState(null);
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
    if (!input.trim() || sending) return;

    const userContent = input.trim();
    setInput('');
    setSending(true);
    setStatusLine('Thinking…');

    const tempUser = { _id: 'temp-user', role: 'user', content: userContent };
    setMessages((prev) => [...prev, tempUser]);

    const statusInterval = setInterval(() => {
      setStatusLine((prev) => {
        if (prev === 'Thinking…') return 'Reasoning through it…';
        if (prev === 'Reasoning through it…') return 'Putting it together…';
        return 'Thinking…';
      });
    }, 1800);

    try {
      const data = await sendMessage(projectId, userContent, mode);
      clearInterval(statusInterval);
      const incoming = data.messages || [];
      const assistant = [...incoming].reverse().find((m) => m.role === 'assistant');
      if (assistant?._id) setNewestAssistantId(assistant._id);
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m._id !== 'temp-user');
        return [...withoutTemp, ...incoming];
      });
    } catch (err) {
      clearInterval(statusInterval);
      addToast(err.message || 'AI request failed. Your draft is preserved.');
    } finally {
      setSending(false);
      setStatusLine('');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)]">
      <div className="flex flex-wrap gap-2 mb-4">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              mode === m.id
                ? 'bg-black text-white border-black'
                : 'border-ash/30 text-dark-ash hover:border-black/40'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <GlassCard className="flex-1 overflow-y-auto p-4 sm:p-6 mb-4 space-y-5">
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-light-ash/50 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-light-ash/50 rounded animate-pulse w-1/2" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-dark-ash text-sm text-center py-12">
            Start a conversation about {project.name}. Context is scoped to this project only.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed bg-black text-white whitespace-pre-wrap break-words shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
                  {msg.content}
                </div>
              ) : (
                <AssistantMessage
                  content={msg.content}
                  animate={msg._id === newestAssistantId}
                />
              )}
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-white border border-ash/25 text-dark-ash text-sm flex items-center gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <span className="w-2 h-2 rounded-full bg-ash animate-pulse" />
              {statusLine}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </GlassCard>

      <form onSubmit={handleSend} className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this project…"
          disabled={sending}
          className="flex-1 px-5 py-3.5 rounded-full bg-white/70 border border-ash/30 focus:border-black/40 outline-none transition text-sm"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-6 py-3.5 rounded-full bg-black text-white font-semibold text-sm hover:bg-charcoal transition disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
