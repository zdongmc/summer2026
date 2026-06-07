import { NextResponse } from 'next/server';
import sql from '@/lib/db';

function checkAdmin(pin: string) { return pin === process.env.ADMIN_PIN; }

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { adminPin } = await request.json();
  if (!checkAdmin(adminPin)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await sql`DELETE FROM invite_codes WHERE id = ${Number(id)} AND used_at IS NULL`;
  return NextResponse.json({ ok: true });
}
