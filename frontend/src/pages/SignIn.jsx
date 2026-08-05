import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GLASS, CARD_RADIUS } from '../theme';
import OrbitalBackground from '../components/OrbitalBackground';
import Logo from '../components/Logo';
import BackButton from '../components/BackButton';
import { apiUrl } from '../api/http';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      addToast('Welcome back.');
      if (!user.isProfileComplete) navigate('/onboarding');
      else navigate('/dashboard');
    } catch (err) {
      addToast(err.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-5 bg-page overflow-hidden">
      <OrbitalBackground intensity={1} />
      <div className="absolute top-6 left-6 z-10">
        <BackButton />
      </div>
      <div className="relative z-10 w-full max-w-md p-10" style={{ ...GLASS, ...CARD_RADIUS }}>
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo size={40} showText={false} />
          </div>
          <h1 className="font-heading text-2xl font-bold mb-2">Sign in</h1>
          <p className="text-dark-ash text-sm">Continue to your ALTIQ AI workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-dark-ash mb-2">Email</label>
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
            <label className="block text-sm text-dark-ash mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-page/40 border border-ash/30 text-black placeholder-ash focus:outline-none focus:border-ash/60 transition"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-black text-white font-semibold hover:bg-charcoal transition disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a
            href={apiUrl("/api/auth/google")}
            className="inline-flex items-center justify-center w-full py-3.5 rounded-full border border-ash/30 text-sm font-medium hover:bg-black/5 transition"
          >
            Continue with Google
          </a>
        </div>

        <p className="mt-8 text-center text-sm text-dark-ash">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-black hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
