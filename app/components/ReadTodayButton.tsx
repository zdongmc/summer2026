'use client';

import { useState } from 'react';

interface Props {
  initialCount: number;
  initialLoggedToday: boolean;
}

export default function ReadTodayButton({ initialCount, initialLoggedToday }: Props) {
  const [count, setCount] = useState(initialCount);
  const [loggedToday, setLoggedToday] = useState(initialLoggedToday);
  const [logging, setLogging] = useState(false);

  async function handleLog() {
    setLogging(true);
    const res = await fetch('/api/reading-days', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setCount(data.count);
      setLoggedToday(true);
    }
    setLogging(false);
  }

  const pct = Math.min(100, Math.round((count / 20) * 100));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-emerald-900 mb-1">
            Reading days — {count} / 20
          </p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          {count >= 20 && (
            <p className="text-xs font-bold text-emerald-700 mt-1">FCPL goal reached! 🎉</p>
          )}
        </div>
        {loggedToday ? (
          <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl flex-shrink-0">
            ✓ Logged today!
          </span>
        ) : (
          <button
            onClick={handleLog}
            disabled={logging}
            className="text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 px-5 py-2 rounded-xl transition-all flex-shrink-0"
          >
            {logging ? 'Logging…' : '📖 I Read Today!'}
          </button>
        )}
      </div>
    </div>
  );
}
