import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request) {
  const { adminPin } = await request.json();
  if (adminPin !== process.env.ADMIN_PIN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await sql`CREATE TABLE IF NOT EXISTS readers (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    pin_hash   VARCHAR(255) NOT NULL,
    color      VARCHAR(20)  NOT NULL DEFAULT 'forest',
    prize_5    VARCHAR(500),
    prize_10   VARCHAR(500),
    prize_15   VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`ALTER TABLE readers ADD COLUMN IF NOT EXISTS prize_5 VARCHAR(500)`;
  await sql`ALTER TABLE readers ADD COLUMN IF NOT EXISTS prize_10 VARCHAR(500)`;
  await sql`ALTER TABLE readers ADD COLUMN IF NOT EXISTS prize_15 VARCHAR(500)`;
  await sql`ALTER TABLE readers DROP COLUMN IF EXISTS prize_5_status`;
  await sql`ALTER TABLE readers DROP COLUMN IF EXISTS prize_10_status`;
  await sql`ALTER TABLE readers DROP COLUMN IF EXISTS prize_15_status`;

  await sql`CREATE TABLE IF NOT EXISTS invite_codes (
    id         SERIAL PRIMARY KEY,
    code       VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at    TIMESTAMPTZ,
    used_by    INTEGER REFERENCES readers(id)
  )`;

  await sql`CREATE TABLE IF NOT EXISTS books (
    id            SERIAL PRIMARY KEY,
    reader_id     INTEGER NOT NULL REFERENCES readers(id) ON DELETE CASCADE,
    title         VARCHAR(500) NOT NULL,
    author        VARCHAR(500),
    cover_url     VARCHAR(1000),
    finished_date DATE NOT NULL,
    rating        INTEGER CHECK (rating BETWEEN 1 AND 5),
    review        TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`ALTER TABLE readers ADD COLUMN IF NOT EXISTS avatar VARCHAR(10)`;
  await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS author VARCHAR(500)`;
  await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_url VARCHAR(1000)`;
  await sql`ALTER TABLE books ADD COLUMN IF NOT EXISTS started_date DATE`;

  await sql`CREATE TABLE IF NOT EXISTS destinations (
    id           SERIAL PRIMARY KEY,
    reader_id    INTEGER NOT NULL REFERENCES readers(id) ON DELETE CASCADE,
    name         VARCHAR(500) NOT NULL,
    visited_date DATE NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS reading_list (
    id         SERIAL PRIMARY KEY,
    reader_id  INTEGER NOT NULL REFERENCES readers(id) ON DELETE CASCADE,
    title      VARCHAR(500) NOT NULL,
    author     VARCHAR(500),
    isbn       VARCHAR(20),
    cover_url  VARCHAR(1000),
    status     VARCHAR(10) NOT NULL DEFAULT 'tbr' CHECK (status IN ('tbr','reading')),
    added_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  await sql`ALTER TABLE reading_list ADD COLUMN IF NOT EXISTS cover_url VARCHAR(1000)`;

  await sql`CREATE TABLE IF NOT EXISTS reading_days (
    id        SERIAL PRIMARY KEY,
    reader_id INTEGER NOT NULL REFERENCES readers(id) ON DELETE CASCADE,
    day       DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reader_id, day)
  )`;

  await sql`CREATE TABLE IF NOT EXISTS reactions (
    id         SERIAL PRIMARY KEY,
    reader_id  INTEGER NOT NULL REFERENCES readers(id) ON DELETE CASCADE,
    book_id    INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    emoji      VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reader_id, book_id, emoji)
  )`;

  await sql`CREATE TABLE IF NOT EXISTS destination_wishes (
    id               SERIAL PRIMARY KEY,
    reader_id        INTEGER NOT NULL REFERENCES readers(id) ON DELETE CASCADE,
    destination_name VARCHAR(500) NOT NULL,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reader_id, destination_name)
  )`;

  return NextResponse.json({ ok: true });
}
