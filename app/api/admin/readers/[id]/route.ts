import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { adminPin } = await request.json();
  if (adminPin !== process.env.ADMIN_PIN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await sql`DELETE FROM readers WHERE id = ${Number(id)}`;
  return NextResponse.json({ ok: true });
}
