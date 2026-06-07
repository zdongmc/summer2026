import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { title, author, cover_url, started_date, finished_date, rating, review } = await request.json();

  await sql`
    UPDATE books SET
      title = ${title},
      author = ${author ?? null},
      cover_url = ${cover_url ?? null},
      started_date = ${started_date ?? null},
      finished_date = ${finished_date},
      rating = ${rating ?? null},
      review = ${review ?? null}
    WHERE id = ${Number(id)} AND reader_id = ${session.readerId}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await sql`DELETE FROM books WHERE id = ${Number(id)} AND reader_id = ${session.readerId}`;
  return NextResponse.json({ ok: true });
}
