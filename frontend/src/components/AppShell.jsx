import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Settings, LayoutDashboard, FolderKanban, Target, Twitter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { glassStyle } from '../design/glass';
import OrbitalBackground from './OrbitalBackground';
import Logo from './Logo';
import BackButton from './BackButton';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Opportunities', path: '/opportunities', icon: Target },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    addToast('Successfully signed out.');
    navigate('/');
  };

  const SidebarContent = ({ compact = false }) => (
    <>
      {!compact && (
        <div className="px-5 mb-10">
          <Logo size={30} textClassName="text-black" />
        </div>
      )}

      <nav className={`flex-1 space-y-1 ${compact ? '' : 'px-3'}`}>
        {navItems.map((item) => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
                active ? 'bg-black/5 text-black font-medium' : 'text-charcoal hover:bg-black/5 hover:text-black'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className={`${compact ? 'px-4 mt-2 pt-3' : 'px-5 mt-6 pt-6'} border-t border-ash/30`}>
        <p className="text-xs text-dark-ash mb-3 truncate">{user?.email}</p>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-charcoal hover:text-black transition">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-page text-black flex relative">
      <OrbitalBackground intensity={1} />
      <aside className="hidden lg:flex flex-col w-64 border-r border-ash/25 py-8 sticky top-0 h-screen z-10" style={{ backgroundColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)' }}>
        <SidebarContent />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center justify-between border-b border-ash/25" style={glassStyle}>
        <Logo size={26} textClassName="text-base" />
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div
            className="absolute top-16 left-3 right-3 max-h-[32vh] overflow-y-auto p-3 flex flex-col z-10"
            style={{ ...glassStyle, borderRadius: '20px' }}
          >
            <SidebarContent compact />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pt-16 lg:pt-0 overflow-x-hidden relative z-10">
          {location.pathname !== '/dashboard' && (
            <div className="px-4 sm:px-8 pt-6">
              <BackButton />
            </div>
          )}
          {children}
        </main>

        {/* Footer — same dark band as the landing page, now present on every
            authenticated page too, not just the public site. */}
        <footer className="relative z-10 py-10 px-5" style={{ backgroundColor: '#1C1C1C' }}>
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <Logo size={24} textClassName="text-white text-sm" variant="light" />
            <div className="flex gap-8 text-sm text-white/70">
              <a
                href="https://x.com/Altiq_AI"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ALTIQ AI on X (Twitter)"
                className="hover:text-white transition-colors"
              >
                <Twitter size={17} />
              </a>
            </div>
            <p className="text-xs text-white/60">© 2026 ALTIQ AI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
