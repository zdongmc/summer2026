import { redirect } from 'next/navigation';
import MentionText from '@/app/components/MentionText';
import { getSession } from '@/lib/auth';
import sql from '@/lib/db';
import { getColor } from '@/lib/colors';
import Link from 'next/link';
import AddToTbrButton from '@/app/components/AddToTbrButton';
import ReactionBar from '@/app/components/ReactionBar';

type ReviewRow = {
  id: number; title: string; author: string | null; cover_url: string | null;
  finished_date: string; rating: number; review: string;
  reader_name: string; reader_color: string;
};
type BookGroup = {
  title: string; author: string | null; cover_url: string | null; latestDate: string;
  reviews: Omit<ReviewRow, 'title' | 'author' | 'cover_url'>[];
};
type ReactionRow = { book_id: number; emoji: string; count: number; reacted_by_me: boolean };

function Stars({ rating }: { rating: number }) {
  return <span className="text-amber-400">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>;
}

function groupReviews(rows: ReviewRow[]): BookGroup[] {
  const map = new Map<string, BookGroup>();
  for (const row of rows) {
    const key = row.title.trim().toLowerCase();
    if (!map.has(key)) map.set(key, { title: row.title, author: row.author, cover_url: row.cover_url, latestDate: row.finished_date, reviews: [] });
    const group = map.get(key)!;
    if (!group.cover_url && row.cover_url) group.cover_url = row.cover_url;
    if (!group.author && row.author) group.author = row.author;
    if (row.finished_date > group.latestDate) group.latestDate = row.finished_date;
    group.reviews.push({ id: row.id, rating: row.rating, review: row.review, finished_date: row.finished_date, reader_name: row.reader_name, reader_color: row.reader_color });
  }
  return Array.from(map.values()).sort((a, b) => b.latestDate.localeCompare(a.latestDate));
}

export default async function RecommendationsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  let groups: BookGroup[] = [];
  let reactionMap = new Map<number, { emoji: string; count: number; reacted_by_me: boolean }[]>();

  try {
    const rows = await sql`
      SELECT b.id, b.title, b.author, b.cover_url, b.finished_date, b.rating, b.review,
             r.name as reader_name, r.color as reader_color
      FROM books b
      JOIN readers r ON b.reader_id = r.id
      WHERE b.review IS NOT NULL AND b.review != ''
      ORDER BY b.finished_date DESC, b.created_at DESC
    ` as ReviewRow[];

    groups = groupReviews(rows);

    const bookIds = rows.map(r => r.id);
    if (bookIds.length) {
      const reactionRows = await sql`
        SELECT book_id, emoji, COUNT(*)::int AS count,
               bool_or(reader_id = ${session.readerId}) AS reacted_by_me
        FROM reactions
        WHERE book_id = ANY(${bookIds})
        GROUP BY book_id, emoji
      ` as ReactionRow[];
      for (const row of reactionRows) {
        if (!reactionMap.has(row.book_id)) reactionMap.set(row.book_id, []);
        reactionMap.get(row.book_id)!.push({ emoji: row.emoji, count: row.count, reacted_by_me: row.reacted_by_me });
      }
    }
  } catch {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Database not set up. Ask a parent to visit <a href="/setup" className="underline">/setup</a>.</p>
      </div>
    );
  }

  const totalReviews = groups.reduce((n, g) => n + g.reviews.length, 0);

  return (
    <div className="px-5 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-900">Book Reviews</h1>
          <p className="text-gray-400 text-sm">
            {totalReviews} review{totalReviews !== 1 ? 's' : ''} · {groups.length} book{groups.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-emerald-700 hover:underline">← Dashboard</Link>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No reviews yet.</p>
          <p className="text-sm">When you log a book, add a short review and it will show up here.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {groups.map(g => (
            <div key={g.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col">
              <div className="flex gap-3 mb-3">
                {g.cover_url && (
                  <img src={g.cover_url} alt={g.title} className="w-14 h-20 object-cover rounded shadow-sm flex-shrink-0"
                    onError={'this.style.display="none"' as never} />
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h3 className="font-bold text-gray-800 leading-snug">{g.title}</h3>
                  {g.author && <p className="text-xs text-gray-500 mt-0.5">{g.author}</p>}
                </div>
              </div>

              <div className={`space-y-3 flex-1 ${g.reviews.length > 1 ? 'divide-y divide-gray-100' : ''}`}>
                {g.reviews.map(r => {
                  const c = getColor(r.reader_color);
                  return (
                    <div key={r.id} className={g.reviews.length > 1 ? 'pt-3 first:pt-0' : ''}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {r.rating && <Stars rating={r.rating} />}
                        <span className="text-xs font-semibold" style={{ color: c.text }}>{r.reader_name}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">
                          {new Date(r.finished_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 italic leading-relaxed">&ldquo;<MentionText text={r.review} />&rdquo;</p>
                      <ReactionBar bookId={r.id} initialReactions={reactionMap.get(r.id) ?? []} />
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <AddToTbrButton title={g.title} author={g.author} cover_url={g.cover_url} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
