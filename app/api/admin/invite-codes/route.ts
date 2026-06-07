import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import sql from '@/lib/db';

function checkAdmin(pin: string) { return pin === process.env.ADMIN_PIN; }

function generateCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

export async function GET(request: NextRequest) {
  const adminPin = request.nextUrl.searchParams.get('adminPin') ?? '';
  if (!checkAdmin(adminPin)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const codes = await sql`
    SELECT ic.id, ic.code, ic.created_at, ic.used_at, r.name as used_by_name
    FROM invite_codes ic
    LEFT JOIN readers r ON r.id = ic.used_by
    ORDER BY ic.created_at DESC
  `;
  return NextResponse.json(codes);
}

export async function POST(request: Request) {
  const { adminPin } = await request.json();
  if (!checkAdmin(adminPin)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const code = generateCode();
  await sql`INSERT INTO invite_codes (code) VALUES (${code})`;
  return NextResponse.json({ code });
}
