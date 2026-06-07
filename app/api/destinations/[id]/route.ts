import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await sql`DELETE FROM destinations WHERE id = ${Number(id)} AND reader_id = ${session.readerId}`;
  return NextResponse.json({ ok: true });
}
