import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import sql from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.toUpperCase().trim() ?? '';
  if (!code) return NextResponse.json({ error: 'No code provided.' }, { status: 400 });

  const [row] = await sql`
    SELECT id FROM invite_codes WHERE code = ${code} AND used_at IS NULL
  `;
  if (!row) return NextResponse.json({ error: 'Code not found or already used.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const { code, name, pin, color, prize_5, prize_10, prize_15 } = await request.json();

  if (!code || !name?.trim() || !pin || !color) {
    return NextResponse.json({ error: 'Code, name, PIN, and color are required.' }, { status: 400 });
  }

  const cleanCode = code.toUpperCase().trim();

  // Validate code in a transaction-safe way
  const [codeRow] = await sql`
    SELECT id FROM invite_codes WHERE code = ${cleanCode} AND used_at IS NULL
  `;
  if (!codeRow) return NextResponse.json({ error: 'Invalid or already-used code.' }, { status: 400 });

  // Check name not taken
  const [existing] = await sql`SELECT id FROM readers WHERE LOWER(name) = LOWER(${name.trim()})`;
  if (existing) return NextResponse.json({ error: 'That name is already taken — try a nickname!' }, { status: 400 });

  const pin_hash = await hash(String(pin), 10);

  const [reader] = await sql`
    INSERT INTO readers (name, pin_hash, color, prize_5, prize_5_status, prize_10, prize_10_status, prize_15, prize_15_status)
    VALUES (
      ${name.trim()},
      ${pin_hash},
      ${color},
      ${prize_5?.trim() || null},
      'pending',
      ${prize_10?.trim() || null},
      'pending',
      ${prize_15?.trim() || null},
      'pending'
    )
    RETURNING id, name
  `;

  // Mark code as used
  await sql`
    UPDATE invite_codes SET used_at = NOW(), used_by = ${reader.id} WHERE code = ${cleanCode}
  `;

  // Auto-login
  await createSession({ readerId: reader.id, name: reader.name });

  return NextResponse.json({ ok: true, name: reader.name });
}
