import React, { useEffect, useState } from 'react';
import { Pencil, KeyRound, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { getProfile, getMetrics, updateProfile } from '../api/profileApi';
import { changePassword } from '../api/authApi';
import { GLASS, CARD_RADIUS } from '../theme';

const INTERESTS = ['AI', 'DeFi', 'Infrastructure', 'Payments', 'Education', 'Identity', 'Analytics', 'Gaming', 'Social', 'Security'];
const GOALS = ['Find Grants', 'Find Bounties', 'Build Product', 'Launch Project'];
const EXPERIENCE = ['none', 'beginner', 'intermediate', 'advanced', 'expert'];
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

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-dark-ash">{label}</span>
      <span className="text-right text-charcoal">{value || '—'}</span>
    </div>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const [pw, setPw] = useState({
    securityQuestion: '',
    securityAnswer: '',
    newPassword: '',
    confirm: '',
  });
  const [pwSaving, setPwSaving] = useState(false);

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
        skills: editForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
        projectInterests: editForm.projectInterests,
        goals: editForm.goals,
        portfolio: editForm.portfolio,
        walletType: editForm.walletType,
        walletAddress: editForm.walletAddress,
      });
      setProfile(data.profile);
      setEditing(false);
      setEditForm(null);
      addToast(data.message || 'Builder profile updated.');
    } catch (err) {
      addToast(err.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    const q = pw.securityQuestion.trim().toUpperCase();
    const a = pw.securityAnswer.trim().toUpperCase();
    if (q.length < 5 || a.length < 3) {
      addToast('Enter your security question and answer in CAPITAL LETTERS.');
      return;
    }
    if (pw.securityQuestion.trim() !== q || pw.securityAnswer.trim() !== a) {
      addToast('Question and answer must be CAPITAL LETTERS only.');
      return;
    }
    if (pw.newPassword.length < 8) {
      addToast('New password must be at least 8 characters.');
      return;
    }
    if (pw.newPassword !== pw.confirm) {
      addToast('New password and confirmation do not match.');
      return;
    }
    setPwSaving(true);
    try {
      const data = await changePassword(q, a, pw.newPassword);
      addToast(data.message || 'Password updated.');
      setPw({ securityQuestion: '', securityAnswer: '', newPassword: '', confirm: '' });
    } catch (err) {
      addToast(err.message || 'Could not change password.');
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    addToast('Successfully signed out.');
    navigate('/');
  };

  const c = metrics?.counts;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-heading text-3xl font-bold mb-10">Settings</h1>

        <div className="space-y-6">
          <div className="p-8" style={{ ...GLASS, ...CARD_RADIUS }}>
            <h2 className="font-heading font-semibold mb-4">Account</h2>
            <div className="space-y-3 text-sm">
              <Row label="Email" value={user?.email} />
              <Row label="Name" value={user?.name} />
              <Row label="Auth provider" value={user?.authProvider} />
              <Row label="Profile complete" value={user?.isProfileComplete ? 'Yes' : 'No'} />
            </div>
          </div>

          <div className="p-8" style={{ ...GLASS, ...CARD_RADIUS }}>
            <h2 className="font-heading font-semibold mb-2">Your activity</h2>
            <p className="text-dark-ash text-xs mb-5">
              Built from your projects and workspace actions — not estimates.
            </p>
            {loading ? (
              <p className="text-dark-ash text-sm">Loading…</p>
            ) : metrics ? (
              <>
                <p className="text-charcoal text-sm leading-relaxed mb-6">{metrics.summary}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
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
              </>
            ) : (
              <p className="text-dark-ash text-sm">Activity metrics will appear as you use the workspace.</p>
            )}
          </div>

          {/* Builder profile — view / edit */}
          <div className="p-8" style={{ ...GLASS, ...CARD_RADIUS }}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-heading font-semibold">Builder Profile</h2>
                <p className="text-xs text-dark-ash mt-1">
                  Username, email, and country stay fixed. Edit interests and links to improve opportunity matching.
                </p>
              </div>
              {!editing && profile && (
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-full border border-ash/30 text-sm hover:bg-black/5 transition"
                  aria-label="Edit builder profile"
                >
                  <Pencil size={14} />
                  Edit
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
                <Row label="Country" value={profile.country} />
                <Row label="Occupation" value={profile.occupation} />
                <Row label="Stacks experience" value={profile.stacksExperience} />
                <Row label="Skills" value={(profile.skills || []).join(', ')} />
                <Row label="Project interests" value={(profile.projectInterests || []).join(', ')} />
                <Row label="Goals" value={(profile.goals || []).join(', ')} />
                <Row label="GitHub" value={profile.portfolio?.github} />
                <Row label="Website" value={profile.portfolio?.website} />
                <Row label="X Profile" value={profile.portfolio?.xProfile} />
                <Row label="Wallet type" value={profile.walletType} />
                <Row label="Wallet address" value={profile.walletAddress} />
              </div>
            ) : (
              <div className="space-y-5 text-sm">
                <div className="space-y-2 text-dark-ash">
                  <Row label="Username" value={profile.username} />
                  <Row label="Country" value={profile.country} />
                </div>

                <div>
                  <label className="block text-dark-ash mb-2">Occupation</label>
                  <select
                    value={editForm.occupation}
                    onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none"
                  >
                    {OCCUPATIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-dark-ash mb-2">Stacks experience</label>
                  <select
                    value={editForm.stacksExperience}
                    onChange={(e) => setEditForm({ ...editForm, stacksExperience: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none"
                  >
                    {EXPERIENCE.map((x) => (
                      <option key={x} value={x}>{x}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-dark-ash mb-2">Skills (comma-separated)</label>
                  <input
                    value={editForm.skills}
                    onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-dark-ash mb-2">Project interests</label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => toggleArr('projectInterests', g)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition ${
                          editForm.projectInterests.includes(g)
                            ? 'bg-black text-white border-black'
                            : 'border-ash/30 text-charcoal'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-dark-ash mb-2">Goals</label>
                  <div className="flex flex-wrap gap-2">
                    {GOALS.map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => toggleArr('goals', g)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition ${
                          editForm.goals.includes(g)
                            ? 'bg-black text-white border-black'
                            : 'border-ash/30 text-charcoal'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-dark-ash mb-2">GitHub</label>
                    <input
                      value={editForm.portfolio.github}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          portfolio: { ...editForm.portfolio, github: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-page/40 border border-ash/30 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-dark-ash mb-2">Website</label>
                    <input
                      value={editForm.portfolio.website}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          portfolio: { ...editForm.portfolio, website: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-page/40 border border-ash/30 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-dark-ash mb-2">X Profile</label>
                    <input
                      value={editForm.portfolio.xProfile}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          portfolio: { ...editForm.portfolio, xProfile: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-page/40 border border-ash/30 outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-dark-ash mb-2">Wallet type</label>
                    <select
                      value={editForm.walletType}
                      onChange={(e) => setEditForm({ ...editForm, walletType: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-page/40 border border-ash/30 outline-none"
                    >
                      <option value="">—</option>
                      <option value="stacks">Stacks</option>
                      <option value="ethereum">Ethereum</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-dark-ash mb-2">Wallet address</label>
                    <input
                      value={editForm.walletAddress}
                      onChange={(e) => setEditForm({ ...editForm, walletAddress: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-page/40 border border-ash/30 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-charcoal transition disabled:opacity-60"
                  >
                    <Save size={14} />
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-ash/30 text-sm hover:bg-black/5 transition"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Password change */}
          <div className="p-8" style={{ ...GLASS, ...CARD_RADIUS }}>
            <div className="flex items-center gap-2 mb-2">
              <KeyRound size={18} className="text-charcoal" />
              <h2 className="font-heading font-semibold">Change password</h2>
            </div>
            <p className="text-xs text-dark-ash leading-relaxed mb-5">
              Enter the recovery question and answer you saved at onboarding — both in{' '}
              <span className="font-semibold text-charcoal">CAPITAL LETTERS</span> — then choose a new
              password (min. 8 characters).
            </p>
            <form onSubmit={handlePassword} className="space-y-4">
              <div>
                <label className="block text-sm text-dark-ash mb-2">Security question</label>
                <input
                  value={pw.securityQuestion}
                  onChange={(e) => setPw({ ...pw, securityQuestion: e.target.value.toUpperCase() })}
                  placeholder="YOUR QUESTION IN CAPITALS"
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none uppercase tracking-wide"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-ash mb-2">Security answer</label>
                <input
                  value={pw.securityAnswer}
                  onChange={(e) => setPw({ ...pw, securityAnswer: e.target.value.toUpperCase() })}
                  placeholder="YOUR ANSWER IN CAPITALS"
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none uppercase tracking-wide"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-ash mb-2">New password</label>
                <input
                  type="password"
                  value={pw.newPassword}
                  onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-ash mb-2">Confirm new password</label>
                <input
                  type="password"
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none"
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                disabled={pwSaving}
                className="px-6 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-charcoal transition disabled:opacity-60"
              >
                {pwSaving ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>

          <div className="p-8" style={{ ...GLASS, ...CARD_RADIUS }}>
            <h2 className="font-heading font-semibold mb-4">Session</h2>
            <p className="text-charcoal text-sm mb-6">
              Your session is sliding and will remain active with regular use. Explicit sign-out ends
              it immediately.
            </p>
            <button
              onClick={handleLogout}
              className="px-6 py-3 rounded-full border border-ash/30 text-sm font-medium hover:bg-black/5 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
