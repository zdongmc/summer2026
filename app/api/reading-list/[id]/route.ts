import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { status } = await request.json();
  if (!['tbr', 'reading'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  await sql`
    UPDATE reading_list
    SET status = ${status}
    WHERE id = ${Number(id)} AND reader_id = ${session.readerId}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await sql`
    DELETE FROM reading_list
    WHERE id = ${Number(id)} AND reader_id = ${session.readerId}
  `;
  return NextResponse.json({ ok: true });
}
