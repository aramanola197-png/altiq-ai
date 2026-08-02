import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Settings, LayoutDashboard, FolderKanban, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { glassStyle } from '../design/glass';
import OrbitalBackground from './OrbitalBackground';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Opportunities', path: '/opportunities', icon: Target },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const SidebarContent = ({ compact = false }) => (
    <>
      {!compact && (
        <div className="flex items-center gap-3 px-5 mb-10">
          <div className="w-8 h-8 rounded-full border border-ash/40 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-black/70" />
          </div>
          <span className="font-heading font-bold text-black">ALTIQ AI</span>
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
        <span className="font-heading font-bold">ALTIQ AI</span>
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

      <main className="flex-1 pt-16 lg:pt-0 overflow-x-hidden relative z-10">
        {children}
      </main>
    </div>
  );
}
