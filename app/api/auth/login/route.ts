import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import sql from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  const { name, pin } = await request.json();
  if (!name || !pin) return NextResponse.json({ error: 'Missing name or PIN.' }, { status: 400 });

  const rows = await sql`SELECT id, name, pin_hash FROM readers WHERE name = ${name} LIMIT 1`;
  if (rows.length === 0) return NextResponse.json({ error: 'Name not found.' }, { status: 401 });

  const reader = rows[0] as { id: number; name: string; pin_hash: string };
  const ok = await compare(pin, reader.pin_hash);
  if (!ok) return NextResponse.json({ error: 'Wrong PIN.' }, { status: 401 });

  await createSession({ readerId: reader.id, name: reader.name });
  return NextResponse.json({ ok: true });
}
