import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT destination_name FROM destination_wishes
    WHERE reader_id = ${session.readerId}
    ORDER BY created_at
  `;
  return NextResponse.json((rows as { destination_name: string }[]).map(r => r.destination_name));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const existing = await sql`
    SELECT id FROM destination_wishes
    WHERE reader_id = ${session.readerId} AND destination_name = ${name.trim()}
  `;

  if (existing.length) {
    await sql`
      DELETE FROM destination_wishes
      WHERE reader_id = ${session.readerId} AND destination_name = ${name.trim()}
    `;
    return NextResponse.json({ action: 'removed' });
  } else {
    await sql`
      INSERT INTO destination_wishes (reader_id, destination_name)
      VALUES (${session.readerId}, ${name.trim()})
    `;
    return NextResponse.json({ action: 'added' });
  }
}
