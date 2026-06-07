import { NextResponse } from 'next/server';
import sql from '@/lib/db';

function checkAdmin(pin: string) { return pin === process.env.ADMIN_PIN; }

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ readerId: string }> }
) {
  const { adminPin, milestone, status } = await request.json();
  if (!checkAdmin(adminPin)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (![5, 10, 15].includes(milestone)) return NextResponse.json({ error: 'Invalid milestone.' }, { status: 400 });
  if (!['approved', 'rejected'].includes(status)) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });

  const { readerId } = await params;

  if (milestone === 5) {
    await sql`UPDATE readers SET prize_5_status = ${status} WHERE id = ${Number(readerId)}`;
  } else if (milestone === 10) {
    await sql`UPDATE readers SET prize_10_status = ${status} WHERE id = ${Number(readerId)}`;
  } else {
    await sql`UPDATE readers SET prize_15_status = ${status} WHERE id = ${Number(readerId)}`;
  }
  return NextResponse.json({ ok: true });
}
