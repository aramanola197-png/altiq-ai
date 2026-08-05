import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { saveProfile } from '../api/profileApi';
import { GLASS, CARD_RADIUS } from '../theme';
import OrbitalBackground from '../components/OrbitalBackground';
import { COUNTRIES } from '../constants/countries';

const INTERESTS = ['AI', 'DeFi', 'Infrastructure', 'Payments', 'Education', 'Identity', 'Analytics', 'Gaming', 'Social', 'Security'];
const GOALS = ['Find Grants', 'Find Bounties', 'Build Product', 'Launch Project'];
const EXPERIENCE = ['none', 'beginner', 'intermediate', 'advanced', 'expert'];

/** Professional occupation options — not overly personal. */
const OCCUPATIONS = [
  'Student',
  'Graduate',
  'Developer',
  'Designer',
  'Founder',
  'Product Manager',
  'Researcher',
  'Community Manager',
  'Marketer',
  'Other',
];

/**
 * Accept a real web URL, a telegram handle/link, or (for X) an @handle.
 * Reject single letters, bare words, and other non-link noise.
 */
function isValidWebOrTelegram(value) {
  const v = (value || '').trim();
  if (!v) return true; // optional empty
  if (v.length < 4) return false;

  // Telegram: t.me/..., telegram.me/..., or bare t.me style without scheme
  if (/^(https?:\/\/)?(t\.me|telegram\.me)\/[A-Za-z0-9_]{3,}$/i.test(v)) return true;
  if (/^@[A-Za-z0-9_]{3,}$/.test(v)) return false; // @ alone is X-style, not website

  // Full URL with http(s)
  try {
    const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
    const u = new URL(withScheme);
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    // Must have a real hostname with a dot (or localhost for dev)
    if (!u.hostname.includes('.') && u.hostname !== 'localhost') return false;
    // Reject pure single-char hosts
    if (u.hostname.replace(/\./g, '').length < 2) return false;
    return true;
  } catch {
    return false;
  }
}

