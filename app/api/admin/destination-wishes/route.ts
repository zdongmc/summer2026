import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

function checkAdmin(pin: string) { return pin === process.env.ADMIN_PIN; }

export async function GET(request: NextRequest) {
  const adminPin = request.nextUrl.searchParams.get('adminPin') ?? '';
  if (!checkAdmin(adminPin)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await sql`
    SELECT reader_id, destination_name
    FROM destination_wishes
    ORDER BY reader_id, created_at
  `;

  const map: Record<number, string[]> = {};
  for (const row of rows) {
    if (!map[row.reader_id]) map[row.reader_id] = [];
    map[row.reader_id].push(row.destination_name);
  }
  return NextResponse.json(map);
}
