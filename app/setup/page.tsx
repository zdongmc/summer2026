'use client';

import { useState } from 'react';
import { COLOR_NAMES, READER_COLORS } from '@/lib/colors';
import { FCPL_DESTINATIONS } from '@/lib/destinations';

type Reader = {
  id: number; name: string; color: string;
  prize_5: string | null; prize_5_status: string | null;
  prize_10: string | null; prize_10_status: string | null;
  prize_15: string | null; prize_15_status: string | null;
  book_count: number;
};

type InviteCode = {
  id: number; code: string; created_at: string;
  used_at: string | null; used_by_name: string | null;
};


export default function SetupPage() {
  const [adminPin, setAdminPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [dbStatus, setDbStatus] = useState('');
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newColor, setNewColor] = useState('forest');
  const [msg, setMsg] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [latestCode, setLatestCode] = useState<string | null>(null);
  const [resetPinMap, setResetPinMap] = useState<Record<number, string>>({});
  const [resettingPin, setResettingPin] = useState<number | null>(null);
  const [wishes, setWishes] = useState<Record<string, string[]>>({});
  const [groupVisitDest, setGroupVisitDest] = useState('');
  const [groupVisitDate, setGroupVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupVisitReaders, setGroupVisitReaders] = useState<number[]>([]);
  const [groupVisitMsg, setGroupVisitMsg] = useState('');
  const [groupVisitSubmitting, setGroupVisitSubmitting] = useState(false);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    const [rRes, cRes, wRes] = await Promise.all([
      fetch('/api/admin/readers?adminPin=' + encodeURIComponent(adminPin)),
      fetch('/api/admin/invite-codes?adminPin=' + encodeURIComponent(adminPin)),
      fetch('/api/admin/destination-wishes?adminPin=' + encodeURIComponent(adminPin)),
    ]);
    if (rRes.ok) {
      setReaders(await rRes.json());
      setCodes(cRes.ok ? await cRes.json() : []);
      setWishes(wRes.ok ? await wRes.json() : {});
      setUnlocked(true);
    } else {
      setMsg('Wrong admin PIN.');
    }
  }

  async function refreshReaders() {
    const res = await fetch('/api/admin/readers?adminPin=' + encodeURIComponent(adminPin));
    if (res.ok) setReaders(await res.json());
  }

  async function refreshCodes() {
    const res = await fetch('/api/admin/invite-codes?adminPin=' + encodeURIComponent(adminPin));
    if (res.ok) setCodes(await res.json());
  }

  async function logGroupVisit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupVisitDest || groupVisitReaders.length === 0) return;
    setGroupVisitSubmitting(true); setGroupVisitMsg('');
    const results = await Promise.all(
      groupVisitReaders.map(id =>
        fetch('/api/admin/destinations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminPin, readerId: id, name: groupVisitDest, visited_date: groupVisitDate }),
        })
      )
    );
    const failed = results.filter(r => !r.ok).length;
    setGroupVisitMsg(failed === 0
      ? `Logged for ${groupVisitReaders.length} girl${groupVisitReaders.length !== 1 ? 's' : ''}!`
      : `${results.length - failed} logged, ${failed} failed.`);
    setGroupVisitReaders([]);
    setGroupVisitDest('');
    setGroupVisitSubmitting(false);
    setTimeout(() => setGroupVisitMsg(''), 4000);
  }

  async function initDb() {
    setDbStatus('Initializing...');
    const res = await fetch('/api/init-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPin }),
    });
    setDbStatus(res.ok ? 'Database ready!' : 'Error — check server logs.');
  }

  async function addReader(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    const res = await fetch('/api/admin/readers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPin, name: newName, pin: newPin, color: newColor }),
    });
    if (res.ok) {
      setNewName(''); setNewPin(''); setNewColor('forest');
      await refreshReaders();
      setMsg(`Added ${newName}!`);
    } else {
      const data = await res.json();
      setMsg(data.error ?? 'Error adding reader.');
    }
  }

  async function removeReader(id: number, name: string) {
    if (!confirm(`Remove ${name}? This deletes all their books too.`)) return;
    await fetch(`/api/admin/readers/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPin }),
    });
    setReaders(readers.filter(r => r.id !== id));
  }

  async function resetPin(id: number, name: string) {
    const newPin = resetPinMap[id]?.trim();
    if (!newPin) return;
    setResettingPin(id);
    const res = await fetch('/api/admin/readers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPin, id, newPin }),
    });
    if (res.ok) {
      setMsg(`PIN reset for ${name}.`);
      setResetPinMap(m => { const n = { ...m }; delete n[id]; return n; });
      setTimeout(() => setMsg(''), 3000);
    } else {
      setMsg('Failed to reset PIN.');
    }
    setResettingPin(null);
  }

  async function generateCode() {
    setGeneratingCode(true);
    setLatestCode(null);
    const res = await fetch('/api/admin/invite-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPin }),
    });
    if (res.ok) {
      const data = await res.json();
      setLatestCode(data.code);
      await refreshCodes();
    }
    setGeneratingCode(false);
  }

  async function revokeCode(id: number) {
    await fetch(`/api/admin/invite-codes/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPin }),
    });
    await refreshCodes();
  }



  if (!unlocked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-extrabold text-emerald-900 text-center mb-6">Parent Setup</h1>
          <form onSubmit={unlock} className="bg-white rounded-2xl shadow-lg p-8 space-y-4 border border-gray-100">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Admin PIN</label>
              <input
                type="password"
                value={adminPin}
                onChange={e => setAdminPin(e.target.value)}
                placeholder="Enter admin PIN"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
            </div>
            {msg && <p className="text-red-600 text-sm">{msg}</p>}
            <button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Unlock
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-4">
            Set ADMIN_PIN in your .env.local file
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold text-emerald-900 mb-8">Parent Setup</h1>

      {/* Init DB */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-2">Initialize Database</h2>
        <p className="text-sm text-gray-500 mb-4">Run this once to create the tables. Safe to run again — it won&apos;t overwrite data.</p>
        <button
          onClick={initDb}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors"
        >
          Initialize Database
        </button>
        {dbStatus && <p className="text-sm text-gray-600 mt-2">{dbStatus}</p>}
      </section>

      {/* Invite Codes */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-gray-800">Invite Codes</h2>
            <p className="text-xs text-gray-400 mt-0.5">Give a girl a code and she can set up her own account at <code className="bg-gray-100 px-1 rounded">/join</code></p>
          </div>
          <button
            onClick={generateCode}
            disabled={generatingCode}
            className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            {generatingCode ? '...' : '+ New Code'}
          </button>
        </div>

        {latestCode && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
            <span className="text-emerald-900 font-mono text-xl font-extrabold tracking-widest">{latestCode}</span>
            <span className="text-xs text-emerald-600">← share this with a girl</span>
          </div>
        )}

        {codes.length === 0 ? (
          <p className="text-sm text-gray-400">No codes yet — generate one above.</p>
        ) : (
          <ul className="space-y-2">
            {codes.map(c => (
              <li key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-3">
                <span className="font-mono font-bold text-sm tracking-widest text-gray-700">{c.code}</span>
                {c.used_at ? (
                  <span className="text-xs text-gray-400 flex-1">
                    Used by <span className="font-semibold text-gray-600">{c.used_by_name ?? '?'}</span>
                  </span>
                ) : (
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex-1">unused</span>
                )}
                {!c.used_at && (
                  <button
                    onClick={() => revokeCode(c.id)}
                    className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>


      {/* Add reader (manual) */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-1">Add a Reader (manual)</h2>
        <p className="text-xs text-gray-400 mb-4">Or use invite codes above — girls can self-register and pick their own prizes.</p>
        <form onSubmit={addReader} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Sophia"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">PIN</label>
              <input
                type="text"
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                placeholder="e.g. 2468"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_NAMES.map(c => {
                const border = READER_COLORS[c].border;
                const bg = READER_COLORS[c].bg;
                const selected = newColor === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
                    style={{
                      background: selected ? bg : 'white',
                      borderColor: selected ? border : '#e5e7eb',
                      color: selected ? READER_COLORS[c].text : '#6b7280',
                    }}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: border }} />
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
          {msg && <p className="text-sm text-emerald-700">{msg}</p>}
          <button
            type="submit"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors"
          >
            Add Reader
          </button>
        </form>
      </section>

      {/* Reader list */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-gray-800 mb-4">Current Readers ({readers.length})</h2>
        {readers.length === 0 ? (
          <p className="text-sm text-gray-400">No readers yet.</p>
        ) : (
          <ul className="space-y-3">
            {readers.map(r => (
              <li key={r.id} className="py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: READER_COLORS[r.color]?.border ?? '#10b981' }}
                    />
                    <span className="text-sm font-medium text-gray-700">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setResetPinMap(m => ({ ...m, [r.id]: m[r.id] === undefined ? '' : undefined as unknown as string }))}
                      className="text-xs text-gray-400 hover:text-emerald-700 transition-colors"
                    >
                      Reset PIN
                    </button>
                    <button
                      onClick={() => removeReader(r.id, r.name)}
                      className="text-gray-300 hover:text-red-400 text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {(r.prize_5 || r.prize_10) && (
                  <div className="ml-6 space-y-1">
                    {r.prize_5 && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Level 1:</span>
                        <span className="text-gray-600">{r.prize_5}</span>
                      </div>
                    )}
                    {r.prize_10 && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Level 2:</span>
                        <span className="text-gray-600">{r.prize_10}</span>
                      </div>
                    )}
                    {r.prize_15 && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Level 3:</span>
                        <span className="text-gray-600">{r.prize_15}</span>
                      </div>
                    )}
                  </div>
                )}
                {r.id in resetPinMap && (
                  <div className="ml-6 mt-2 flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="New PIN"
                      value={resetPinMap[r.id] ?? ''}
                      onChange={e => setResetPinMap(m => ({ ...m, [r.id]: e.target.value }))}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <button
                      onClick={() => resetPin(r.id, r.name)}
                      disabled={!resetPinMap[r.id]?.trim() || resettingPin === r.id}
                      className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {resettingPin === r.id ? 'Saving…' : 'Save PIN'}
                    </button>
                    <button
                      onClick={() => setResetPinMap(m => { const n = { ...m }; delete n[r.id]; return n; })}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      cancel
                    </button>
                  </div>
                )}

              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-gray-800 mb-4">🔔 Milestone Alerts</h2>
        {(() => {
          const alerts: { type: 'individual' | 'group'; msg: string; detail: string; done: boolean }[] = [];

          // Individual milestones
          for (const r of readers) {
            const count = r.book_count ?? 0;
            if (count >= 5) {
              alerts.push({
                type: 'individual',
                msg: `${r.name} reached 5 books!`,
                detail: r.prize_5
                  ? `Level 1 wish: "${r.prize_5}"`
                  : 'No wish set yet.',
                done: r.prize_5_status === 'approved',
              });
            }
            if (count >= 10) {
              alerts.push({
                type: 'individual',
                msg: `${r.name} reached 10 books!`,
                detail: r.prize_10
                  ? `Level 2 wish: "${r.prize_10}"`
                  : 'No wish set yet.',
                done: r.prize_10_status === 'approved',
              });
            }
            if (count >= 15) {
              alerts.push({
                type: 'individual',
                msg: `${r.name} reached 15 books!`,
                detail: r.prize_15
                  ? `Level 3 wish: "${r.prize_15}"`
                  : 'No Level 3 wish set yet.',
                done: false,
              });
            }
          }

          // Group milestones
          const allAt12 = readers.length > 0 && readers.every(r => (r.book_count ?? 0) >= 12);
          const allAt20 = readers.length > 0 && readers.every(r => (r.book_count ?? 0) >= 20);
          if (allAt12) alerts.push({ type: 'group', msg: 'Everyone reached 12 books!', detail: 'Time to plan the Pool Party 💦', done: false });
          if (allAt20) alerts.push({ type: 'group', msg: 'Everyone reached 20 books!', detail: 'Time to plan Arcade Day at Round 1 🧸', done: false });

          if (alerts.length === 0) return (
            <p className="text-sm text-gray-400">No milestones reached yet.</p>
          );

          return (
            <div className="space-y-3">
              {alerts.map((a, i) => (
                <div key={i} className={`rounded-xl px-4 py-3 flex items-start gap-3 ${a.done ? 'bg-gray-50 border border-gray-100' : 'bg-amber-50 border border-amber-200'}`}>
                  <span className="text-xl flex-shrink-0">{a.type === 'group' ? '🎉' : '🎀'}</span>
                  <div>
                    <p className={`text-sm font-bold ${a.done ? 'text-gray-500' : 'text-amber-900'}`}>{a.msg}</p>
                    <p className={`text-xs mt-0.5 ${a.done ? 'text-gray-400' : 'text-amber-700'}`}>{a.detail}</p>
                  </div>
                  {a.done && <span className="ml-auto text-xs text-gray-400 flex-shrink-0">done</span>}
                </div>
              ))}
            </div>
          );
        })()}
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-gray-800 mb-4">⭐ Destination Wish Lists</h2>
        {(() => {
          // Invert: destination -> [reader names], sorted by count desc
          const destMap = new Map<string, string[]>();
          for (const [readerId, dests] of Object.entries(wishes)) {
            const reader = readers.find(r => r.id === Number(readerId));
            for (const dest of dests as string[]) {
              if (!destMap.has(dest)) destMap.set(dest, []);
              destMap.get(dest)!.push(reader?.name ?? '?');
            }
          }
          const sorted = [...destMap.entries()].sort((a, b) => b[1].length - a[1].length);
          if (sorted.length === 0) return <p className="text-sm text-gray-400">No destinations starred yet.</p>;
          return (
            <div className="space-y-2">
              {sorted.map(([dest, names]) => (
                <div key={dest} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-amber-400 font-bold text-sm flex-shrink-0">{'⭐'.repeat(names.length)}</span>
                    <span className="text-sm font-semibold text-gray-700 truncate">{dest}</span>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{names.join(', ')}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-gray-800 mb-4">📍 Log a Group Visit</h2>
        <form onSubmit={logGroupVisit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Destination</label>
            <select value={groupVisitDest} onChange={e => setGroupVisitDest(e.target.value)} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
              <option value="">Select a destination...</option>
              {FCPL_DESTINATIONS.map(group => (
                <optgroup key={group.region} label={group.region}>
                  {group.places.map(place => <option key={place} value={place}>{place}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Date visited</label>
            <input type="date" value={groupVisitDate} max={new Date().toISOString().split('T')[0]}
              onChange={e => setGroupVisitDate(e.target.value)} required
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Girls present</label>
            <div className="flex flex-wrap gap-3">
              {readers.map(r => (
                <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={groupVisitReaders.includes(r.id)}
                    onChange={e => setGroupVisitReaders(prev =>
                      e.target.checked ? [...prev, r.id] : prev.filter(id => id !== r.id)
                    )}
                    className="w-4 h-4 accent-emerald-600" />
                  <span className="text-sm font-medium text-gray-700">{r.name}</span>
                </label>
              ))}
            </div>
          </div>
          {groupVisitMsg && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{groupVisitMsg}</p>}
          <button type="submit" disabled={groupVisitSubmitting || !groupVisitDest || groupVisitReaders.length === 0}
            className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-colors">
            {groupVisitSubmitting ? 'Logging...' : 'Log Visit for Selected Girls'}
          </button>
        </form>
      </section>
    </div>
  );
}
