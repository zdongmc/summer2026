import Link from 'next/link';
import { GROUP_MILESTONES } from '@/lib/milestones';
import ProgramTimeline from '@/app/components/ProgramTimeline';

const PROGRAMS = [
  {
    name: 'Montgomery County Public Libraries',
    short: 'MCPL',
    dates: 'June 13 – August 21, 2026',
    border: '#2563eb',
    bg: '#dbeafe',
    textColor: '#1e3a8a',
    prizes: [
      'Read 3 weeks → Nationals game tickets + ice cream',
      'Read 6 weeks → Free book + system raffle entry',
      'Free book just for signing up',
    ],
    url: 'https://www.montgomerycountymd.gov/montgomery-county-public-libraries/events-programs-library/participate-program-library/summer-reading-challenge',
  },
  {
    name: 'White House Summer Reading Challenge',
    short: 'White House',
    dates: 'June 1 – September 4, 2026',
    border: '#7c3aed',
    bg: '#f5f3ff',
    textColor: '#26215C',
    prizes: [
      'Read 12 books → personalized certificate + prize',
      'Raffle entry for a White House visit',
      'Submit log by September 5',
      'Log start AND finish date for each book (required)',
    ],
    url: 'https://whitehouse.gov/read',
  },
  {
    name: 'Frederick County Public Libraries',
    short: 'FCPL',
    dates: 'June 1 – August 16, 2026',
    border: '#f59e0b',
    bg: '#fffbeb',
    textColor: '#633806',
    prizes: [
      'Read 20+ days → raffle tickets for big prizes',
      'Visit FCPL destinations for bonus tickets',
      'Prizes: American Girl Doll, LEGO, Chromebook',
    ],
    url: 'https://www.fcpl.org/participate/summer-challenge',
  },
];

const KEY_DATES = [
  { date: 'June 1',     action: 'Reading Club begins — books finished from this date count toward prizes',     tag: 'Club',       tagBg: '#dcfce7', tagText: '#14532d' },
  { date: 'June 13',    action: 'MCPL begins · Kickoff at Damascus Rec Center, 11am–2pm', tag: 'MCPL',        tagBg: '#dbeafe', tagText: '#1e3a8a', url: 'https://mcpl.libnet.info/event/16445594' },
  { date: 'July 15',    action: 'FCPL ticket submission deadline (drawing July 16)',        tag: 'FCPL',        tagBg: '#fef3c7', tagText: '#78350f' },
  { date: 'August 15',  action: 'FCPL final ticket deadline (grand prize drawing Aug 16)', tag: 'FCPL',        tagBg: '#fef3c7', tagText: '#78350f' },
  { date: 'August 21',  action: 'MCPL challenge ends',                                     tag: 'MCPL',        tagBg: '#dbeafe', tagText: '#1e3a8a' },
  { date: 'September 4', action: 'Reading Club ends · White House challenge ends',          tag: 'Club',       tagBg: '#dcfce7', tagText: '#14532d' },
  { date: 'September 5', action: 'Submit reading log at whitehouse.gov/read',              tag: 'White House', tagBg: '#ede9fe', tagText: '#3730a3' },
];

