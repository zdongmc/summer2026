import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { color, avatar, prize_5, prize_10, prize_15 } = await request.json();

  if (prize_5 !== undefined) {
    await sql`UPDATE readers SET prize_5 = ${prize_5?.trim() || null} WHERE id = ${session.readerId}`;
  }
  if (prize_10 !== undefined) {
    await sql`UPDATE readers SET prize_10 = ${prize_10?.trim() || null} WHERE id = ${session.readerId}`;
  }
  if (prize_15 !== undefined) {
    await sql`UPDATE readers SET prize_15 = ${prize_15?.trim() || null} WHERE id = ${session.readerId}`;
  }
  if (color) {
    await sql`UPDATE readers SET color = ${color} WHERE id = ${session.readerId}`;
  }
  if (avatar !== undefined) {
    await sql`UPDATE readers SET avatar = ${avatar || null} WHERE id = ${session.readerId}`;
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getSession();

  if (!session) {
    // No auth — return all reader names for the login dropdown
    try {
      const readers = await sql`SELECT id, name FROM readers ORDER BY name`;
      return NextResponse.json(readers);
    } catch {
      return NextResponse.json([]);
    }
  }

  // Authenticated — return current reader's full profile
  const [reader] = await sql`
    SELECT id, name, color, avatar, prize_5, prize_10, prize_15
    FROM readers WHERE id = ${session.readerId}
  `;
  return NextResponse.json(reader ?? null);
}
