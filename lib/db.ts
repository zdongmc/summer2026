import { neon } from '@neondatabase/serverless';
import type { NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not configured — add it to .env.local');
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

export default function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  return getSql()(strings, ...values);
}
