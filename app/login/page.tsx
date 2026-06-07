'use client';

import { useState, useEffect } from 'react';

export default function LoginPage() {
  const [readers, setReaders] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/readers')
      .then(r => r.json())
      .then(data => setReaders(data.map((r: { name: string }) => r.name)))
      .catch(() => setReaders([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !pin) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, pin }),
    });
    if (res.ok) {
      window.location.href = '/dashboard';
    } else {
      const data = await res.json();
      setError(data.error ?? 'Wrong name or PIN.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-emerald-900">Welcome back!</h1>
          <p className="text-gray-500 mt-1">Pick your name and enter your PIN</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-5 border border-gray-100">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Who are you?</label>
            <select
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              required
            >
              <option value="">Select your name...</option>
              {readers.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter your PIN"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <p className="text-xs text-gray-400 text-center">
            Forgot your PIN? Ask Jojo to reset it for you.
          </p>

          <button
            type="submit"
            disabled={loading || !name || !pin}
            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-center">
          <p className="text-sm font-bold text-amber-900">New here? 👋</p>
          <p className="text-sm text-amber-800 mt-1">
            Ask Jojo for an invite code, then{' '}
            <a href="/join" className="font-bold text-emerald-700 hover:underline">
              click here to join
            </a>
            !
          </p>
        </div>
      </div>
    </div>
  );
}
