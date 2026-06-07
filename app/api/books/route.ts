import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const mine = request.nextUrl.searchParams.get('mine') === 'true';

  if (mine) {
    const books = await sql`
      SELECT id, title, author, cover_url, started_date, finished_date, rating, review
      FROM books WHERE reader_id = ${session.readerId}
      ORDER BY finished_date DESC, created_at DESC
    `;
    return NextResponse.json(books);
  }

  const books = await sql`
    SELECT b.id, b.title, b.author, b.cover_url, b.started_date, b.finished_date, b.rating, b.review,
           r.name as reader_name, r.color as reader_color
    FROM books b JOIN readers r ON b.reader_id = r.id
    ORDER BY b.finished_date DESC, b.created_at DESC
  `;
  return NextResponse.json(books);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, author, cover_url, started_date, finished_date, rating, review } = await request.json();

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  if (!finished_date) return NextResponse.json({ error: 'Date finished is required.' }, { status: 400 });
  if (rating !== null && rating !== undefined && (rating < 1 || rating > 5)) {
    return NextResponse.json({ error: 'Rating must be 1–5.' }, { status: 400 });
  }

  const result = await sql`
    INSERT INTO books (reader_id, title, author, cover_url, started_date, finished_date, rating, review)
    VALUES (
      ${session.readerId},
      ${title.trim()},
      ${author?.trim() || null},
      ${cover_url?.trim() || null},
      ${started_date || null},
      ${finished_date},
      ${rating ?? null},
      ${review?.trim() || null}
    )
    RETURNING id
  `;
  return NextResponse.json({ id: result[0].id });
}
