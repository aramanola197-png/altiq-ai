import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { getProfile, getMetrics } from '../api/profileApi';
import { GLASS, CARD_RADIUS } from '../theme';

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

  useEffect(() => {
    Promise.all([getProfile().catch(() => ({ profile: null })), getMetrics().catch(() => ({ metrics: null }))])
      .then(([profRes, metRes]) => {
        setProfile(profRes?.profile || null);
        setMetrics(metRes?.metrics || null);
      })
      .finally(() => setLoading(false));
  }, []);

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
                {metrics.recent?.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-ash/20">
                    <p className="text-xs uppercase tracking-wide text-dark-ash mb-3">Recent actions</p>
                    <ul className="space-y-2 text-sm text-charcoal">
                      {metrics.recent.slice(0, 5).map((r, i) => (
                        <li key={i} className="flex justify-between gap-3">
                          <span className="truncate">{r.details || r.action}</span>
                          <span className="text-dark-ash text-xs shrink-0">
                            {r.at ? new Date(r.at).toLocaleDateString() : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-dark-ash text-sm">Activity metrics will appear as you use the workspace.</p>
            )}
          </div>

          <div className="p-8" style={{ ...GLASS, ...CARD_RADIUS }}>
            <h2 className="font-heading font-semibold mb-4">Builder Profile</h2>
            {loading ? (
              <p className="text-dark-ash text-sm">Loading…</p>
            ) : profile ? (
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
                <Row label="Wallet address" value={profile.walletAddress} />
              </div>
            ) : (
              <p className="text-dark-ash text-sm">No builder profile found yet.</p>
            )}
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
