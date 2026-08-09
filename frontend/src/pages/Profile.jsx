import React, { useEffect, useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AppShell from '../components/AppShell';
import { getProfile, getMetrics, updateProfile } from '../api/profileApi';
import { GLASS, CARD_RADIUS } from '../theme';
import TruncateCopy from '../components/TruncateCopy';

const INTERESTS = [
  'AI', 'DeFi', 'Infrastructure', 'Payments', 'Education',
  'Identity', 'Analytics', 'Gaming', 'Social', 'Security',
];
const GOALS = ['Find Grants', 'Find Bounties', 'Build Product', 'Launch Project'];
const EXPERIENCE = ['none', 'beginner', 'intermediate', 'advanced', 'expert'];
const OCCUPATIONS = [
  'Student', 'Graduate', 'Developer', 'Designer', 'Founder',
  'Product Manager', 'Researcher', 'Community Manager', 'Marketer', 'Other',
];

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-dark-ash">{label}</span>
      <span className="text-right text-charcoal">{value || '—'}</span>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    Promise.all([
      getProfile().catch(() => ({ profile: null })),
      getMetrics().catch(() => ({ metrics: null })),
    ])
      .then(([profRes, metRes]) => {
        setProfile(profRes?.profile || null);
        setMetrics(metRes?.metrics || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const startEdit = () => {
    if (!profile) return;
    setEditForm({
      occupation: profile.occupation || '',
      stacksExperience: profile.stacksExperience || 'none',
      skills: (profile.skills || []).join(', '),
      projectInterests: [...(profile.projectInterests || [])],
      goals: [...(profile.goals || [])],
      portfolio: {
        github: profile.portfolio?.github || '',
        website: profile.portfolio?.website || '',
        xProfile: profile.portfolio?.xProfile || '',
      },
      walletType: profile.walletType || '',
      walletAddress: profile.walletAddress || '',
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditForm(null);
  };

  const toggleArr = (key, value) => {
    setEditForm((prev) => {
      const arr = prev[key] || [];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const data = await updateProfile({
        occupation: editForm.occupation,
        stacksExperience: editForm.stacksExperience,
        skills: editForm.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        projectInterests: editForm.projectInterests,
        goals: editForm.goals,
        portfolio: editForm.portfolio,
        walletType: editForm.walletType || undefined,
        walletAddress: editForm.walletAddress,
      });
      setProfile(data.profile);
      setEditing(false);
      setEditForm(null);
      addToast('Builder profile updated.');
    } catch (err) {
      addToast(err.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.name || profile?.username || 'Builder';
  const initial = displayName.charAt(0).toUpperCase();
  const c = metrics?.counts || metrics;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-5 py-8 lg:py-12">
        {/* Identity header — mobile centered, desktop left + content right */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-center lg:items-start mb-10">
          <div className="flex flex-col items-center lg:items-start shrink-0">
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-black text-white flex items-center justify-center font-heading text-4xl font-bold shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
              aria-hidden
            >
              {initial}
            </div>
            <h1 className="font-heading text-2xl font-bold mt-5 text-center lg:text-left">{displayName}</h1>
            {profile?.username && (
              <p className="text-dark-ash text-sm mt-1">@{profile.username}</p>
            )}
            <p className="text-charcoal text-sm mt-2 text-center lg:text-left max-w-xs">
              Your builder identity on ALTIQ AI
            </p>
          </div>

          <div className="flex-1 w-full min-w-0 space-y-6">
            {/* Account snapshot */}
            <div className="p-7" style={{ ...GLASS, ...CARD_RADIUS }}>
              <h2 className="font-heading font-semibold mb-4">Account</h2>
              <div className="space-y-3 text-sm">
                <Row label="Email" value={user?.email} />
                <Row
                  label="Signed in with"
                  value={user?.authProvider === 'google' ? 'Google' : 'Email'}
                />
                <Row label="Country" value={profile?.country} />
              </div>
            </div>

            {/* Activity metrics */}
            <div className="p-7" style={{ ...GLASS, ...CARD_RADIUS }}>
              <h2 className="font-heading font-semibold mb-4">Your activity</h2>
              {c ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    ['Projects', c?.projects],
                    ['AI chats', c?.aiChats],
                    ['Research', c?.research],
                    ['Brand', c?.brand],
                    ['Documents', c?.documents],
                    ['Matches', c?.matches],
                  ].map(([label, val]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-ash/25 px-4 py-3 bg-white/40"
                    >
                      <p className="text-dark-ash text-xs mb-1">{label}</p>
                      <p className="font-heading font-semibold text-black text-lg">{val ?? 0}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-ash text-sm">
                  Activity metrics will appear as you use the workspace.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Builder profile card */}
        <div className="p-7 sm:p-8" style={{ ...GLASS, ...CARD_RADIUS }}>
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="font-heading font-semibold">Builder profile</h2>
              <p className="text-xs text-dark-ash mt-1 max-w-md">
                Username, email, and country stay fixed. Update interests and links to improve
                opportunity matching.
              </p>
            </div>
            {!editing && profile && (
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-full border border-ash/30 text-sm hover:bg-black/5 transition"
              >
                <Pencil size={14} /> Edit
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-dark-ash text-sm">Loading…</p>
          ) : !profile ? (
            <p className="text-dark-ash text-sm">No builder profile found yet.</p>
          ) : !editing ? (
            <div className="space-y-3 text-sm">
              <Row label="Username" value={profile.username} />
              <Row label="Occupation" value={profile.occupation} />
              <Row label="Stacks experience" value={profile.stacksExperience} />
              <Row label="Skills" value={(profile.skills || []).join(', ')} />
              <Row label="Interests" value={(profile.projectInterests || []).join(', ')} />
              <Row label="Goals" value={(profile.goals || []).join(', ')} />
              <div className="flex justify-between gap-4 items-center min-w-0">
                <span className="text-dark-ash shrink-0">GitHub</span>
                <TruncateCopy value={profile.portfolio?.github} />
              </div>
              <div className="flex justify-between gap-4 items-center min-w-0">
                <span className="text-dark-ash shrink-0">Website</span>
                <TruncateCopy value={profile.portfolio?.website} />
              </div>
              <div className="flex justify-between gap-4 items-center min-w-0">
                <span className="text-dark-ash shrink-0">X Profile</span>
                <TruncateCopy value={profile.portfolio?.xProfile} />
              </div>
              <Row label="Wallet type" value={profile.walletType} />
              <div className="flex justify-between gap-4 items-center min-w-0">
                <span className="text-dark-ash shrink-0">Wallet address</span>
                <TruncateCopy value={profile.walletAddress} />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-dark-ash mb-2">Occupation</label>
                <select
                  value={editForm.occupation}
                  onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none"
                >
                  <option value="">Select…</option>
                  {OCCUPATIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-ash mb-2">Stacks experience</label>
                <select
                  value={editForm.stacksExperience}
                  onChange={(e) => setEditForm({ ...editForm, stacksExperience: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none"
                >
                  {EXPERIENCE.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-ash mb-2">Skills (comma-separated)</label>
                <input
                  value={editForm.skills}
                  onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none"
                />
              </div>
              <div>
                <p className="text-sm text-dark-ash mb-2">Project interests</p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleArr('projectInterests', i)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition ${
                        editForm.projectInterests.includes(i)
                          ? 'bg-black text-white border-black'
                          : 'border-ash/30 text-charcoal hover:bg-black/5'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-dark-ash mb-2">Goals</p>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleArr('goals', g)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition ${
                        editForm.goals.includes(g)
                          ? 'bg-black text-white border-black'
                          : 'border-ash/30 text-charcoal hover:bg-black/5'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-dark-ash mb-2">GitHub</label>
                <input
                  value={editForm.portfolio.github}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      portfolio: { ...editForm.portfolio, github: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none"
                  placeholder="https://github.com/…"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-ash mb-2">Website or Telegram</label>
                <input
                  value={editForm.portfolio.website}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      portfolio: { ...editForm.portfolio, website: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none"
                  placeholder="https://… or t.me/…"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-ash mb-2">X profile</label>
                <input
                  value={editForm.portfolio.xProfile}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      portfolio: { ...editForm.portfolio, xProfile: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none"
                  placeholder="https://x.com/…"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-ash mb-2">Wallet type</label>
                <select
                  value={editForm.walletType}
                  onChange={(e) => setEditForm({ ...editForm, walletType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none"
                >
                  <option value="">Select…</option>
                  <option value="stacks">Stacks</option>
                  <option value="ethereum">Ethereum</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-ash mb-2">Wallet address</label>
                <input
                  value={editForm.walletAddress}
                  onChange={(e) => setEditForm({ ...editForm, walletAddress: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none font-mono text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-charcoal transition disabled:opacity-60"
                >
                  <Save size={14} /> {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-ash/30 text-sm font-medium hover:bg-black/5 transition"
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
