import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
  const { adminPin, readerId, name, visited_date } = await request.json();
  if (adminPin !== process.env.ADMIN_PIN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!readerId || !name || !visited_date) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  await sql`
    INSERT INTO destinations (reader_id, name, visited_date)
    VALUES (${readerId}, ${name}, ${visited_date}::date)
    ON CONFLICT DO NOTHING
  `;
  return NextResponse.json({ ok: true });
}
