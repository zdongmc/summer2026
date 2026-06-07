import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const mine = request.nextUrl.searchParams.get('mine') === 'true';
  if (mine) {
    const rows = await sql`
      SELECT id, name, visited_date FROM destinations
      WHERE reader_id = ${session.readerId}
      ORDER BY visited_date DESC, created_at DESC
    `;
    return NextResponse.json(rows);
  }

  const rows = await sql`
    SELECT d.id, d.name, d.visited_date, r.name as reader_name, r.color as reader_color
    FROM destinations d JOIN readers r ON d.reader_id = r.id
    ORDER BY d.visited_date DESC, d.created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, visited_date } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Destination required.' }, { status: 400 });
  if (!visited_date) return NextResponse.json({ error: 'Date required.' }, { status: 400 });

  const result = await sql`
    INSERT INTO destinations (reader_id, name, visited_date)
    VALUES (${session.readerId}, ${name.trim()}, ${visited_date})
    RETURNING id
  `;
  return NextResponse.json({ id: result[0].id });
}
