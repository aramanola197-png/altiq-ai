import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  LogOut,
  Settings,
  LayoutDashboard,
  FolderKanban,
  Target,
  Bell,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { glassStyle } from '../design/glass';
import OrbitalBackground from './OrbitalBackground';
import Logo from './Logo';
import BackButton from './BackButton';
import XLogo from './XLogo';
import { ALTIQ_VERSION, ALTIQ_VERSION_NOTE } from '../lib/version';
import { getMyActivity } from '../api/activityApi';

/**
 * Desktop chrome ONLY in landscape (phone sideways, tablet landscape, real monitors).
 * Portrait + "Desktop site" stays mobile — never force sidebar in portrait.
 */
function useDesktopChrome() {
  const [desktop, setDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > window.innerHeight && window.innerWidth >= 568;
  });

  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const landscape = w > h;
      setDesktop(landscape && w >= 568);
    };
    apply();
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    const poll = setInterval(apply, 400);
    const stop = setTimeout(() => clearInterval(poll), 2500);
    return () => {
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
      clearInterval(poll);
      clearTimeout(stop);
    };
  }, []);
  return desktop;
}


const mainNav = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Opportunities', path: '/opportunities', icon: Target },
  { label: 'Settings', path: '/settings', icon: Settings },
];

const ACTIVITY_SEEN_KEY = 'altiq_activity_seen_at';