export default function Home() {
  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">

      <div className="text-center mb-12">
        <p className="text-emerald-600 font-semibold text-sm mb-2 tracking-wide uppercase">Summer 2026</p>
        <h1 className="text-4xl font-extrabold text-emerald-900 mb-3">
          Summer Reading Club 2026
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-3">
          Adelaide is inviting her friends to join her Summer Reading Club — earn individual prizes and unlock group celebrations for everyone.
        </p>
        <p className="text-emerald-700 font-semibold text-base mb-8">June 1 – September 4, 2026</p>

      </div>

      <h2 className="text-xl font-bold text-emerald-900 mb-4">The Challenge</h2>
      <div className="grid sm:grid-cols-2 gap-5 mb-10">

        <div className="rounded-2xl bg-amber-50 border-t-4 border-amber-400 p-6 shadow-sm">
          <div className="text-3xl mb-3">🎀</div>
          <h3 className="font-extrabold text-amber-900 text-lg mb-2">Individual Goals</h3>
          <ul className="space-y-2.5">
            <li className="text-sm text-amber-800 flex gap-2">
              <span className="text-amber-500 font-bold">✓</span>
              <span>Read <strong>5 books</strong> → Level 1 prize</span>
            </li>
            <li className="text-sm text-amber-800 flex gap-2">
              <span className="text-amber-500 font-bold">✓</span>
              <span>Read <strong>10 books</strong> → Level 2 prize</span>
            </li>
            <li className="text-sm text-amber-800 flex gap-2">
              <span className="text-amber-500 font-bold">✓</span>
              <span>Read <strong>15 books</strong> → Level 3 prize</span>
            </li>
          </ul>
          <p className="text-xs text-amber-700 mt-4 bg-amber-100 rounded-lg px-3 py-2">
            Each girl picks her prize wishes.
          </p>
        </div>

        <div className="rounded-2xl bg-sky-50 border-t-4 border-sky-400 p-6 shadow-sm">
          <div className="text-3xl mb-3">🎉</div>
          <h3 className="font-extrabold text-sky-900 text-lg mb-1">Group Goals</h3>
          <p className="text-sky-700 text-sm mb-3">Unlocked when <strong>every girl</strong> reaches the milestone</p>
          <ul className="space-y-2.5">
            {GROUP_MILESTONES.map(m => (
              <li key={m.label} className="text-sm text-sky-800">
                <div className="flex gap-2 items-baseline">
                  <span className="text-sky-500 font-bold">{m.icon}</span>
                  <strong>{m.label}</strong>
                </div>
                <p className="text-xs text-sky-600 ml-5">Everyone reads {m.books} books</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-emerald-900 text-white rounded-2xl p-6 mb-10 shadow-md">
        <h2 className="font-extrabold text-lg mb-4">Parent Agreement</h2>
        <p className="text-emerald-200 text-sm mb-4">
          By joining, parents agree to the following.
        </p>
        <ul className="space-y-3">
          <li className="flex gap-3 text-sm">
            <span className="text-emerald-400 font-bold mt-0.5">✓</span>
            <span>
              <strong>Purchase your daughter&rsquo;s individual prizes</strong> when she hits Level 1 (5 books), Level 2 (10 books), and Level 3 (15 books).
              She picks her prize wishes when she joins and can update them anytime — just make sure you're both on the same page before she hits a milestone.
            </span>
          </li>
          <li className="flex gap-3 text-sm">
              <span className="text-emerald-400 font-bold mt-0.5">💦</span>
              <span>
                <strong>Pool Party</strong> — Jojo will coordinate with parents on details and costs when every girl reads 12 books.
              </span>
            </li>
            <li className="flex gap-3 text-sm">
              <span className="text-emerald-400 font-bold mt-0.5">🧸</span>
              <span>
                <strong>Arcade Day at Round 1</strong> — Jojo will coordinate with parents when every girl reads 20 books.
                Each parent decides how much to give their daughter to spend.{' '}
                <a href="https://www.round1usa.com/locations/038ttc" target="_blank" rel="noreferrer"
                  className="underline text-emerald-300 hover:text-white">Browse Round 1 Towson →</a>
              </span>
            </li>
          <li className="flex gap-3 text-sm">
            <span className="text-emerald-400 font-bold mt-0.5">💬</span>
            <span>
              <strong>Join the parent WhatsApp group</strong> — updates, trip planning, and coordination with other parents.{' '}
              <a href="https://chat.whatsapp.com/GduClXIfuiGJlUzXUmcQD2?mode=gi_t" target="_blank" rel="noreferrer"
                className="underline text-emerald-300 hover:text-white">Join here →</a>
            </span>
          </li>
        </ul>
      </div>

      <h2 className="text-xl font-bold text-emerald-900 mb-1">Optional: Official Summer Reading Programs</h2>
      <p className="text-gray-500 text-sm mb-5">
        These free programs run alongside the group challenge — parents manage sign-ups and logging on their own.
        The same books count toward all of them.
        Jojo organizes FCPL destination visits — other parents are welcome to organize too.
      </p>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {PROGRAMS.map(p => (
          <div
            key={p.name}
            className="rounded-2xl p-5 shadow-sm"
            style={{ background: p.bg, borderTop: `4px solid ${p.border}` }}
          >
            <h3 className="font-bold text-sm mb-0.5" style={{ color: p.textColor }}>{p.name}</h3>
            <p className="text-xs font-semibold text-gray-400 mb-3">{p.dates}</p>
            <ul className="space-y-1 mb-4">
              {p.prizes.map(prize => (
                <li key={prize} className="text-xs text-gray-600 flex gap-1.5">
                  <span style={{ color: p.border }} className="font-bold flex-shrink-0">✓</span>
                  {prize}
                </li>
              ))}
            </ul>
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-white text-xs font-bold px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
              style={{ background: p.border }}
            >
              Sign up — {p.short}
            </a>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5 mb-8 shadow-sm" style={{ background: '#fffbeb', borderTop: '4px solid #f59e0b' }}>
        <h3 className="font-bold text-sm mb-2" style={{ color: '#633806' }}>📍 FCPL Destination Visits</h3>
        <p className="text-sm text-gray-600 mb-3">
          Frederick County Public Library runs a bonus program alongside reading: visit local destinations
          (parks, museums, rec centers) and each visit earns a raffle ticket — same as a reading day.
        </p>
        <p className="text-sm text-gray-600 mb-3">
          Jojo plans group destination trips for the club. Each girl can star the places she most wants
          to visit in <strong>My Activity → Destinations</strong>, and parents can see the full wish list
          on the group dashboard.
        </p>
        <p className="text-sm text-gray-600 mb-3">
          <strong>To log a visit:</strong> Jojo logs group trips for everyone at once from the Setup page.
          Individual families can also log their own visits in My Activity.
        </p>
        <p className="text-xs italic" style={{ color: '#92400e' }}>
          Destination visits count toward the FCPL raffle only — they don&rsquo;t affect the group challenge or individual prizes.
        </p>
      </div>

      <h3 className="text-base font-bold text-gray-700 mb-1">Program Timeline</h3>
      <p className="text-xs text-gray-400 mb-2">How our club overlaps with the three official programs</p>
      <ProgramTimeline />

      <h3 className="text-base font-bold text-gray-700 mb-3">Key Dates</h3>
      <div className="rounded-xl overflow-hidden shadow-sm mb-10 border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-4 py-2.5 font-semibold text-gray-600">Date</th>
              <th className="px-4 py-2.5 font-semibold text-gray-600">What to do</th>
              <th className="px-4 py-2.5 font-semibold text-gray-600">Program</th>
            </tr>
          </thead>
          <tbody>
            {KEY_DATES.map((row, i) => (
              <tr key={`${row.date}-${row.tag}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2.5 font-semibold text-gray-700 whitespace-nowrap">{row.date}</td>
                <td className="px-4 py-2.5 text-gray-600">
                  {row.url
                    ? <><a href={row.url} target="_blank" rel="noreferrer" className="underline hover:text-emerald-700">{row.action}</a></>
                    : row.action}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className="inline-block text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: row.tagBg, color: row.tagText }}
                  >
                    {row.tag}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
