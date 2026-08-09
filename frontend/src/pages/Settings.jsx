import React, { useState } from 'react';
import { KeyRound, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AppShell from '../components/AppShell';
import { changePassword } from '../api/authApi';
import { GLASS, CARD_RADIUS } from '../theme';
import XLogo from '../components/XLogo';

const NOTIF_KEYS = {
  activity: 'altiq_pref_activity',
  sync: 'altiq_pref_sync',
};

function loadPref(key, fallback = true) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === '1';
  } catch {
    return fallback;
  }
}

function savePref(key, value) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function Toggle({ on, onChange, label, hint }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm text-black font-medium">{label}</p>
        {hint && <p className="text-xs text-dark-ash mt-1 leading-relaxed">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition ${
          on ? 'bg-black' : 'bg-ash/40'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition ${
            on ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [pw, setPw] = useState({
    securityQuestion: '',
    securityAnswer: '',
    newPassword: '',
    confirm: '',
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [activityOn, setActivityOn] = useState(() => loadPref(NOTIF_KEYS.activity, true));
  const [syncOn, setSyncOn] = useState(() => loadPref(NOTIF_KEYS.sync, true));

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword.length < 8) {
      addToast('Password must be at least 8 characters.');
      return;
    }
    if (pw.newPassword !== pw.confirm) {
      addToast('Passwords do not match.');
      return;
    }
    if (!pw.securityQuestion.trim() || !pw.securityAnswer.trim()) {
      addToast('Security question and answer are required.');
      return;
    }
    setPwSaving(true);
    try {
      await changePassword({
        securityQuestion: pw.securityQuestion.trim().toUpperCase(),
        securityAnswer: pw.securityAnswer.trim().toUpperCase(),
        newPassword: pw.newPassword,
      });
      addToast('Password updated.');
      setPw({ securityQuestion: '', securityAnswer: '', newPassword: '', confirm: '' });
    } catch (err) {
      addToast(err.message || 'Could not update password.');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-5 py-8 lg:py-12 space-y-8">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-dark-ash text-sm mt-2">
            Account security, preferences, and how to reach the ALTIQ team.
          </p>
        </div>

        {/* 1. Security */}
        <section className="p-7 sm:p-8" style={{ ...GLASS, ...CARD_RADIUS }}>
          <div className="flex items-center gap-2 mb-2">
            <KeyRound size={16} className="text-charcoal" />
            <h2 className="font-heading font-semibold">Security</h2>
          </div>
          <p className="text-xs text-dark-ash mb-6 leading-relaxed">
            Confirm ownership with the security question you set at registration (capital letters),
            then choose a new password.
          </p>
          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-dark-ash mb-2">Security question</label>
              <input
                value={pw.securityQuestion}
                onChange={(e) => setPw({ ...pw, securityQuestion: e.target.value.toUpperCase() })}
                placeholder="YOUR QUESTION IN CAPITALS"
                className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none uppercase tracking-wide text-sm"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-ash mb-2">Security answer</label>
              <input
                value={pw.securityAnswer}
                onChange={(e) => setPw({ ...pw, securityAnswer: e.target.value.toUpperCase() })}
                placeholder="YOUR ANSWER IN CAPITALS"
                className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 outline-none uppercase tracking-wide text-sm"
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
        </section>

        {/* 2. Notifications */}
        <section className="p-7 sm:p-8" style={{ ...GLASS, ...CARD_RADIUS }}>
          <h2 className="font-heading font-semibold mb-1">Notifications</h2>
          <p className="text-xs text-dark-ash mb-4">In-app preferences only. No email alerts for now.</p>
          <div className="divide-y divide-ash/20">
            <Toggle
              on={activityOn}
              onChange={(v) => {
                setActivityOn(v);
                savePref(NOTIF_KEYS.activity, v);
                addToast(v ? 'Activity alerts on.' : 'Activity alerts off.');
              }}
              label="Activity in the app"
              hint="Show new items in the activity drawer (bell)."
            />
            <Toggle
              on={syncOn}
              onChange={(v) => {
                setSyncOn(v);
                savePref(NOTIF_KEYS.sync, v);
                addToast(v ? 'Sync reminders on.' : 'Sync reminders off.');
              }}
              label="Opportunity sync reminders"
              hint="Remind you when a sync finishes and a refresh may help."
            />
          </div>
        </section>

        {/* 3. Session */}
        <section className="p-7 sm:p-8" style={{ ...GLASS, ...CARD_RADIUS }}>
          <h2 className="font-heading font-semibold mb-2">Session</h2>
          <p className="text-sm text-charcoal leading-relaxed mb-1">
            Signed in as <span className="text-black font-medium">{user?.email}</span>
          </p>
          <p className="text-xs text-dark-ash mb-6 leading-relaxed">
            Your session stays active with regular use. Use Sign out from the menu or top bar when
            you want to end it — you’ll get a confirmation first.
          </p>
          <p className="text-xs text-dark-ash">
            Tip: open the menu (or top bar on desktop) and choose <strong>Sign out</strong>.
          </p>
        </section>

        {/* Single branded rule before Contact */}
        <div className="py-2" aria-hidden>
          <div className="h-px bg-black/90 max-w-[4rem]" />
          <div className="h-px bg-ash/40 mt-1" />
        </div>

        {/* 4. Contact */}
        <section className="p-7 sm:p-8" style={{ ...GLASS, ...CARD_RADIUS }}>
          <h2 className="font-heading font-semibold mb-2">Suggestions &amp; reports</h2>
          <p className="text-sm text-charcoal leading-relaxed mb-6">
            Your feedback helps us improve ALTIQ AI for every builder. We read every message with
            care — thank you for taking the time.
          </p>

          <div className="space-y-5">
            <a
              href="https://x.com/Altiq_AI"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 p-4 rounded-2xl border border-ash/25 hover:bg-black/[0.03] transition group"
            >
              <span className="shrink-0 w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
                <XLogo size={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-black group-hover:underline">
                  Message us on X
                </span>
                <span className="block text-xs text-dark-ash mt-1 leading-relaxed">
                  Best for quick suggestions, product ideas, or usage notes. Open @Altiq_AI and send
                  a direct message.
                </span>
              </span>
            </a>

            <a
              href="mailto:altiqai.dev@gmail.com?subject=ALTIQ%20AI%20feedback"
              className="flex items-start gap-4 p-4 rounded-2xl border border-ash/25 hover:bg-black/[0.03] transition group"
            >
              <span className="shrink-0 w-10 h-10 rounded-xl border border-ash/30 text-charcoal flex items-center justify-center bg-white/50">
                <Mail size={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-black group-hover:underline">
                  Email the team
                </span>
                <span className="block text-xs text-dark-ash mt-1 leading-relaxed">
                  Prefer email? Write to{' '}
                  <span className="text-charcoal">altiqai.dev@gmail.com</span> with suggestions or
                  usage reports.
                </span>
              </span>
            </a>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