function formatActivityTime(at) {
  if (!at) return '';
  const d = new Date(at);
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const isDesktop = useDesktopChrome();
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const refreshUnread = useCallback(async () => {
    try {
      const data = await getMyActivity();
      const list = data.activities || [];
      setActivities(list);
      const seenRaw = localStorage.getItem(ACTIVITY_SEEN_KEY);
      const seenAt = seenRaw ? new Date(seenRaw).getTime() : 0;
      setHasUnread(list.some((a) => a.at && new Date(a.at).getTime() > seenAt));
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    refreshUnread();
    const t = setInterval(refreshUnread, 60000);
    return () => clearInterval(t);
  }, [refreshUnread]);

  useEffect(() => {
    setMobileOpen(false);
    setActivityOpen(false);
  }, [location.pathname]);

  const openActivity = async () => {
    setActivityOpen(true);
    setMobileOpen(false);
    setActivityLoading(true);
    try {
      const data = await getMyActivity();
      const list = data.activities || [];
      setActivities(list);
      localStorage.setItem(ACTIVITY_SEEN_KEY, new Date().toISOString());
      setHasUnread(false);
    } catch {
      setActivities([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const requestLogout = () => {
    setMobileOpen(false);
    setActivityOpen(false);
    setLogoutOpen(true);
  };

  const confirmLogout = async () => {
    setLogoutOpen(false);
    await logout();
    addToast('Successfully signed out.');
    navigate('/');
  };

  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();
  const profileActive = location.pathname === '/profile';

  const NavLinkItem = ({ item, onClick }) => {
    const active =
      location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    const Icon = item.icon;
    return (
      <Link
        to={item.path}
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
          active
            ? 'bg-black/5 text-black font-medium'
            : 'text-charcoal hover:bg-black/5 hover:text-black'
        }`}
      >
        <Icon size={18} />
        {item.label}
      </Link>
    );
  };

  const SidebarContent = ({ compact = false }) => (
    <>
      {!compact && (
        <div className="px-5 mb-8">
          <Logo size={30} textClassName="text-black" />
        </div>
      )}

      <nav className={`flex-1 ${compact ? '' : 'px-3'}`}>
        {/* Profile first */}
        <Link
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
            profileActive
              ? 'bg-black/5 text-black font-medium'
              : 'text-charcoal hover:bg-black/5 hover:text-black'
          }`}
        >
          <User size={18} />
          Profile
        </Link>

        <div className="my-3 mx-4 border-t border-ash/30" />

        <div className="space-y-1">
          {mainNav.map((item) => (
            <NavLinkItem key={item.path} item={item} onClick={() => setMobileOpen(false)} />
          ))}
        </div>

        <div className="my-3 mx-4 border-t border-ash/30" />

        <button
          type="button"
          onClick={requestLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-charcoal hover:bg-black/5 hover:text-black transition"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </nav>

      {!compact && (
        <div className="px-5 mt-4 pt-4 border-t border-ash/30">
          <p className="text-xs text-dark-ash truncate">{user?.email}</p>
        </div>
      )}
    </>
  );

  const iconBtn =
    'relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-black/5 transition text-charcoal';

  return (
    <div className="h-screen max-h-screen bg-page text-black flex relative overflow-hidden">
      <OrbitalBackground intensity={1} />

      <aside
        className={`${isDesktop ? 'flex' : 'hidden'} flex-col w-64 border-r border-ash/25 py-8 h-full max-h-screen overflow-y-auto overflow-x-hidden shrink-0 z-10`}
        style={{ backgroundColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className={`${isDesktop ? 'hidden' : 'block'} fixed top-0 left-0 right-0 z-40 px-3 pt-3 pb-2`}>
        <div
          className="flex items-center justify-between px-3 py-2 border border-ash/20"
          style={{ ...glassStyle, borderRadius: '18px' }}
        >
          <Logo size={26} textClassName="text-base" />
          <div className="flex items-center gap-0.5">
            <button type="button" onClick={openActivity} aria-label="Activity" className={iconBtn}>
              <Bell size={20} strokeWidth={2} />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-black ring-2 ring-white" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setActivityOpen(false);
                setMobileOpen(true);
              }}
              aria-label="Open menu"
              className={iconBtn}
            >
              <Menu size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop utility bar — Profile · Bell · Sign out */}
      <div className={`${isDesktop ? 'block' : 'hidden'} fixed top-4 right-5 z-40`}>
        <div
          className="flex items-center gap-0.5 px-1.5 py-1.5 border border-ash/20 shadow-sm"
          style={{ ...glassStyle, borderRadius: '16px' }}
        >
          <Link
            to="/profile"
            aria-label="Profile"
            title="Profile"
            className={`${iconBtn} ${profileActive ? 'bg-black/5' : ''}`}
          >
            <span className="w-7 h-7 rounded-full bg-black text-white text-xs font-heading font-semibold flex items-center justify-center">
              {initial}
            </span>
          </Link>
          <button type="button" onClick={openActivity} aria-label="Activity" className={iconBtn}>
            <Bell size={18} strokeWidth={2} />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-black ring-2 ring-white" />
            )}
          </button>
          <button type="button" onClick={requestLogout} aria-label="Sign out" className={iconBtn}>
            <LogOut size={18} strokeWidth={2} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className={`${isDesktop ? 'hidden' : ''} fixed inset-0 z-50`}>
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="absolute top-20 left-3 right-3 max-h-[55vh] overflow-y-auto p-3 flex flex-col z-10"
            style={{ ...glassStyle, borderRadius: '20px' }}
          >
            <SidebarContent compact />
          </div>
        </div>
      )}

      {activityOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setActivityOpen(false)}
          />
          <div
            className="absolute top-20 right-3 left-3 sm:left-auto sm:w-[360px] max-h-[min(70vh,520px)] overflow-y-auto p-4 z-10 flex flex-col"
            style={{ ...glassStyle, borderRadius: '20px' }}
          >
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="font-heading font-semibold text-black text-sm">Activity</h2>
              <button
                type="button"
                onClick={() => setActivityOpen(false)}
                className="text-xs text-dark-ash hover:text-black"
              >
                Close
              </button>
            </div>
            {activityLoading ? (
              <p className="text-sm text-dark-ash px-1 py-6 text-center">Loading…</p>
            ) : activities.length === 0 ? (
              <p className="text-sm text-charcoal leading-relaxed px-1 py-4">
                No activity yet. Open a project and use AI, Research, or Brand — your recent actions
                will appear here.
              </p>
            ) : (
              <ul className="space-y-1">
                {activities.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActivityOpen(false);
                        navigate(a.href);
                      }}
                      className="w-full text-left px-3 py-3 rounded-xl hover:bg-black/5 transition"
                    >
                      <p className="text-sm text-black font-medium leading-snug line-clamp-2">
                        {a.details}
                      </p>
                      <p className="text-[11px] text-dark-ash mt-1 flex flex-wrap gap-x-2">
                        <span>{a.projectName}</span>
                        <span>·</span>
                        <span>{formatActivityTime(a.at)}</span>
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {logoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-5">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setLogoutOpen(false)}
          />
          <div
            className="relative z-10 w-full max-w-sm p-7 shadow-xl"
            style={{ ...glassStyle, borderRadius: '22px' }}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="font-heading text-lg font-semibold text-black mb-2">Sign out?</h2>
            <p className="text-sm text-charcoal leading-relaxed mb-7">
              You will need to sign in again to access your projects and workspace. Your work is
              saved.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                className="px-5 py-2.5 rounded-full border border-ash/30 text-sm font-medium hover:bg-black/5 transition"
              >
                Stay signed in
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-charcoal transition"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/*
          Footer lives INSIDE the scrollable main so it is part of page flow:
          - short pages: flex min-h-full + mt-auto parks it at the bottom of the viewport
          - long pages: it sits after content; scroll down to reach it
          It is never a fixed/pinned bar mid-screen.
        */}
        <main
          className={`flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-auto relative z-10 ${
            isDesktop ? 'pt-0' : 'pt-[4.75rem]'
          }`}
        >
          <div className="min-h-full flex flex-col">
            {location.pathname.startsWith('/projects') && (
              <div className="px-4 sm:px-8 pt-6">
                <BackButton />
              </div>
            )}
            <div className="flex-1">{children}</div>

            {(location.pathname === '/settings' ||
              location.pathname === '/profile' ||
              location.pathname === '/dashboard' ||
              location.pathname === '/opportunities') && (
              <footer className="mt-auto relative z-10 py-7 px-5" style={{ backgroundColor: '#1C1C1C' }}>
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-5">
                  <Logo size={24} textClassName="text-white text-sm" variant="light" />
                  <div className="flex gap-8 text-sm text-white/70">
                    <a
                      href="https://x.com/Altiq_AI"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="ALTIQ AI on X"
                      className="hover:text-white transition-colors"
                    >
                      <XLogo size={17} />
                    </a>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-xs text-white/60">© 2026 ALTIQ AI. All rights reserved.</p>
                    <p className="text-[11px] text-white/45 mt-1">
                      v{ALTIQ_VERSION} · {ALTIQ_VERSION_NOTE}
                    </p>
                  </div>
                </div>
              </footer>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
