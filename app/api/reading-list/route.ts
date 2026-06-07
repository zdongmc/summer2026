import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const entries = await sql`
    SELECT id, title, author, isbn, cover_url, status, added_date
    FROM reading_list
    WHERE reader_id = ${session.readerId}
    ORDER BY status DESC, created_at ASC
  `;
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, author, isbn, cover_url } = await request.json();
  if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });

  const result = await sql`
    INSERT INTO reading_list (reader_id, title, author, isbn, cover_url, status, added_date)
    VALUES (
      ${session.readerId},
      ${title.trim()},
      ${author?.trim() || null},
      ${isbn?.trim() || null},
      ${cover_url?.trim() || null},
      'tbr',
      CURRENT_DATE
    )
    RETURNING id
  `;
  return NextResponse.json({ id: result[0].id });
}