function isValidGithub(value) {
  const v = (value || '').trim();
  if (!v) return true; // optional
  if (v.length < 2) return false;
  // github.com/user or github.com/user/repo or bare username
  if (/^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/.test(v)) return true;
  try {
    const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
    const u = new URL(withScheme);
    if (!/github\.com$/i.test(u.hostname) && u.hostname !== 'github.com') {
      // allow www.github.com
      if (!/(^|\.)github\.com$/i.test(u.hostname)) return false;
    }
    return u.pathname.replace(/\//g, '').length >= 1;
  } catch {
    return false;
  }
}

function isValidXProfile(value) {
  const v = (value || '').trim();
  if (!v) return true; // optional
  // @handle
  if (/^@[A-Za-z0-9_]{1,15}$/.test(v)) return true;
  // bare handle
  if (/^[A-Za-z0-9_]{1,15}$/.test(v)) return true;
  try {
    const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
    const u = new URL(withScheme);
    if (!/(^|\.)(x\.com|twitter\.com)$/i.test(u.hostname)) return false;
    return u.pathname.replace(/\//g, '').length >= 1;
  } catch {
    return false;
  }
}

export default function BuilderProfile() {
  const { refreshUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    username: '',
    country: '',
    occupation: '',
    stacksExperience: 'none',
    skills: '',
    projectInterests: [],
    goals: [],
    portfolio: { github: '', website: '', xProfile: '' },
    walletAddress: '',
    walletType: '',
    securityQuestion: '',
    securityAnswer: '',
  });

  const toggleArray = (key, value) => {
    setForm((prev) => {
      const arr = prev[key] || [];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.username) {
      addToast('Name and username are required.');
      return;
    }
    if (form.username.trim().length < 3) {
      addToast('Username must be at least 3 characters.');
      return;
    }
    if (!form.occupation) {
      addToast('Please select an occupation.');
      return;
    }
    if (!isValidGithub(form.portfolio.github)) {
      addToast('GitHub must be a github.com link or a valid username (or leave it blank).');
      return;
    }
    if (!isValidWebOrTelegram(form.portfolio.website)) {
      addToast('Website must be a full link (e.g. https://yoursite.com) or a Telegram link (e.g. t.me/yourname).');
      return;
    }
    if (!isValidXProfile(form.portfolio.xProfile)) {
      addToast('X profile must be an @handle or an x.com / twitter.com link (or leave it blank).');
      return;
    }

    const sq = (form.securityQuestion || '').trim().toUpperCase();
    const sa = (form.securityAnswer || '').trim().toUpperCase();
    if (sq.length < 5) {
      addToast('Security question is required — write it in CAPITAL LETTERS (at least 5 characters).');
      return;
    }
    if (sa.length < 3) {
      addToast('Security answer is required — write it in CAPITAL LETTERS (at least 3 characters).');
      return;
    }
    if (form.securityQuestion.trim() !== sq || form.securityAnswer.trim() !== sa) {
      addToast('Security question and answer must be written in CAPITAL LETTERS only.');
      return;
    }

    setLoading(true);
    try {
      await saveProfile({
        ...form,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        portfolio: {
          github: (form.portfolio.github || '').trim(),
          website: (form.portfolio.website || '').trim(),
          xProfile: (form.portfolio.xProfile || '').trim(),
        },
        walletType: form.walletType || '',
        securityQuestion: sq,
        securityAnswer: sa,
      });
      await refreshUser();
      addToast('Profile completed. Welcome to ALTIQ AI.');
      navigate('/dashboard');
    } catch (err) {
      addToast(err.message || 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-page py-16 px-5 overflow-hidden">
      <OrbitalBackground intensity={1} />
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-heading text-3xl font-bold mb-3">Complete your builder profile</h1>
          <p className="text-dark-ash">This information powers personalization and opportunity matching. It cannot be skipped.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-8"
          style={{ ...GLASS, ...CARD_RADIUS }}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-ash mb-2">Full name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-ash mb-2">Username</label>
              <input
                required
                minLength={3}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-ash mb-2">Country</label>
              <select
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition"
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-dark-ash mb-2">Occupation</label>
              <select
                required
                value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition"
              >
                <option value="">Select occupation</option>
                {OCCUPATIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-dark-ash mb-2">Stacks experience</label>
            <select
              value={form.stacksExperience}
              onChange={(e) => setForm({ ...form, stacksExperience: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition"
            >
              {EXPERIENCE.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-dark-ash mb-2">Skills (comma-separated)</label>
            <input
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              placeholder="e.g. Solidity, TypeScript, Product design"
              className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm text-dark-ash mb-3">Project interests</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => toggleArray('projectInterests', g)}
                  className={`px-4 py-2 rounded-full text-sm border transition ${
                    form.projectInterests.includes(g)
                      ? 'bg-black text-white border-black'
                      : 'border-ash/30 text-charcoal hover:border-black/40'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-dark-ash mb-3">Goals</label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => toggleArray('goals', g)}
                  className={`px-4 py-2 rounded-full text-sm border transition ${
                    form.goals.includes(g)
                      ? 'bg-black text-white border-black'
                      : 'border-ash/30 text-charcoal hover:border-black/40'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-dark-ash leading-relaxed">
              Portfolio links help with matching. <span className="font-medium text-charcoal">GitHub is optional</span>.
              For website, add a personal site or portfolio — a Telegram link such as{' '}
              <span className="font-mono text-[11px]">t.me/yourname</span> is also fine.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-dark-ash mb-2">
                  GitHub <span className="text-dark-ash/70">(optional)</span>
                </label>
                <input
                  value={form.portfolio.github}
                  onChange={(e) =>
                    setForm({ ...form, portfolio: { ...form.portfolio, github: e.target.value } })
                  }
                  placeholder="github.com/you"
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-ash mb-2">
                  Website or Telegram
                </label>
                <input
                  value={form.portfolio.website}
                  onChange={(e) =>
                    setForm({ ...form, portfolio: { ...form.portfolio, website: e.target.value } })
                  }
                  placeholder="https://yoursite.com or t.me/you"
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-ash mb-2">
                  X Profile <span className="text-dark-ash/70">(optional)</span>
                </label>
                <input
                  value={form.portfolio.xProfile}
                  onChange={(e) =>
                    setForm({ ...form, portfolio: { ...form.portfolio, xProfile: e.target.value } })
                  }
                  placeholder="@handle or x.com/you"
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-dark-ash mb-2">Wallet type</label>
              <select
                value={form.walletType}
                onChange={(e) => setForm({ ...form, walletType: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition"
              >
                <option value="">Select network (optional)</option>
                <option value="stacks">Stacks</option>
                <option value="ethereum">Ethereum</option>
              </select>
              <p className="text-xs text-dark-ash mt-2">Choose Stacks or Ethereum if you share a wallet address.</p>
            </div>
            <div>
              <label className="block text-sm text-dark-ash mb-2">Wallet address (optional)</label>
              <input
                value={form.walletAddress}
                onChange={(e) => setForm({ ...form, walletAddress: e.target.value })}
                placeholder={form.walletType === 'stacks' ? 'Stacks address (SP…)' : form.walletType === 'ethereum' ? '0x…' : 'Optional'}
                className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-ash/20 space-y-4">
            <div>
              <p className="font-heading font-semibold text-black text-sm mb-1">Account recovery question</p>
              <p className="text-xs text-dark-ash leading-relaxed mb-4">
                Required. Write both the question and the answer in{' '}
                <span className="font-semibold text-charcoal">CAPITAL LETTERS only</span>.
                You will need the exact same pair later if you change your password in Settings.
              </p>
            </div>
            <div>
              <label className="block text-sm text-dark-ash mb-2">Your question (CAPITAL LETTERS)</label>
              <input
                required
                value={form.securityQuestion}
                onChange={(e) => setForm({ ...form, securityQuestion: e.target.value.toUpperCase() })}
                placeholder="E.g. WHAT CITY WAS I BORN IN?"
                className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition uppercase tracking-wide"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-ash mb-2">Your answer (CAPITAL LETTERS)</label>
              <input
                required
                value={form.securityAnswer}
                onChange={(e) => setForm({ ...form, securityAnswer: e.target.value.toUpperCase() })}
                placeholder="E.g. LAGOS"
                className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition uppercase tracking-wide"
                autoComplete="off"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-black text-white font-semibold hover:bg-charcoal transition disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Complete profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
