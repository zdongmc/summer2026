import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import LogoutButton from './components/LogoutButton';
import './globals.css';

export const metadata: Metadata = { title: "Adelaide's Summer Reading 2026" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-emerald-900 to-emerald-600">
        <div className="max-w-5xl mx-auto bg-white min-h-screen shadow-2xl flex flex-col">
          <header className="bg-gradient-to-r from-emerald-900 to-emerald-600 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
            <Link href="/" className="text-white font-bold text-lg tracking-tight">
              Summer Reading Club 2026
            </Link>
            <nav className="flex items-center gap-3 text-sm font-medium flex-wrap">
              {session ? (
                <>
                  <Link href="/" className="text-white/90 hover:text-white transition-colors">
                    Parent Guide
                  </Link>
                  <Link href="/dashboard" className="text-white/90 hover:text-white transition-colors">
                    Group Dashboard
                  </Link>
                  <Link href="/my-books" className="text-white/90 hover:text-white transition-colors">
                    My Activity
                  </Link>
                  <LogoutButton name={session.name} />
                </>
              ) : (
                <>
                  <Link href="/" className="text-white/90 hover:text-white transition-colors">
                    Parent Guide
                  </Link>
                  <Link
                    href="/login"
                    className="bg-white text-emerald-900 px-4 py-1.5 rounded-full font-semibold hover:bg-emerald-50 transition-colors"
                  >
                    Log In
                  </Link>
                </>
              )}
            </nav>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="bg-emerald-900 text-emerald-200 text-center py-4 text-xs">
            Clarksburg, MD &nbsp;·&nbsp; Summer 2026 &nbsp;·&nbsp; Managed by Jojo
          </footer>
        </div>
      </body>
    </html>
  );
}
