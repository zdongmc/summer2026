import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import sql from '@/lib/db';
import { getColor } from '@/lib/colors';
import { INDIVIDUAL_MILESTONES, GROUP_MILESTONES } from '@/lib/milestones';
import Link from 'next/link';
import ReactionBar from '@/app/components/ReactionBar';
import MentionText from '@/app/components/MentionText';

type Reader = {
  id: number; name: string; color: string; avatar: string | null;
  book_count: string; reading_days: string; destination_count: string;
  prize_5: string | null; prize_5_status: string | null;
  prize_10: string | null; prize_10_status: string | null;
  prize_15: string | null; prize_15_status: string | null;
  now_reading: string | null;
};
type ReactionRow = { book_id: number; emoji: string; count: number; reacted_by_me: boolean };
type Review = {
  id: number; title: string; finished_date: string;
  rating: number | null; review: string;
  reader_name: string; reader_color: string;
};
type DestVisit = { id: number; name: string; visited_date: string; reader_name: string; reader_color: string };
type WishRow = { destination_name: string; reader_name: string; reader_color: string };

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <span className="text-amber-400 text-xs">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

function MilestoneBadge({ count, prize5, prize10, prize15 }: { count: number; prize5: string | null; prize10: string | null; prize15: string | null }) {
  const earned = INDIVIDUAL_MILESTONES.filter(m => m.books <= count);
  if (!earned.length) return null;
  const latest = earned[earned.length - 1];
  const prizes: Record<number, string | null> = { 5: prize5, 10: prize10, 15: prize15 };
  const reward = prizes[latest.books] || latest.reward;
  return (
    <span className="inline-block text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
      {reward} ✓
    </span>
  );
}

