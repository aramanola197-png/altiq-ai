import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/Glass';
import AppShell from '../components/AppShell';

export default function Dashboard() {
  const { user } = useAuth();

  const cards = [
    { title: 'Projects', desc: 'Create and manage isolated project workspaces.', path: '/projects', status: 'Available' },
    { title: 'Opportunities', desc: 'Official grants and bounties from Zero Authority DAO and Stacks.', path: '/opportunities', status: 'Available' },
    { title: 'Settings', desc: 'Account and session preferences.', path: '/settings', status: 'Available' },
  ];

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-5 py-10">
        <div className="mb-12">
          <h1 className="font-heading text-3xl font-bold mb-2 text-black">
            Welcome{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-ash">Your builder workspace is ready. Open a project to research, brand, document, and prepare submissions.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link
              key={card.title}
              to={card.path}
              className="block transition-transform duration-300 hover:-translate-y-1"
            >
              <GlassCard className="p-7 h-full">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-heading font-semibold text-lg text-black">{card.title}</h3>
                  <span className="text-xs text-ash">{card.status}</span>
                </div>
                <p className="text-charcoal text-sm leading-relaxed">{card.desc}</p>
              </GlassCard>
            </Link>
          ))}
        </div>

        <GlassCard className="mt-14 p-8">
          <h2 className="font-heading font-semibold text-lg mb-3 text-black">How to use ALTIQ AI</h2>
          <p className="text-charcoal text-sm leading-relaxed">
            Create a project, then use the workspace tabs for AI conversation, research, brand guidance, documentation, submission preparation, and the activity timeline. Opportunity matching uses official Zero Authority DAO and Stacks data only.
          </p>
        </GlassCard>
      </div>
    </AppShell>
  );
}
