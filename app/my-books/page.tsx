import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import sql from '@/lib/db';
import MyBooksClient from './MyBooksClient';

export default async function MyBooksPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const rows = await sql`SELECT name FROM readers ORDER BY name`;
  const readerNames: string[] = rows.map((r: { name: string }) => r.name);
  return <MyBooksClient readerId={session.readerId} name={session.name} readerNames={readerNames} />;
}
