import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import sql from '@/lib/db';

function checkAdmin(pin: string) {
  return pin === process.env.ADMIN_PIN;
}

export async function GET(request: NextRequest) {
  const adminPin = request.nextUrl.searchParams.get('adminPin') ?? '';
  if (!checkAdmin(adminPin)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const readers = await sql`
      SELECT r.id, r.name, r.color, r.prize_5, r.prize_5_status, r.prize_10, r.prize_10_status, r.prize_15, r.prize_15_status,
             COUNT(b.id)::int AS book_count
      FROM readers r
      LEFT JOIN books b ON b.reader_id = r.id
      GROUP BY r.id, r.name, r.color, r.prize_5, r.prize_5_status, r.prize_10, r.prize_10_status, r.prize_15, r.prize_15_status
      ORDER BY r.name
    `;
    return NextResponse.json(readers);
  } catch {
    return NextResponse.json([]); // tables not yet initialized
  }
}

export async function POST(request: Request) {
  const { adminPin, name, pin, color } = await request.json();
  if (!checkAdmin(adminPin)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!name?.trim() || !pin) return NextResponse.json({ error: 'Name and PIN required.' }, { status: 400 });

  const pin_hash = await hash(pin, 10);
  await sql`
    INSERT INTO readers (name, pin_hash, color) VALUES (${name.trim()}, ${pin_hash}, ${color ?? 'forest'})
  `;
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const { adminPin, id, newPin } = await request.json();
  if (!checkAdmin(adminPin)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  if (newPin !== undefined) {
    const pin_hash = await hash(String(newPin), 10);
    await sql`UPDATE readers SET pin_hash = ${pin_hash} WHERE id = ${id}`;
  }
  return NextResponse.json({ ok: true });
}
