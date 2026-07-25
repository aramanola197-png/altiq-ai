import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GLASS, CARD_RADIUS } from '../theme';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      addToast('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
      addToast('Account created. Please complete your profile.');
      navigate('/onboarding');
    } catch (err) {
      addToast(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-page">
      <div className="w-full max-w-md p-10" style={{ ...GLASS, ...CARD_RADIUS }}>
        <div className="text-center mb-10">
          <h1 className="font-heading text-2xl font-bold mb-2">Create account</h1>
          <p className="text-ash text-sm">Start building with ALTIQ AI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-ash mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 text-black placeholder-ash focus:outline-none focus:border-ash/60 transition"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm text-ash mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 text-black placeholder-ash focus:outline-none focus:border-ash/60 transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-ash mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 text-black placeholder-ash focus:outline-none focus:border-ash/60 transition"
              placeholder="At least 8 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-black text-white font-semibold hover:bg-charcoal transition disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a
            href="/api/auth/google"
            className="inline-flex items-center justify-center w-full py-3.5 rounded-full border border-ash/30 text-sm font-medium hover:bg-black/5 transition"
          >
            Continue with Google
          </a>
        </div>

        <p className="mt-8 text-center text-sm text-ash">
          Already have an account?{' '}
          <Link to="/signin" className="text-black hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
