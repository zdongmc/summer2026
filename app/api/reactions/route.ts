import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ids = request.nextUrl.searchParams.get('book_ids');
  if (!ids) return NextResponse.json([]);

  const bookIds = ids.split(',').map(Number).filter(Boolean);
  if (!bookIds.length) return NextResponse.json([]);

  const rows = await sql`
    SELECT book_id, emoji, COUNT(*)::int AS count,
           bool_or(reader_id = ${session.readerId}) AS reacted_by_me
    FROM reactions
    WHERE book_id = ANY(${bookIds})
    GROUP BY book_id, emoji
    ORDER BY book_id, emoji
  `;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { book_id, emoji } = await request.json();
  if (!book_id || !emoji) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const ALLOWED = ['❤️', '😂', '😮', '👏', '🔥'];
  if (!ALLOWED.includes(emoji)) return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });

  const existing = await sql`
    SELECT id FROM reactions WHERE reader_id = ${session.readerId} AND book_id = ${book_id} AND emoji = ${emoji}
  `;

  if (existing.length) {
    await sql`DELETE FROM reactions WHERE reader_id = ${session.readerId} AND book_id = ${book_id} AND emoji = ${emoji}`;
    return NextResponse.json({ action: 'removed' });
  } else {
    await sql`INSERT INTO reactions (reader_id, book_id, emoji) VALUES (${session.readerId}, ${book_id}, ${emoji})`;
    return NextResponse.json({ action: 'added' });
  }
}
