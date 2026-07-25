import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { saveProfile } from '../api/profileApi';
import { GLASS, CARD_RADIUS } from '../theme';

const INTERESTS = ['AI', 'DeFi', 'Infrastructure', 'Payments', 'Education', 'Identity', 'Analytics', 'Gaming', 'Social', 'Security'];
const GOALS = ['Find Grants', 'Find Bounties', 'Build Product', 'Launch Project'];
const EXPERIENCE = ['none', 'beginner', 'intermediate', 'advanced', 'expert'];

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
    setLoading(true);
    try {
      await saveProfile({
        ...form,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
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
    <div className="min-h-screen bg-page py-16 px-5">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-heading text-3xl font-bold mb-3">Complete your builder profile</h1>
          <p className="text-ash">This information powers personalization and opportunity matching. It cannot be skipped.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 p-10" style={{ ...GLASS, ...CARD_RADIUS }}>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-ash mb-2">Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm text-ash mb-2">Username *</label>
              <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-ash mb-2">Country</label>
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm text-ash mb-2">Occupation</label>
              <input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-ash mb-2">Stacks experience</label>
            <select value={form.stacksExperience} onChange={(e) => setForm({ ...form, stacksExperience: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition">
              {EXPERIENCE.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-ash mb-2">Skills (comma separated)</label>
            <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, Clarity, Product, Design…" className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition" />
          </div>

          <div>
            <label className="block text-sm text-ash mb-3">Project interests</label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <button type="button" key={i} onClick={() => toggleArray('projectInterests', i)} className={`px-4 py-2 rounded-full text-sm border transition ${form.projectInterests.includes(i) ? 'bg-black text-white border-white' : 'border-ash/30 text-charcoal hover:border-white/40'}`}>
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-ash mb-3">Goals</label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button type="button" key={g} onClick={() => toggleArray('goals', g)} className={`px-4 py-2 rounded-full text-sm border transition ${form.goals.includes(g) ? 'bg-black text-white border-white' : 'border-ash/30 text-charcoal hover:border-white/40'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-ash mb-2">GitHub</label>
              <input value={form.portfolio.github} onChange={(e) => setForm({ ...form, portfolio: { ...form.portfolio, github: e.target.value } })} className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm text-ash mb-2">Website</label>
              <input value={form.portfolio.website} onChange={(e) => setForm({ ...form, portfolio: { ...form.portfolio, website: e.target.value } })} className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm text-ash mb-2">X Profile</label>
              <input value={form.portfolio.xProfile} onChange={(e) => setForm({ ...form, portfolio: { ...form.portfolio, xProfile: e.target.value } })} className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-ash mb-2">Wallet address (optional)</label>
            <input value={form.walletAddress} onChange={(e) => setForm({ ...form, walletAddress: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 focus:border-ash/60 outline-none transition" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 rounded-full bg-black text-white font-semibold hover:bg-charcoal transition disabled:opacity-60">
            {loading ? 'Saving…' : 'Complete profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