function GroupPartySection({ readers }: { readers: { book_count: string; name: string; color: string }[] }) {
  const GRADIENTS = [
    'from-sky-500 to-blue-600',
    'from-violet-500 to-purple-600',
  ];
  return (
    <div className="mb-8 grid sm:grid-cols-2 gap-4">
      {GROUP_MILESTONES.map((m, i) => {
        const reached = readers.filter(r => Number(r.book_count) >= m.books);
        const total = readers.length;
        const done = reached.length === total;
        const pct = total > 0 ? Math.round((reached.length / total) * 100) : 0;
        const remaining = readers.filter(r => Number(r.book_count) < m.books);

        return (
          <div
            key={m.books}
            className={`rounded-2xl overflow-hidden shadow-md ${done ? 'ring-2 ring-emerald-400' : ''}`}
          >
            <div className={`bg-gradient-to-r ${GRADIENTS[i]} p-5 text-white`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-4xl">{m.icon}</span>
                {done && <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">Let&apos;s go! 🎉</span>}
              </div>
              <h3 className="text-xl font-extrabold mt-2">{m.reward}</h3>
              <p className="text-white/75 text-xs mt-0.5">Every girl reads {m.books} books</p>
            </div>

            <div className="bg-white p-4">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-gray-700">{reached.length} of {total} girls ready</span>
                <span className="text-gray-400">{pct}%</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${GRADIENTS[i]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {readers.map(r => {
                  const hit = Number(r.book_count) >= m.books;
                  const c = getColor(r.color);
                  return (
                    <span
                      key={r.name}
                      className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                      style={hit
                        ? { background: c.bg, borderColor: c.border, color: c.text }
                        : { background: '#f9fafb', borderColor: '#e5e7eb', color: '#9ca3af' }
                      }
                    >
                      {hit ? '✓ ' : ''}{r.name}
                    </span>
                  );
                })}
              </div>

              {!done && remaining.length > 0 && (
                <p className="text-xs text-gray-400 mt-3">
                  Cheering on: {remaining.map(r => r.name).join(', ')} 📖
                </p>
              )}
              {done && (
                <p className="text-xs font-bold text-emerald-600 mt-3">Everyone made it — time to celebrate!</p>
              )}
            </div>
          </div>
        );
      })}

    </div>
  );
}

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect('/login');

  let readers: Reader[] = [];
  let recentReviews: Review[] = [];
  let reviewReactionMap = new Map<number, { emoji: string; count: number; reacted_by_me: boolean }[]>();
  let destVisits: DestVisit[] = [];
  let wishRows: WishRow[] = [];

  try {
    readers = await sql`
      SELECT r.id, r.name, r.color,
             COUNT(DISTINCT b.id)::text as book_count,
             COUNT(DISTINCT rd.day)::text as reading_days,
             COUNT(DISTINCT d.id)::text as destination_count,
             r.prize_5, r.prize_5_status, r.prize_10, r.prize_10_status, r.prize_15, r.prize_15_status,
             r.avatar,
             nr.title as now_reading
      FROM readers r
      LEFT JOIN books b ON b.reader_id = r.id
      LEFT JOIN reading_days rd ON rd.reader_id = r.id
      LEFT JOIN destinations d ON d.reader_id = r.id
      LEFT JOIN LATERAL (
        SELECT title FROM reading_list
        WHERE reader_id = r.id AND status = 'reading'
        ORDER BY added_date DESC
        LIMIT 1
      ) nr ON true
      GROUP BY r.id, r.name, r.color, r.avatar, r.prize_5, r.prize_5_status, r.prize_10, r.prize_10_status, r.prize_15, r.prize_15_status, nr.title
      ORDER BY COUNT(DISTINCT b.id) DESC, r.name
    ` as Reader[];

    recentReviews = await sql`
      SELECT b.id, b.title, b.finished_date, b.rating, b.review,
             r.name as reader_name, r.color as reader_color
      FROM books b
      JOIN readers r ON b.reader_id = r.id
      WHERE b.review IS NOT NULL AND b.review != ''
      ORDER BY b.finished_date DESC, b.created_at DESC
      LIMIT 20
    ` as Review[];

    destVisits = await sql`
      SELECT d.id, d.name, d.visited_date,
             r.name as reader_name, r.color as reader_color
      FROM destinations d
      JOIN readers r ON d.reader_id = r.id
      ORDER BY d.visited_date DESC, d.created_at DESC
      LIMIT 30
    ` as DestVisit[];

    wishRows = await sql`
      SELECT dw.destination_name, r.name as reader_name, r.color as reader_color
      FROM destination_wishes dw
      JOIN readers r ON dw.reader_id = r.id
      ORDER BY dw.destination_name, r.name
    ` as WishRow[];

    const reviewIds = recentReviews.map(b => b.id);
    if (reviewIds.length) {
      const reactionRows = await sql`
        SELECT book_id, emoji, COUNT(*)::int AS count,
               bool_or(reader_id = ${session.readerId}) AS reacted_by_me
        FROM reactions
        WHERE book_id = ANY(${reviewIds})
        GROUP BY book_id, emoji
      ` as ReactionRow[];
      for (const row of reactionRows) {
        if (!reviewReactionMap.has(row.book_id)) reviewReactionMap.set(row.book_id, []);
        reviewReactionMap.get(row.book_id)!.push({ emoji: row.emoji, count: row.count, reacted_by_me: row.reacted_by_me });
      }
    }

  } catch {
    return (
      <div className="p-8 text-center text-red-600">
        <p className="font-semibold">Database not set up yet.</p>
        <p className="text-sm mt-1">Ask a parent to visit <a href="/setup" className="underline">/setup</a> first.</p>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-emerald-900 mb-1">
          Hi, {session.name}!
        </h1>
        <p className="text-gray-500 text-sm">Summer Reading Club 2026 — here&rsquo;s how everyone is doing.</p>
      </div>

      <h2 className="text-lg font-bold text-emerald-900 mb-4">Group Goals</h2>
      <GroupPartySection readers={readers} />

      <h2 className="text-lg font-bold text-emerald-900 mb-4">Individual Goals</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {readers.map(r => {
          const c = getColor(r.color);
          const count = Number(r.book_count);
          const days = Number(r.reading_days);
          const destinations = Number(r.destination_count);
          const tickets = days + destinations;
          const next = INDIVIDUAL_MILESTONES.find(m => m.books > count);
          const pct = next ? Math.round((count / next.books) * 100) : 100;
          const ticketPct = Math.min(100, Math.round((tickets / 20) * 100));
          const isMe = r.id === session.readerId;

          const prize5 = r.prize_5_status === 'approved' ? r.prize_5 : (isMe && r.prize_5 ? r.prize_5 : null);
          const prize10 = r.prize_10_status === 'approved' ? r.prize_10 : (isMe && r.prize_10 ? r.prize_10 : null);
          const prize15 = r.prize_15_status === 'approved' ? r.prize_15 : (isMe && r.prize_15 ? r.prize_15 : null);
          const prizeMap: Record<number, string | null> = { 5: prize5, 10: prize10, 15: prize15 };
          const nextReward = next ? (prizeMap[next.books] || next.reward) : null;

          return (
            <div
              key={r.id}
              className="rounded-2xl p-5 shadow-sm"
              style={{ background: c.light, borderTop: `4px solid ${c.border}` }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {r.avatar && <span className="text-xl leading-none flex-shrink-0">{r.avatar}</span>}
                  <span className="font-bold text-sm truncate" style={{ color: c.text }}>
                    {r.name}{isMe && <span className="ml-1 text-xs opacity-60">(you)</span>}
                  </span>
                </div>
                <span className="text-2xl font-extrabold flex-shrink-0 ml-2" style={{ color: c.border }}>{count}</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{count === 1 ? 'book' : 'books'} read</p>
              {r.now_reading && (
                <p className="text-xs text-gray-500 mb-2 truncate">📖 <span className="italic">{r.now_reading}</span></p>
              )}
              <MilestoneBadge count={count} prize5={prize5} prize10={prize10} prize15={prize15} />

              {next && (
                <div className="mt-3">
                  <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.border }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {next.books - count} more book{next.books - count !== 1 ? 's' : ''} → {nextReward}
                  </p>
                </div>
              )}

              {tickets > 0 && (
                <div className="mt-3 pt-3 border-t border-white/50">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400 italic">FCPL (optional)</span>
                    <span className="text-gray-400">{tickets} tickets {tickets >= 20 ? '✓' : ''}</span>
                  </div>
                  <div className="h-1 bg-white/60 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${ticketPct}%`, background: c.border, opacity: 0.4 }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-emerald-900">Reviews</h2>
        <Link href="/recommendations" className="text-sm text-emerald-700 hover:underline">
          See all →
        </Link>
      </div>
      {recentReviews.length === 0 ? (
        <p className="text-gray-400 text-sm">No reviews yet. Add one when you log a book!</p>
      ) : (
        <div className="space-y-3">
          {recentReviews.map(b => {
            const c = getColor(b.reader_color);
            return (
              <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex gap-4 items-start">
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0"
                  style={{ background: c.border }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 text-sm">{b.title}</span>
                    <Stars rating={b.rating} />
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex gap-2">
                    <span style={{ color: c.text }} className="font-medium">{b.reader_name}</span>
                    <span>·</span>
                    <span>{new Date(b.finished_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 italic">&ldquo;<MentionText text={b.review} />&rdquo;</p>
                  <ReactionBar bookId={b.id} initialReactions={reviewReactionMap.get(b.id) ?? []} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {wishRows.length > 0 && (() => {
        const wishMap = new Map<string, { name: string; color: string }[]>();
        for (const w of wishRows) {
          if (!wishMap.has(w.destination_name)) wishMap.set(w.destination_name, []);
          wishMap.get(w.destination_name)!.push({ name: w.reader_name, color: w.reader_color });
        }
        const sorted = [...wishMap.entries()].sort((a, b) => b[1].length - a[1].length);
        return (
          <>
            <h2 className="text-lg font-bold text-emerald-900 mt-10 mb-4">⭐ Destination Wish List</h2>
            <div className="flex flex-wrap gap-2 mb-10">
              {sorted.map(([dest, readers]) => (
                <div key={dest} className="bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 flex items-center gap-2">
                  <span className="text-sm font-semibold text-amber-800">{dest}</span>
                  <span className="text-xs text-amber-500">{'⭐'.repeat(readers.length)}</span>
                  <span className="text-xs text-amber-600">{readers.map(r => r.name).join(', ')}</span>
                </div>
              ))}
            </div>
          </>
        );
      })()}

      <h2 className="text-lg font-bold text-emerald-900 mt-10 mb-4">Places Visited</h2>
      {destVisits.length === 0 ? (
        <p className="text-gray-400 text-sm">No visits yet — log one in My Activity!</p>
      ) : (
        <div className="space-y-2">
          {destVisits.map(d => {
            const c = getColor(d.reader_color);
            return (
              <div key={d.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex items-center gap-3">
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: c.border }} />
                <span className="text-lg leading-none">📍</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{d.name}</p>
                  <div className="text-xs text-gray-400 mt-0.5 flex gap-2">
                    <span style={{ color: c.text }} className="font-medium">{d.reader_name}</span>
                    <span>·</span>
                    <span>{new Date(d.visited_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
