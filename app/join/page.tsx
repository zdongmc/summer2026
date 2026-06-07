'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COLOR_NAMES, READER_COLORS } from '@/lib/colors';

type Step = 'code' | 'register' | 'done';

export default function JoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [checking, setChecking] = useState(false);

  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [color, setColor] = useState('forest');
  const [prize5, setPrize5] = useState('');
  const [prize10, setPrize10] = useState('');
  const [prize15, setPrize15] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setCodeError('');
    const res = await fetch(`/api/join?code=${encodeURIComponent(code.toUpperCase().trim())}`);
    if (res.ok) {
      setStep('register');
    } else {
      const data = await res.json();
      setCodeError(data.error ?? 'Invalid code.');
    }
    setChecking(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code.toUpperCase().trim(),
        name, pin, color,
        prize_5: prize5 || null,
        prize_10: prize10 || null,
        prize_15: prize15 || null,
      }),
    });
    if (res.ok) {
      setStep('done');
      setTimeout(() => { window.location.href = '/dashboard'; }, 1800);
    } else {
      const data = await res.json();
      setSubmitError(data.error ?? 'Something went wrong.');
    }
    setSubmitting(false);
  }

  if (step === 'done') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-2xl font-extrabold text-emerald-900 mb-2">You&rsquo;re in!</h1>
          <p className="text-gray-500">Taking you to the dashboard…</p>
        </div>
      </div>
    );
  }

  if (step === 'code') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">📖</div>
            <h1 className="text-2xl font-extrabold text-emerald-900">Join the Reading Club!</h1>
            <p className="text-gray-500 text-sm mt-1">Enter the access code your parent gave you</p>
          </div>
          <form onSubmit={handleCodeSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-4 border border-gray-100">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Access Code</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. KM3QT9"
                maxLength={10}
                className="w-full border border-gray-200 rounded-lg px-3 py-3 text-center text-lg font-bold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
            </div>
            {codeError && <p className="text-red-600 text-sm text-center">{codeError}</p>}
            <button
              type="submit"
              disabled={checking || !code}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {checking ? 'Checking…' : 'Let me in →'}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-4">
            Already have an account? <a href="/login" className="text-emerald-700 hover:underline">Log in</a>
          </p>
        </div>
      </div>
    );
  }

  // step === 'register'
  return (
    <div className="px-5 py-10 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-2xl font-extrabold text-emerald-900">Set up your account</h1>
        <p className="text-gray-500 text-sm mt-1">This is yours — make it your own!</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-6">
        {/* Name + PIN */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-800">Your info</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Your name (or nickname)</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sofia or Sofi"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Choose a PIN (to log in)</label>
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="4 digits, easy to remember"
              maxLength={8}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />
          </div>
        </div>

        {/* Color */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-3">Pick your color</h2>
          <div className="flex flex-wrap gap-2">
            {COLOR_NAMES.map(c => {
              const selected = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
                  style={{
                    background: selected ? READER_COLORS[c].bg : 'white',
                    borderColor: selected ? READER_COLORS[c].border : '#e5e7eb',
                    color: selected ? READER_COLORS[c].text : '#6b7280',
                  }}
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: READER_COLORS[c].border }} />
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Prize wishes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <h2 className="font-bold text-gray-800">🎁 Prize wishes</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tell us what you&rsquo;d love to earn — your parent will approve these!</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              After 5 books (Level 1), I want…
            </label>
            <input
              type="text"
              value={prize5}
              onChange={e => setPrize5(e.target.value)}
              placeholder="e.g. Madmia socks, a trip to Dairy Queen…"
              maxLength={100}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              After 10 books (Level 2), I want…
            </label>
            <input
              type="text"
              value={prize10}
              onChange={e => setPrize10(e.target.value)}
              placeholder="e.g. A new book, movie night…"
              maxLength={100}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              After 15 books (Level 3), I want…
            </label>
            <input
              type="text"
              value={prize15}
              onChange={e => setPrize15(e.target.value)}
              placeholder="e.g. A new book, movie night…"
              maxLength={100}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <p className="text-xs text-gray-400">You can skip these for now and add them later in your profile.</p>
        </div>

        {submitError && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{submitError}</p>}

        <button
          type="submit"
          disabled={submitting || !name || !pin || !color}
          className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl text-base transition-colors"
        >
          {submitting ? 'Creating your account…' : "Let's read! 📚"}
        </button>
      </form>
    </div>
  );
}
