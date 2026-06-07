'use client';

import { useState } from 'react';

interface Props {
  title: string;
  author?: string | null;
  cover_url?: string | null;
}

export default function AddToTbrButton({ title, author, cover_url }: Props) {
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');

  async function handleClick() {
    setState('saving');
    const res = await fetch('/api/reading-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author: author ?? null, cover_url: cover_url ?? null }),
    });
    setState(res.ok ? 'done' : 'error');
    if (res.ok) setTimeout(() => setState('idle'), 2500);
  }

  if (state === 'done') {
    return (
      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
        Added to TBR
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'saving'}
      className="text-xs font-semibold text-gray-500 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
    >
      {state === 'saving' ? 'Adding…' : state === 'error' ? 'Error — retry' : '+ Add to TBR'}
    </button>
  );
}
