import React from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { GLASS, CARD_RADIUS } from '../theme';

export default function ComingSoon({ title = 'Coming soon', description = 'This section is under active development and will be available in a future phase.' }) {
  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <div className="p-12" style={{ ...GLASS, ...CARD_RADIUS }}>
          <h1 className="font-heading text-2xl font-bold mb-4">{title}</h1>
          <p className="text-charcoal text-sm leading-relaxed mb-8">{description}</p>
          <Link to="/dashboard" className="inline-block px-6 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-charcoal transition">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
