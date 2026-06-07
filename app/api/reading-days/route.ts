import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT day::text
    FROM reading_days
    WHERE reader_id = ${session.readerId}
    ORDER BY day DESC
  `;
  const days: string[] = rows.map((r: { day: string }) => r.day);
  return NextResponse.json({
    count: days.length,
    loggedToday: days.some(d => d === new Date().toISOString().split('T')[0]),
    days,
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let day = 'CURRENT_DATE';
  try {
    const body = await request.json();
    if (body?.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      day = body.date;
    }
  } catch { /* no body — use today */ }

  if (day === 'CURRENT_DATE') {
    await sql`
      INSERT INTO reading_days (reader_id, day)
      VALUES (${session.readerId}, CURRENT_DATE)
      ON CONFLICT (reader_id, day) DO NOTHING
    `;
  } else {
    await sql`
      INSERT INTO reading_days (reader_id, day)
      VALUES (${session.readerId}, ${day}::date)
      ON CONFLICT (reader_id, day) DO NOTHING
    `;
  }

  const rows = await sql`
    SELECT day::text FROM reading_days WHERE reader_id = ${session.readerId} ORDER BY day DESC
  `;
  const days: string[] = rows.map((r: { day: string }) => r.day);
  return NextResponse.json({
    count: days.length,
    loggedToday: days.some(d => d === new Date().toISOString().split('T')[0]),
    days,
  });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
  }

  await sql`
    DELETE FROM reading_days WHERE reader_id = ${session.readerId} AND day = ${date}::date
  `;

  const rows = await sql`
    SELECT day::text FROM reading_days WHERE reader_id = ${session.readerId} ORDER BY day DESC
  `;
  const days: string[] = rows.map((r: { day: string }) => r.day);
  return NextResponse.json({
    count: days.length,
    loggedToday: days.some(d => d === new Date().toISOString().split('T')[0]),
    days,
  });
}
