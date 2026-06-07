'use client';

import { useState } from 'react';

const EMOJIS = ['❤️', '😂', '😮', '👏', '🔥'];

type Reaction = { emoji: string; count: number; reacted_by_me: boolean };

export default function ReactionBar({ bookId, initialReactions }: {
  bookId: number;
  initialReactions: Reaction[];
}) {
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions);
  const [pending, setPending] = useState<string | null>(null);

  async function toggle(emoji: string) {
    if (pending) return;
    setPending(emoji);

    // Optimistic update
    setReactions(prev => {
      const existing = prev.find(r => r.emoji === emoji);
      if (existing) {
        const updated = prev.map(r =>
          r.emoji === emoji ? { ...r, count: r.reacted_by_me ? r.count - 1 : r.count + 1, reacted_by_me: !r.reacted_by_me } : r
        );
        return updated.filter(r => r.count > 0);
      }
      return [...prev, { emoji, count: 1, reacted_by_me: true }];
    });

    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: bookId, emoji }),
      });
    } catch { /* revert not needed for reactions */ }

    setPending(null);
  }

  return (
    <div className="flex gap-1 flex-wrap mt-2">
      {EMOJIS.map(emoji => {
        const r = reactions.find(r => r.emoji === emoji);
        const active = r?.reacted_by_me ?? false;
        return (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            disabled={pending === emoji}
            className={`flex items-center gap-1 text-sm px-2 py-0.5 rounded-full border transition-all active:scale-90 ${
              active
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            title={active ? 'Remove reaction' : 'React'}
          >
            <span>{emoji}</span>
            {r && r.count > 0 && (
              <span className={`text-xs font-bold ${active ? 'text-emerald-700' : 'text-gray-500'}`}>
                {r.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
