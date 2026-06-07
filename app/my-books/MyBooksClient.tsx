'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FCPL_DESTINATIONS } from '@/lib/destinations';
import { INDIVIDUAL_MILESTONES } from '@/lib/milestones';
import MentionText from '@/app/components/MentionText';
import type { ScannedBook } from '@/app/components/BarcodeScannerModal';

const BarcodeScannerModal = dynamic(() => import('@/app/components/BarcodeScannerModal'), { ssr: false });

type Book = {
  id: number; title: string; author: string | null; cover_url: string | null;
  started_date: string | null; finished_date: string; rating: number | null; review: string | null;
};
type Destination = { id: number; name: string; visited_date: string };
type ReadingEntry = {
  id: number; title: string; author: string | null;
  isbn: string | null; cover_url: string | null;
  status: 'tbr' | 'reading'; added_date: string;
};

// ── Tracker helpers ─────────────────────────────────────────────────────────

function spineLabel(books: { title: string }[], n: number): string {
  const book = books[n - 1];
  if (!book) return `Book ${n}`;
  const t = book.title.trim();
  return t.length <= 13 ? t : t.slice(0, 12) + '…';
}
function spineFontSize(label: string): number {
  if (label.length <= 7) return 11;
  if (label.length <= 10) return 9;
  return 8;
}
function circleFill(n: number, logged: number): string {
  if (n > logged) return 'none';
  if (n < 20) return n <= 10 ? '#C8F0E5' : '#FDE9B2';
  return '#85D4BB';
}
function prizeLabel(prize: string | null | undefined, fallback: string, max: number): string {
  const s = prize?.trim() || fallback;
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}
function SpineLabel({ books, n, x, y, rotX, rotY, fill, weight = '600' }: {
  books: { title: string }[]; n: number;
  x: number; y: number; rotX: number; rotY: number;
  fill: string; weight?: string;
}) {
  const label = spineLabel(books, n);
  const fs = spineFontSize(label);
  return (
    <text x={x} y={y} textAnchor="middle" fontFamily="Arial, sans-serif"
      fontSize={fs} fontWeight={weight} fill={fill}
      transform={`rotate(-90,${rotX},${rotY})`}>
      {label}
    </text>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl leading-none transition-colors"
          style={{ color: n <= (hovered || value) ? '#f59e0b' : '#d1d5db' }}
        >★</button>
      ))}
      {value > 0 && (
        <button type="button" onClick={() => onChange(0)} className="text-xs text-gray-400 ml-1 hover:text-gray-600">clear</button>
      )}
    </div>
  );
}
function Stars({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return <span className="text-amber-400 text-sm">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>;
}
function CoverThumb({ url, title, size = 'md' }: { url: string | null; title: string; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-9 h-12' : 'w-10 h-14';
  if (!url) return null;
  return (
    <img src={url} alt={title} className={`${dim} object-cover rounded shadow-sm flex-shrink-0`}
      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
  );
}
function CameraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
    </svg>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function MyBooksClient({ name, readerNames = [] }: { readerId: number; name: string; readerNames?: string[] }) {
  const [tab, setTab] = useState<'progress' | 'books' | 'list' | 'destinations'>('progress');

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [startedDate, setStartedDate] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const reviewRef = useRef<HTMLTextAreaElement>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showNextPrompt, setShowNextPrompt] = useState(false);

  const [showScanner, setShowScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState<'book' | 'tbr'>('book');

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destLoading, setDestLoading] = useState(true);
  const [destName, setDestName] = useState('');
  const [destDate, setDestDate] = useState(new Date().toISOString().split('T')[0]);
  const [destSubmitting, setDestSubmitting] = useState(false);
  const [destSuccess, setDestSuccess] = useState('');
  const [destError, setDestError] = useState('');
  const [wishes, setWishes] = useState<string[]>([]);
  const [showBrowse, setShowBrowse] = useState(false);

  const [readingList, setReadingList] = useState<ReadingEntry[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [tbrTitle, setTbrTitle] = useState('');
  const [tbrAuthor, setTbrAuthor] = useState('');
  const [tbrCoverUrl, setTbrCoverUrl] = useState('');
  const [tbrSubmitting, setTbrSubmitting] = useState(false);
  const [tbrSuccess, setTbrSuccess] = useState('');
  const [tbrError, setTbrError] = useState('');

  const [daysCount, setDaysCount] = useState(0);
  const [loggedToday, setLoggedToday] = useState(false);
  const [readingDays, setReadingDays] = useState<string[]>([]);
  const [dayLogging, setDayLogging] = useState(false);
  const [showPastDay, setShowPastDay] = useState(false);
  const [pastDay, setPastDay] = useState('');
  const [pastDayLogging, setPastDayLogging] = useState(false);

  // Prizes (for tracker labels)
  const [prize5, setPrize5] = useState<string | null>(null);
  const [prize10, setPrize10] = useState<string | null>(null);
  const [prize15, setPrize15] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/books?mine=true');
    if (res.ok) setBooks(await res.json());
    setLoading(false);
  }, []);
  const fetchDestinations = useCallback(async () => {
    setDestLoading(true);
    const res = await fetch('/api/destinations?mine=true');
    if (res.ok) setDestinations(await res.json());
    setDestLoading(false);
  }, []);
  const fetchWishes = useCallback(async () => {
    const res = await fetch('/api/destination-wishes');
    if (res.ok) setWishes(await res.json());
  }, []);
  const fetchReadingList = useCallback(async () => {
    setListLoading(true);
    const res = await fetch('/api/reading-list');
    if (res.ok) setReadingList(await res.json());
    setListLoading(false);
  }, []);
  const fetchReadingDays = useCallback(async () => {
    const res = await fetch('/api/reading-days');
    if (res.ok) {
      const data = await res.json();
      setDaysCount(data.count);
      setLoggedToday(data.loggedToday);
      setReadingDays(data.days ?? []);
    }
  }, []);
  const fetchPrizes = useCallback(async () => {
    const res = await fetch('/api/readers');
    if (res.ok) {
      const data = await res.json();
      setPrize5(data.prize_5 ?? null);
      setPrize10(data.prize_10 ?? null);
      setPrize15(data.prize_15 ?? null);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
    fetchDestinations();
    fetchWishes();
    fetchReadingList();
    fetchReadingDays();
    fetchPrizes();
  }, [fetchBooks, fetchDestinations, fetchWishes, fetchReadingList, fetchReadingDays, fetchPrizes]);

  async function handleLogDay() {
    setDayLogging(true);
    const res = await fetch('/api/reading-days', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setDaysCount(data.count);
      setLoggedToday(true);
      setReadingDays(data.days ?? []);
    }
    setDayLogging(false);
  }

  async function handleLogPastDay() {
    if (!pastDay) return;
    setPastDayLogging(true);
    const res = await fetch('/api/reading-days', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: pastDay }),
    });
    if (res.ok) {
      const data = await res.json();
      setDaysCount(data.count);
      setReadingDays(data.days ?? []);
      setPastDay('');
      setShowPastDay(false);
    }
    setPastDayLogging(false);
  }

  const handleScanDetected = useCallback((book: ScannedBook) => {
    if (scanTarget === 'book') {
      setTitle(book.title); setAuthor(book.author ?? ''); setCoverUrl(book.cover_url ?? '');
    } else {
      setTbrTitle(book.title); setTbrAuthor(book.author ?? ''); setTbrCoverUrl(book.cover_url ?? '');
    }
    setShowScanner(false);
  }, [scanTarget]);

  function openScanner(target: 'book' | 'tbr') { setScanTarget(target); setShowScanner(true); }

  function prefillFromReading(entry: ReadingEntry) {
    setTitle(entry.title); setAuthor(entry.author ?? ''); setCoverUrl(entry.cover_url ?? '');
    setTab('books');
    setDate(new Date().toISOString().split('T')[0]);
    fetch(`/api/reading-list/${entry.id}`, { method: 'DELETE' });
    fetchReadingList();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(''); setSuccess('');
    const payload = { title, author: author || null, cover_url: coverUrl || null, started_date: startedDate || null, finished_date: date, rating: rating || null, review: review || null };
    const res = editingBookId
      ? await fetch(`/api/books/${editingBookId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/books', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      setTitle(''); setAuthor(''); setCoverUrl('');
      setStartedDate('');
      setDate(new Date().toISOString().split('T')[0]);
      setRating(0); setReview('');
      if (editingBookId) {
        setEditingBookId(null);
        setSuccess('Changes saved!');
      } else {
        setSuccess('Book logged!');
        setShowNextPrompt(true);
      }
      fetchBooks();
    } else {
      const data = await res.json();
      setError(data.error ?? 'Something went wrong.');
    }
    setSubmitting(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('Remove this book?')) return;
    await fetch(`/api/books/${id}`, { method: 'DELETE' });
    fetchBooks();
  }

  async function handleDeleteDay(date: string) {
    const res = await fetch(`/api/reading-days?date=${date}`, { method: 'DELETE' });
    if (res.ok) {
      const data = await res.json();
      setDaysCount(data.count);
      setLoggedToday(data.loggedToday);
      setReadingDays(data.days ?? []);
    }
  }

  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  function handleEdit(b: Book) {
    setEditingBookId(b.id);
    setTitle(b.title);
    setAuthor(b.author ?? '');
    setCoverUrl(b.cover_url ?? '');
    setStartedDate(b.started_date ?? '');
    setDate(b.finished_date);
    setRating(b.rating ?? 0);
    setReview(b.review ?? '');
    setSuccess(''); setError('');
    setTab('books');
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  function cancelEdit() {
    setEditingBookId(null);
    setTitle(''); setAuthor(''); setCoverUrl('');
    setStartedDate('');
    setDate(new Date().toISOString().split('T')[0]);
    setRating(0); setReview('');
    setSuccess(''); setError('');
  }

  async function toggleWish(name: string) {
    const next = wishes.includes(name) ? wishes.filter(w => w !== name) : [...wishes, name];
    setWishes(next);
    await fetch('/api/destination-wishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  }

  async function handleDestSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDestSubmitting(true); setDestError(''); setDestSuccess('');
    const res = await fetch('/api/destinations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: destName, visited_date: destDate }),
    });
    if (res.ok) {
      setDestName(''); setDestDate(new Date().toISOString().split('T')[0]);
      setDestSuccess('Destination logged!');
      fetchDestinations();
      setTimeout(() => setDestSuccess(''), 3000);
    } else {
      const data = await res.json();
      setDestError(data.error ?? 'Something went wrong.');
    }
    setDestSubmitting(false);
  }

  async function handleDestDelete(id: number) {
    if (!confirm('Remove this destination?')) return;
    await fetch(`/api/destinations/${id}`, { method: 'DELETE' });
    fetchDestinations();
  }

  async function handleTbrSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTbrSubmitting(true); setTbrError(''); setTbrSuccess('');
    const res = await fetch('/api/reading-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: tbrTitle, author: tbrAuthor || null, cover_url: tbrCoverUrl || null }),
    });
    if (res.ok) {
      setTbrTitle(''); setTbrAuthor(''); setTbrCoverUrl('');
      setTbrSuccess('Added to your list!');
      fetchReadingList();
      setTimeout(() => setTbrSuccess(''), 3000);
    } else {
      const data = await res.json();
      setTbrError(data.error ?? 'Something went wrong.');
    }
    setTbrSubmitting(false);
  }

  async function handleStatusUpdate(id: number, status: 'tbr' | 'reading') {
    await fetch(`/api/reading-list/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    fetchReadingList();
  }
  async function handleListDelete(id: number) {
    await fetch(`/api/reading-list/${id}`, { method: 'DELETE' });
    fetchReadingList();
  }

  const nowReading = readingList.filter(e => e.status === 'reading');
  const tbrList = readingList.filter(e => e.status === 'tbr');
  const label5 = prizeLabel(prize5, 'Level 1 Prize!', 18);
  const label10 = prizeLabel(prize10, 'Level 2 Prize!', 16);

  function handleReviewChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setReview(val);
    const cursor = e.target.selectionStart;
    if (cursor === null) { setMentionStart(null); return; }
    const textBefore = val.slice(0, cursor);
    const atMatch = textBefore.match(/@(\w*)$/);
    if (atMatch) {
      setMentionStart(cursor - atMatch[0].length);
      setMentionQuery(atMatch[1]);
    } else {
      setMentionStart(null);
      setMentionQuery('');
    }
  }

  function insertMention(selectedName: string) {
    if (mentionStart === null) return;
    const before = review.slice(0, mentionStart);
    const after = review.slice(mentionStart + 1 + mentionQuery.length);
    setReview(before + '@' + selectedName + ' ' + after);
    setMentionStart(null);
    setMentionQuery('');
    setTimeout(() => reviewRef.current?.focus(), 0);
  }

  const mentionMatches = mentionStart !== null
    ? readerNames.filter(n => n !== name && n.toLowerCase().startsWith(mentionQuery.toLowerCase()))
    : [];

  return (
    <div className="px-5 py-8 max-w-3xl mx-auto">
      {showScanner && <BarcodeScannerModal onDetected={handleScanDetected} onClose={() => setShowScanner(false)} />}

      <div className="no-print flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-900">{name}&rsquo;s Activity</h1>
          <p className="text-gray-400 text-sm">
            {books.length} {books.length === 1 ? 'book' : 'books'} · {destinations.length} destinations
            {readingList.length > 0 && ` · ${readingList.length} on list`}
          </p>
        </div>
      </div>

      {/* Reading days strip */}
      <div className="no-print bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 mb-1">Reading days — {daysCount} / 20</p>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, daysCount / 20 * 100)}%` }} />
            </div>
          </div>
          {loggedToday ? (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg flex-shrink-0">✓ Logged today!</span>
          ) : (
            <button onClick={handleLogDay} disabled={dayLogging}
              className="text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 px-4 py-2 rounded-xl transition-all flex-shrink-0">
              {dayLogging ? 'Logging…' : '📖 I Read Today!'}
            </button>
          )}
        </div>
        {showPastDay ? (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={pastDay}
              max={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
              onChange={e => setPastDay(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button onClick={handleLogPastDay} disabled={pastDayLogging || !pastDay}
              className="text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-1.5 rounded-lg transition-colors">
              {pastDayLogging ? 'Logging…' : 'Log day'}
            </button>
            <button onClick={() => { setShowPastDay(false); setPastDay(''); }}
              className="text-xs text-gray-400 hover:text-gray-600">cancel</button>
          </div>
        ) : (
          <button onClick={() => setShowPastDay(true)}
            className="mt-2 text-xs text-gray-400 hover:text-emerald-700 transition-colors">
            + missed logging a day?
          </button>
        )}
        {readingDays.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Logged days — tap × to remove</p>
            <div className="flex flex-wrap gap-1.5">
              {readingDays.map(d => (
                <span key={d} className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full">
                  {new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  <button onClick={() => handleDeleteDay(d)} className="text-emerald-400 hover:text-red-500 leading-none" title="Remove day">×</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="no-print flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {(['progress', 'books', 'list', 'destinations'] as const).map(t => {
          const labels: Record<string, string> = {
            progress: 'Progress',
            books: `Bookshelf (${books.length})`,
            list: `Reading List${readingList.length > 0 ? ` (${readingList.length})` : ''}`,
            destinations: `Places (${destinations.length})`,
          };
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${tab === t ? 'bg-white text-emerald-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ── READING LIST TAB ── */}
      {tab === 'list' && (
        <>
          {nowReading.length > 0 && (
            <div className="mb-6">
              <h2 className="font-bold text-emerald-900 mb-3">Now Reading</h2>
              <div className="space-y-2">
                {nowReading.map(entry => (
                  <div key={entry.id} className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
                    <CoverThumb url={entry.cover_url} title={entry.title} size="sm" />
                    {!entry.cover_url && <span className="text-xl flex-shrink-0">📖</span>}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-emerald-900 text-sm leading-snug">{entry.title}</p>
                      {entry.author && <p className="text-xs text-emerald-700 mt-0.5">{entry.author}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => prefillFromReading(entry)}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-200 hover:border-emerald-400 px-2.5 py-1 rounded-lg transition-colors">
                        Mark Finished
                      </button>
                      <button onClick={() => handleStatusUpdate(entry.id, 'tbr')} className="text-xs text-gray-400 hover:text-gray-600" title="Move back to TBR">↩</button>
                      <button onClick={() => handleListDelete(entry.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none" title="Remove">×</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="font-bold text-emerald-900 mb-4">Add a book to your list</h2>
            <form onSubmit={handleTbrSubmit} className="space-y-4">
              <div className="flex gap-3 items-start">
                {tbrCoverUrl && <img src={tbrCoverUrl} alt="" className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0 mt-6" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-semibold text-gray-600">Title</label>
                      <button type="button" onClick={() => openScanner('tbr')} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors">
                        <CameraIcon />Scan barcode
                      </button>
                    </div>
                    <input type="text" value={tbrTitle} onChange={e => setTbrTitle(e.target.value)} placeholder="Book title" required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Author (optional)</label>
                    <input type="text" value={tbrAuthor} onChange={e => setTbrAuthor(e.target.value)} placeholder="Who wrote it?" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                </div>
              </div>
              {tbrError && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{tbrError}</p>}
              {tbrSuccess && <p className="text-emerald-700 text-sm bg-emerald-50 rounded-lg px-3 py-2">{tbrSuccess}</p>}
              <button type="submit" disabled={tbrSubmitting || !tbrTitle} className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-colors">
                {tbrSubmitting ? 'Adding…' : 'Add to List'}
              </button>
            </form>
          </div>
          {listLoading ? <p className="text-gray-400 text-sm">Loading...</p>
            : tbrList.length === 0 && nowReading.length === 0 ? <p className="text-gray-400 text-sm">Your list is empty — add a book above or tap &ldquo;+ Add to TBR&rdquo; on a review!</p>
            : tbrList.length > 0 && (
              <>
                <h2 className="font-bold text-emerald-900 mb-3">To Be Read ({tbrList.length})</h2>
                <div className="space-y-2">
                  {tbrList.map(entry => (
                    <div key={entry.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
                      <CoverThumb url={entry.cover_url} title={entry.title} size="sm" />
                      {!entry.cover_url && <span className="text-lg text-gray-300 flex-shrink-0">📚</span>}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm leading-snug">{entry.title}</p>
                        {entry.author && <p className="text-xs text-gray-400 mt-0.5">{entry.author}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => handleStatusUpdate(entry.id, 'reading')} className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors">Start Reading</button>
                        <button onClick={() => handleListDelete(entry.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none" title="Remove">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
        </>
      )}

      {/* ── DESTINATIONS TAB ── */}
      {tab === 'destinations' && (
        <>
          {/* Wish list */}
          {wishes.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">⭐ Want to visit ({wishes.length})</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {wishes.map(w => {
                  const alreadyVisited = destinations.some(d => d.name === w);
                  return (
                    <div key={w} className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full pl-3 pr-2 py-1">
                      <span className="text-xs font-semibold text-amber-800 leading-none">{w}</span>
                      {alreadyVisited
                        ? <span className="text-xs text-emerald-600 font-bold">✓</span>
                        : <button onClick={() => { setDestName(w); }} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold leading-none px-1.5 py-0.5 rounded" title="Log visit">+ Log</button>
                      }
                      <button onClick={() => toggleWish(w)} className="text-amber-300 hover:text-amber-500 text-sm leading-none" title="Remove from wishlist">×</button>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-amber-700">Tap <strong>+ Log</strong> on a chip when you visit — it fills in the form below.</p>
            </div>
          )}

          {/* Log visit form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="font-bold text-emerald-900 mb-4">Log an FCPL destination visit</h2>
            <form onSubmit={handleDestSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Destination</label>
                <select value={destName} onChange={e => setDestName(e.target.value)} required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                  <option value="">Select a destination...</option>
                  {FCPL_DESTINATIONS.map(group => (
                    <optgroup key={group.region} label={group.region}>
                      {group.places.map(place => (<option key={place} value={place}>{place}</option>))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Date visited</label>
                <input type="date" value={destDate} max={new Date().toISOString().split('T')[0]} onChange={e => setDestDate(e.target.value)} required className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              {destError && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{destError}</p>}
              {destSuccess && <p className="text-emerald-700 text-sm bg-emerald-50 rounded-lg px-3 py-2">{destSuccess}</p>}
              <button type="submit" disabled={destSubmitting || !destName} className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-colors">
                {destSubmitting ? 'Saving...' : 'Log Visit'}
              </button>
            </form>
          </div>

          {/* Visited list */}
          {destLoading ? <p className="text-gray-400 text-sm">Loading...</p>
            : destinations.length === 0 ? <p className="text-gray-400 text-sm">No visits yet — log one above!</p>
            : (
              <div className="space-y-2 mb-6">
                {destinations.map(d => (
                  <div key={d.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{d.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(d.visited_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <button onClick={() => handleDestDelete(d.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none flex-shrink-0" title="Remove">×</button>
                  </div>
                ))}
              </div>
            )}

          {/* Browse all destinations */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-3 text-xs text-amber-800">
            ⭐ Tap a destination to add it to your wish list.
          </div>
          <button onClick={() => setShowBrowse(b => !b)}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 mb-3">
            {showBrowse ? '▾' : '▸'} Browse all FCPL destinations
          </button>
          {showBrowse && (
            <div className="space-y-4">
              {FCPL_DESTINATIONS.map(group => (
                <div key={group.region}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{group.region}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.places.map(place => {
                      const starred = wishes.includes(place);
                      const visited = destinations.some(d => d.name === place);
                      return (
                        <button key={place} onClick={() => toggleWish(place)}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                            visited ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : starred ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50'
                          }`}>
                          <span>{visited ? '✓' : starred ? '⭐' : '☆'}</span>
                          {place}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── BOOKS TAB ── */}
      {tab === 'books' && (
        <>
          {nowReading.length > 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 mb-4 flex items-center gap-3 shadow-sm">
              <span className="text-lg flex-shrink-0">📖</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium">Currently reading</p>
                <p className="text-sm font-semibold text-gray-800 truncate">{nowReading[0].title}</p>
              </div>
              <button onClick={() => setTab('list')} className="text-xs text-emerald-700 hover:underline flex-shrink-0">change</button>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
              <span className="text-lg flex-shrink-0">📚</span>
              <p className="text-sm text-gray-500 flex-1">Not reading anything yet?{' '}
                <button onClick={() => setTab('list')} className="text-emerald-700 font-semibold hover:underline">Add a book to your reading list →</button>
              </p>
            </div>
          )}
          <div ref={formRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="font-bold text-emerald-900 mb-4">{editingBookId ? 'Edit book' : 'Log a finished book'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3 items-start">
                {coverUrl && <img src={coverUrl} alt="" className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0 mt-6" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-semibold text-gray-600">Book title</label>
                      <button type="button" onClick={() => openScanner('book')} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors">
                        <CameraIcon />Scan barcode
                      </button>
                    </div>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="What did you read?" required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Author (optional)</label>
                    <input type="text" value={author} onChange={e => setAuthor(e.target.value)} placeholder="Who wrote it?" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 flex-wrap">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Date started <span className="font-normal text-gray-400">(optional)</span></label>
                  <input type="date" value={startedDate} max={date || new Date().toISOString().split('T')[0]} onChange={e => setStartedDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Date finished</label>
                  <input type="date" value={date} max={new Date().toISOString().split('T')[0]} onChange={e => setDate(e.target.value)} required className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Rating (optional)</label>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Short review (optional)</label>
                <div className="relative">
                  <textarea
                    ref={reviewRef}
                    value={review}
                    onChange={handleReviewChange}
                    onKeyDown={e => { if (e.key === 'Escape') { setMentionStart(null); setMentionQuery(''); } }}
                    placeholder="What did you think? Would you recommend it?"
                    rows={2}
                    maxLength={500}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  />
                  {mentionMatches.length > 0 && (
                    <ul className="absolute z-20 left-0 right-0 bg-white border border-emerald-200 rounded-lg shadow-lg mt-0.5 overflow-hidden">
                      {mentionMatches.map(n => (
                        <li key={n}>
                          <button
                            type="button"
                            onMouseDown={e => { e.preventDefault(); insertMention(n); }}
                            className="w-full text-left px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
                          >
                            @{n}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">Type @ to tag a friend!</p>
              </div>
              {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              {success && <p className="text-emerald-700 text-sm bg-emerald-50 rounded-lg px-3 py-2">{success}</p>}
              <div className="flex items-center gap-3">
                <button type="submit" disabled={submitting || !title} className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-colors">
                  {submitting ? 'Saving...' : editingBookId ? 'Save Changes' : 'Log Book'}
                </button>
                {editingBookId && (
                  <button type="button" onClick={cancelEdit} className="text-sm text-gray-500 hover:text-gray-700">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
          {showNextPrompt && tbrList.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-emerald-900">Nice work! What will you read next? 📚</p>
                <button onClick={() => setShowNextPrompt(false)} className="text-xs text-gray-400 hover:text-gray-600">dismiss</button>
              </div>
              <div className="space-y-2">
                {tbrList.map(entry => (
                  <div key={entry.id} className="bg-white rounded-xl border border-emerald-100 px-4 py-3 flex items-center gap-3">
                    <CoverThumb url={entry.cover_url} title={entry.title} size="sm" />
                    {!entry.cover_url && <span className="text-lg text-gray-300 flex-shrink-0">📚</span>}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm leading-snug">{entry.title}</p>
                      {entry.author && <p className="text-xs text-gray-400">{entry.author}</p>}
                    </div>
                    <button
                      onClick={async () => { await handleStatusUpdate(entry.id, 'reading'); setShowNextPrompt(false); }}
                      className="text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    >
                      Start reading
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {loading ? <p className="text-gray-400 text-sm">Loading...</p>
            : books.length === 0 ? <p className="text-gray-400 text-sm">No books yet — log your first one above!</p>
            : (
              <div className="space-y-3">
                {books.map((b, i) => (
                  <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-start gap-3">
                    {b.cover_url ? (
                      <img src={b.cover_url} alt={b.title} className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
                        onError={e => { const img = e.target as HTMLImageElement; img.style.display = 'none'; img.nextElementSibling?.classList.remove('hidden'); }} />
                    ) : null}
                    <span className={`text-2xl font-extrabold text-emerald-200 w-8 flex-shrink-0 text-center leading-none pt-1 ${b.cover_url ? 'hidden' : ''}`}>{books.length - i}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 text-sm">{b.title}</span>
                        <Stars rating={b.rating} />
                      </div>
                      {b.author && <p className="text-xs text-gray-500 mt-0.5">{b.author}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                    {b.started_date && <>{new Date(b.started_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → </>}
                    {new Date(b.finished_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                      {b.review && <p className="text-xs text-gray-500 mt-1 italic">&ldquo;<MentionText text={b.review} />&rdquo;</p>}
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleEdit(b)} className="text-gray-300 hover:text-emerald-600 text-base leading-none" title="Edit">✎</button>
                      <button onClick={() => handleDelete(b.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none" title="Remove">×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </>
      )}

      {/* ── PROGRESS TAB ── */}
      {tab === 'progress' && (
        <div className="space-y-5">

          {/* Hero stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-extrabold text-emerald-800">{books.length}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">books</p>
            </div>
            <div className="bg-sky-50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-extrabold text-sky-800">{daysCount}</p>
              <p className="text-xs text-sky-600 font-semibold mt-0.5">reading days</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 text-center">
              <p className="text-3xl font-extrabold text-amber-800">{destinations.length}</p>
              <p className="text-xs text-amber-600 font-semibold mt-0.5">places visited</p>
            </div>
          </div>

          {/* Prize milestones */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-emerald-900 mb-4">Prize Progress</h3>
            <div className="space-y-5">
              {INDIVIDUAL_MILESTONES.map(m => {
                const reached = books.length >= m.books;
                const pct = Math.min(100, (books.length / m.books) * 100);
                const prizeWish = m.books === 5 ? prize5 : m.books === 10 ? prize10 : prize15;
                return (
                  <div key={m.books}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-bold text-gray-700">{m.label} — {m.books} books</span>
                      {reached
                        ? <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">&#x2713; Reached!</span>
                        : <span className="text-xs text-gray-400">{m.books - books.length} to go</span>
                      }
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${reached ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {prizeWish && (
                      <p className="text-xs mt-1.5 text-amber-700">
                        <span className="font-semibold">My wish:</span> {prizeWish}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reading days */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-emerald-900">Reading Days</h3>
              <span className="text-sm font-bold text-emerald-700">{daysCount} / 20</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                <div key={n} className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  n <= daysCount
                    ? n === 20 ? 'bg-emerald-600 text-white ring-2 ring-emerald-300' : 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-100 text-gray-300'
                }`}>
                  {n}
                </div>
              ))}
            </div>
            {daysCount >= 20 && (
              <p className="text-sm text-emerald-700 font-bold mt-3">FCPL challenge complete!</p>
            )}
          </div>

          {/* Recent reads */}
          {books.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-emerald-900 mb-3">Recent Reads</h3>
              <div className="space-y-3">
                {books.slice().reverse().slice(0, 5).map(b => (
                  <div key={b.id} className="flex items-center gap-3">
                    {b.cover_url
                      ? <img src={b.cover_url} alt="" className="w-8 h-11 object-cover rounded shadow-sm flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      : <div className="w-8 h-11 rounded bg-gray-100 flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{b.title}</p>
                      {b.author && <p className="text-xs text-gray-400 truncate">{b.author}</p>}
                      {b.rating ? <Stars rating={b.rating} /> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Places visited */}
          {destinations.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-emerald-900 mb-3">Places Visited</h3>
              <div className="flex flex-wrap gap-2">
                {destinations.map(d => (
                  <span key={d.id} className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Print link */}
          <div className="text-center pb-2">
            <a href="/tracker" target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-emerald-700 transition-colors">
              Open printable tracker &#x2192;
            </a>
          </div>

        </div>
      )}
    </div>
  );
}