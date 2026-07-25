import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/Glass';
import AppShell from '../components/AppShell';

export default function Dashboard() {
  const { user } = useAuth();

  const cards = [
    {
      title: 'Projects',
      desc: 'Create isolated workspaces where every project has its own AI memory, documents, branding, research, and submission history.',
      path: '/projects',
      status: 'Available',
    },
    {
      title: 'Opportunities',
      desc: 'Discover grants, bounties, and ecosystem programs sourced exclusively from Zero Authority DAO and official Stacks APIs.',
      path: '/opportunities',
      status: 'Available',
    },
    {
      title: 'Settings',
      desc: 'Manage your account, connected services, authentication, and workspace preferences.',
      path: '/settings',
      status: 'Available',
    },
  ];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-5 py-10">

        {/* Welcome */}
        <div className="mb-14">
          <h1 className="font-heading text-4xl font-bold text-black mb-3">
            Welcome{user?.name ? , ${user.name} : ''}
          </h1>

          <p className="text-charcoal text-lg leading-relaxed max-w-3xl">
            ALTIQ AI is your Builder Operating System for the Stacks ecosystem
            and Zero Authority DAO. Every project is isolated, every AI
            conversation remains project-aware, and every workflow is designed
            to help you move from an idea to a polished submission with clarity
            and confidence.
          </p>
        </div>

        {/* Workspace Modules */}
        <div className="mb-14">
          <h2 className="font-heading text-2xl font-semibold text-black mb-6">
            Workspace
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <Link
                key={card.title}
                to={card.path}
                className="block transition duration-300 hover:-translate-y-1"
              >
                <GlassCard className="p-7 h-full">

                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-heading text-xl font-semibold text-black">
                      {card.title}
                    </h3>

                    <span className="text-xs px-3 py-1 rounded-full bg-black text-white">
                      {card.status}
                    </span>
                  </div>

                  <p className="text-charcoal leading-relaxed">
                    {card.desc}
                  </p>

                </GlassCard>
              </Link>
            ))}
          </div>
        </div>

        {/* Workflow */}
        <GlassCard className="p-8 mb-10">

          <h2 className="font-heading text-2xl font-semibold text-black mb-5">
            Recommended workflow
          </h2>

          <div className="grid md:grid-cols-3 gap-6">

            <div>
              <h3 className="font-heading font-semibold mb-2 text-black">
                1. Create a Project
              </h3>

              <p className="text-charcoal text-sm leading-relaxed">
                Every workspace is isolated so AI conversations, branding,
                documentation, research, and opportunities remain connected to
                the correct project.
              </p>
            </div>

            <div>
              <h3 className="font-heading font-semibold mb-2 text-black">
                2. Build with AI
              </h3>

              <p className="text-charcoal text-sm leading-relaxed">
                Use the AI Workspace to research ideas, generate professional
                documentation, refine branding, and prepare submission
                materials.
              </p>
            </div>
            <div>
              <h3 className="font-heading font-semibold mb-2 text-black">
                3. Discover Funding
              </h3>

              <p className="text-charcoal text-sm leading-relaxed">
                Browse official grants and bounties, understand why each
                opportunity matches your project, then prepare stronger
                submissions before applying.
              </p>
            </div>

          </div>

        </GlassCard>

        {/* About */}
        <GlassCard className="p-8">

          <h2 className="font-heading text-2xl font-semibold text-black mb-4">
            About ALTIQ AI
          </h2>

          <p className="text-charcoal leading-relaxed mb-5">
            ALTIQ AI combines research, branding, documentation, AI assistance,
            and opportunity discovery into a single operating system for
            founders building within the Stacks ecosystem. Rather than jumping
            between disconnected tools, every module shares the same project
            context to create a seamless building experience.
          </p>

          <div className="space-y-2 text-sm text-charcoal">

            <p>• Project-scoped AI conversations with persistent memory.</p>

            <p>• Research and documentation powered by the Gemini API.</p>

            <p>• Opportunity discovery using official Zero Authority DAO and Stacks APIs only.</p>

            <p>• Professional exports for documentation and generated content.</p>

            <p>• Secure authentication with protected workspaces and isolated project data.</p>

          </div>

        </GlassCard>

      </div>
    </AppShell>
  );
}