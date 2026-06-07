'use client';

import Link from 'next/link';

export default function LogoutButton({ name }: { name: string }) {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/profile"
        className="text-sm text-white/90 hover:text-white font-semibold px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors"
      >
        {name}
      </Link>
      <button
        onClick={handleLogout}
        className="text-xs text-white/60 hover:text-white/90 transition-colors"
        title="Log out"
      >
        (log out)
      </button>
    </div>
  );
}
