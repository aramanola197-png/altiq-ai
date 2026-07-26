import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { GLASS, CARD_RADIUS } from '../theme';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-heading text-3xl font-bold mb-10">Settings</h1>

        <div className="space-y-6">
          <div className="p-8" style={{ ...GLASS, ...CARD_RADIUS }}>
            <h2 className="font-heading font-semibold mb-4">Account</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-ash">Email</span>
                <span>{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-ash">Name</span>
                <span>{user?.name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-ash">Auth provider</span>
                <span className="capitalize">{user?.authProvider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-ash">Profile complete</span>
                <span>{user?.isProfileComplete ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          <div className="p-8" style={{ ...GLASS, ...CARD_RADIUS }}>
            <h2 className="font-heading font-semibold mb-4">Session</h2>
            <p className="text-charcoal text-sm mb-6">Your session is sliding and will remain active with regular use. Explicit sign-out ends it immediately.</p>
            <button onClick={handleLogout} className="px-6 py-3 rounded-full border border-ash/30 text-sm font-medium hover:bg-black/5 transition">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
