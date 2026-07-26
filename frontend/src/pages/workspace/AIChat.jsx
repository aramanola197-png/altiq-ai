import React, { useEffect, useState, useRef } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { GlassCard } from '../../components/Glass';
import { getChatHistory, sendMessage } from '../../api/chatApi';
import { useToast } from '../../context/ToastContext';

const MODES = [
  { id: 'general', label: 'General' },
  { id: 'product_strategist', label: 'Product Strategist' },
  { id: 'market_researcher', label: 'Market Researcher' },
  { id: 'brand_strategist', label: 'Brand Strategist' },
  { id: 'grant_advisor', label: 'Grant Advisor' },
];

export default function AIChat() {
  const { project } = useOutletContext();
  const { projectId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('general');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusLine, setStatusLine] = useState('');
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

    // Optimistic user message
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
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m._id !== 'temp-user');
        return [...withoutTemp, ...(data.messages || [])];
      });
    } catch (err) {
      clearInterval(statusInterval);
      addToast(err.message || 'AI request failed. Your draft is preserved.');
      // keep the optimistic user message so nothing is lost
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

      <GlassCard className="flex-1 overflow-y-auto p-6 mb-4 space-y-4">
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
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-black text-white'
                    : 'bg-white text-charcoal border border-ash/25'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-white/80 text-dark-ash text-sm flex items-center gap-2">
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
