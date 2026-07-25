import React from 'react';
import { Link } from 'react-router-dom';
import { GLASS, CARD_RADIUS } from '../theme';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-5">
      <div className="text-center p-12 max-w-md" style={{ ...GLASS, ...CARD_RADIUS }}>
        <h1 className="font-heading text-4xl font-bold mb-4">404</h1>
        <p className="text-charcoal mb-8">The page you are looking for does not exist.</p>
        <Link to="/" className="inline-block px-6 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-charcoal transition">
          Return home
        </Link>
      </div>
    </div>
  );
}
