'use client';

import { useState, useEffect, useCallback } from 'react';
import { COLOR_NAMES, READER_COLORS } from '@/lib/colors';
import { AVATARS } from '@/lib/avatars';

type Profile = {
  color: string;
  avatar: string | null;
  prize_5: string | null;
  prize_10: string | null;
  prize_15: string | null;
};

export default function ProfileClient({ name }: { name: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editColor, setEditColor] = useState('forest');
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [editPrize5, setEditPrize5] = useState('');
  const [editPrize10, setEditPrize10] = useState('');
  const [editPrize15, setEditPrize15] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editingPrizes, setEditingPrizes] = useState(false);

  const fetchProfile = useCallback(async () => {
    const res = await fetch('/api/readers');
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setEditColor(data.color ?? 'forest');
      setEditAvatar(data.avatar ?? null);
      setEditPrize5(data.prize_5 ?? '');
      setEditPrize10(data.prize_10 ?? '');
      setEditPrize15(data.prize_15 ?? '');
      setEditPrize15(data.prize_15 ?? '');
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg('');
    const body: Record<string, unknown> = { color: editColor, avatar: editAvatar };
    if (editingPrizes) {
      body.prize_5 = editPrize5 || null;
      body.prize_10 = editPrize10 || null;
      body.prize_15 = editPrize15 || null;
    }
    const res = await fetch('/api/readers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setMsg('Saved!');
      setEditingPrizes(false);
      await fetchProfile();
      setTimeout(() => setMsg(''), 3000);
    } else {
      setMsg('Something went wrong.');
    }
    setSaving(false);
  }

  if (!profile) return <div className="px-5 py-12 text-center text-gray-400">Loading...</div>;

  const c = READER_COLORS[editColor] ?? READER_COLORS.forest;

  return (
    <div className="px-5 py-10 max-w-md mx-auto">
      {/* Avatar display */}
      <div className="text-center mb-8">
        <div
          className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center shadow"
          style={{ background: c.bg, border: `3px solid ${c.border}` }}
        >
          {editAvatar
            ? <span className="text-4xl leading-none">{editAvatar}</span>
            : <span className="text-2xl font-extrabold" style={{ color: c.text }}>{name.charAt(0).toUpperCase()}</span>
          }
        </div>
        <h1 className="text-2xl font-extrabold text-emerald-900">{name}</h1>
        <p className="text-gray-400 text-sm mt-1">Your profile</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Avatar picker */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-3">Your avatar</h2>
          <div className="grid grid-cols-8 gap-2">
            {AVATARS.map(emoji => {
              const selected = editAvatar === emoji;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setEditAvatar(selected ? null : emoji)}
                  className={`text-2xl leading-none w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${
                    selected
                      ? 'border-emerald-400 bg-emerald-50 scale-110 shadow'
                      : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                  }`}
                  title={emoji}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
          {editAvatar && (
            <button type="button" onClick={() => setEditAvatar(null)} className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline">
              Remove avatar (use initial instead)
            </button>
          )}
        </div>

        {/* Color */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-3">Your color</h2>
          <div className="flex flex-wrap gap-2">
            {COLOR_NAMES.map(colorName => {
              const selected = editColor === colorName;
              return (
                <button
                  key={colorName}
                  type="button"
                  onClick={() => setEditColor(colorName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
                  style={{
                    background: selected ? READER_COLORS[colorName].bg : 'white',
                    borderColor: selected ? READER_COLORS[colorName].border : '#e5e7eb',
                    color: selected ? READER_COLORS[colorName].text : '#6b7280',
                  }}
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: READER_COLORS[colorName].border }} />
                  {colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Prize wishes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-800">🎁 Prize wishes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Talk with your parent about your prize wishes — you can change them anytime.</p>
            </div>
            {!editingPrizes && (
              <button type="button" onClick={() => setEditingPrizes(true)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                Edit wishes
              </button>
            )}
          </div>

          {editingPrizes ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Level 1 (5 books) — I want…</label>
                <input type="text" value={editPrize5} onChange={e => setEditPrize5(e.target.value)}
                  placeholder="e.g. Madmia socks, trip to Dairy Queen…" maxLength={100}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Level 2 (10 books) — I want…</label>
                <input type="text" value={editPrize10} onChange={e => setEditPrize10(e.target.value)}
                  placeholder="e.g. A new book, movie night…" maxLength={100}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Level 3 (15 books) — I want…</label>
                <input type="text" value={editPrize15} onChange={e => setEditPrize15(e.target.value)}
                  placeholder="e.g. A new book, movie night…" maxLength={100}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <button type="button" onClick={() => { setEditingPrizes(false); setEditPrize5(profile.prize_5 ?? ''); setEditPrize10(profile.prize_10 ?? ''); setEditPrize15(profile.prize_15 ?? ''); }}
                className="text-xs text-gray-400 hover:text-gray-600 underline">Cancel</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-sm text-gray-500 w-20 flex-shrink-0 pt-0.5">Level 1:</span>
                <div className="flex-1">
                  {profile.prize_5 ? (
                    <p className="text-sm font-medium text-gray-800">{profile.prize_5}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Not set yet — tap &ldquo;Edit wishes&rdquo;!</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-sm text-gray-500 w-20 flex-shrink-0 pt-0.5">Level 2:</span>
                <div className="flex-1">
                  {profile.prize_10 ? (
                    <p className="text-sm font-medium text-gray-800">{profile.prize_10}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Not set yet — tap &ldquo;Edit wishes&rdquo;!</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-sm text-gray-500 w-20 flex-shrink-0 pt-0.5">Level 3:</span>
                <div className="flex-1">
                  {profile.prize_15 ? (
                    <p className="text-sm font-medium text-gray-800">{profile.prize_15}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Not set yet — tap &ldquo;Edit wishes&rdquo;!</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {msg && (
          <p className={`text-sm rounded-lg px-3 py-2 text-center ${msg === 'Saved!' ? 'text-emerald-700 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>{msg}</p>
        )}

        <button type="submit" disabled={saving}
          className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold py-3 rounded-xl transition-colors">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
