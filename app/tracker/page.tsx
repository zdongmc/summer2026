import { getSession } from '@/lib/auth';
import PrintButton from '@/app/components/PrintButton';
import sql from '@/lib/db';

type SpineBook = { title: string };

function spineLabel(books: SpineBook[], n: number): string {
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
  books: SpineBook[]; n: number;
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

export default async function TrackerPage() {
  const session = await getSession();
  const readerName = session?.name ?? null;

  let books: SpineBook[] = [];
  let daysLogged = 0;
  let prize5: string | null = null;
  let prize10: string | null = null;
  let destRows_data: { name: string }[] = [];

  if (session) {
    try {
      books = await sql`
        SELECT title FROM books
        WHERE reader_id = ${session.readerId}
        ORDER BY finished_date ASC, created_at ASC
        LIMIT 20
      ` as SpineBook[];
      const [daysRow] = await sql`
        SELECT COUNT(*)::int AS count FROM reading_days WHERE reader_id = ${session.readerId}
      `;
      daysLogged = daysRow?.count ?? 0;

      const [prizeRow] = await sql`
        SELECT prize_5, prize_10, prize_15 FROM readers WHERE id = ${session.readerId}
      `;
      prize5 = prizeRow?.prize_5 ?? null;
      prize10 = prizeRow?.prize_10 ?? null;
      destRows_data = await sql`
        SELECT name FROM destinations WHERE reader_id = ${session.readerId} ORDER BY visited_date ASC
      `;
    } catch {
      // DB not yet set up — show empty tracker
    }
  }

  const label5 = prizeLabel(prize5, 'Level 1 Prize!', 18);
  const label10 = prizeLabel(prize10, 'Level 2 Prize!', 16);

  const visitedPlaces = destRows_data.slice(0, 10);
  const placeRows = Math.ceil(Math.max(visitedPlaces.length, 1) / 2);
  const placesStartY = 590;
  const footerSepY = placesStartY + placeRows * 22 + 16;
  const svgHeight = footerSepY + 32;

  function placeLabel(name: string): string {
    return name.length > 26 ? name.slice(0, 25) + '…' : name;
  }

  return (
    <div className="px-5 py-8 max-w-3xl mx-auto print:p-0 print:max-w-none">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-900">Printable Reading Tracker</h1>
          <p className="text-gray-400 text-sm">
            {readerName
              ? `Printing tracker for ${readerName}`
              : 'Color in a book spine for every book. A circle for every reading day.'}
          </p>
        </div>
        <PrintButton />
      </div>
      <p className="text-xs text-gray-400 mb-6 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 print:hidden">
        Set your printer to <strong>landscape orientation</strong> for best results.
      </p>

      <div className="flex justify-center print:block print:w-full">
        <svg width="680" viewBox={`0 0 680 ${svgHeight}`} role="img" xmlns="http://www.w3.org/2000/svg" className="max-w-full border border-gray-100 rounded-lg shadow-sm print:border-0 print:shadow-none">
          <title>Summer Reading Tracker 2026</title>
          <rect x="0" y="0" width="680" height="80" fill="#E1F5EE"/>
          <rect x="0" y="74" width="680" height="6" fill="#1D9E75"/>
          {readerName ? (
            <>
              <text x="340" y="22" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#0F6E56">My Summer Reading Adventure 2026</text>
              <text x="340" y="52" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="800" fill="#085041">{readerName}</text>
            </>
          ) : (
            <>
              <text x="340" y="32" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="700" fill="#085041">My Summer Reading Adventure 2026</text>
              <text x="340" y="58" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="13" fill="#0F6E56">Color in a book spine every day you read! Reach the milestones to earn your prizes.</text>
            </>
          )}

          <text x="40" y="105" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" fill="#5F5E5A">MY BOOKSHELF</text>

          {/* ── Row 1: Books 1–10 ── */}
          <rect x="30" y="200" width="620" height="12" rx="3" fill="#B4B2A9"/><rect x="28" y="196" width="4" height="20" rx="2" fill="#888780"/><rect x="648" y="196" width="4" height="20" rx="2" fill="#888780"/>

          <rect x="38" y="115" width="52" height="85" rx="4" fill="#EEEDFE" stroke="#AFA9EC" strokeWidth="1.5"/><text x="64" y="130" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fill="#AFA9EC">1</text>
          <SpineLabel books={books} n={1} x={64} y={182} rotX={64} rotY={158} fill="#534AB7" />

          <rect x="98" y="118" width="52" height="82" rx="4" fill="#E1F5EE" stroke="#5DCAA5" strokeWidth="1.5"/><text x="124" y="133" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fill="#5DCAA5">2</text>
          <SpineLabel books={books} n={2} x={124} y={183} rotX={124} rotY={158} fill="#0F6E56" />

          <rect x="158" y="112" width="52" height="88" rx="4" fill="#FAECE7" stroke="#F0997B" strokeWidth="1.5"/><text x="184" y="127" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fill="#F0997B">3</text>
          <SpineLabel books={books} n={3} x={184} y={183} rotX={184} rotY={156} fill="#993C1D" />

          <rect x="218" y="120" width="52" height="80" rx="4" fill="#FBEAF0" stroke="#ED93B1" strokeWidth="1.5"/><text x="244" y="135" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fill="#ED93B1">4</text>
          <SpineLabel books={books} n={4} x={244} y={183} rotX={244} rotY={158} fill="#993556" />

          <rect x="278" y="115" width="52" height="85" rx="4" fill="#E6F1FB" stroke="#85B7EB" strokeWidth="1.5"/><text x="304" y="130" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fill="#85B7EB">5</text>
          <SpineLabel books={books} n={5} x={304} y={182} rotX={304} rotY={158} fill="#185FA5" />

          <rect x="338" y="117" width="52" height="83" rx="4" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="1.5"/><text x="364" y="132" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fill="#EF9F27">6</text>
          <SpineLabel books={books} n={6} x={364} y={182} rotX={364} rotY={157} fill="#854F0B" />

          <rect x="398" y="113" width="52" height="87" rx="4" fill="#EAF3DE" stroke="#97C459" strokeWidth="1.5"/><text x="424" y="128" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fill="#97C459">7</text>
          <SpineLabel books={books} n={7} x={424} y={182} rotX={424} rotY={157} fill="#3B6D11" />

          <rect x="458" y="119" width="52" height="81" rx="4" fill="#EEEDFE" stroke="#7F77DD" strokeWidth="1.5"/><text x="484" y="134" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fill="#7F77DD">8</text>
          <SpineLabel books={books} n={8} x={484} y={182} rotX={484} rotY={157} fill="#3C3489" />

          <rect x="518" y="115" width="52" height="85" rx="4" fill="#FCEBEB" stroke="#F09595" strokeWidth="1.5"/><text x="544" y="130" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fill="#F09595">9</text>
          <SpineLabel books={books} n={9} x={544} y={182} rotX={544} rotY={158} fill="#A32D2D" />

          <rect x="578" y="116" width="52" height="84" rx="4" fill="#E1F5EE" stroke="#1D9E75" strokeWidth="2"/><text x="604" y="131" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fill="#1D9E75">10</text>
          <SpineLabel books={books} n={10} x={604} y={182} rotX={604} rotY={157} fill="#085041" weight="700" />

          <rect x="256" y="212" width="130" height="26" rx="13" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="1.5"/><text x="321" y="230" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="#854F0B">{label5}</text>
          <rect x="534" y="212" width="110" height="26" rx="13" fill="#EEEDFE" stroke="#7F77DD" strokeWidth="1.5"/><text x="589" y="230" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="#3C3489">{label10}</text>

          {/* ── Row 2: Books 11–20 ── */}
          <rect x="30" y="378" width="620" height="12" rx="3" fill="#B4B2A9"/><rect x="28" y="374" width="4" height="20" rx="2" fill="#888780"/><rect x="648" y="374" width="4" height="20" rx="2" fill="#888780"/>

          <rect x="38" y="293" width="52" height="85" rx="4" fill="#FBEAF0" stroke="#D4537E" strokeWidth="1.5"/><text x="64" y="308" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="17" fill="#D4537E">11</text>
          <SpineLabel books={books} n={11} x={64} y={362} rotX={64} rotY={336} fill="#72243E" />

          <rect x="98" y="296" width="52" height="82" rx="4" fill="#E6F1FB" stroke="#378ADD" strokeWidth="1.5"/><text x="124" y="311" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="17" fill="#378ADD">12</text>
          <SpineLabel books={books} n={12} x={124} y={362} rotX={124} rotY={336} fill="#0C447C" />

          <rect x="158" y="290" width="52" height="88" rx="4" fill="#FAEEDA" stroke="#BA7517" strokeWidth="1.5"/><text x="184" y="305" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="17" fill="#BA7517">13</text>
          <SpineLabel books={books} n={13} x={184} y={362} rotX={184} rotY={334} fill="#633806" />

          <rect x="218" y="298" width="52" height="80" rx="4" fill="#EAF3DE" stroke="#639922" strokeWidth="1.5"/><text x="244" y="313" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="17" fill="#639922">14</text>
          <SpineLabel books={books} n={14} x={244} y={362} rotX={244} rotY={336} fill="#27500A" />

          <rect x="278" y="293" width="52" height="85" rx="4" fill="#FAECE7" stroke="#D85A30" strokeWidth="1.5"/><text x="304" y="308" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="17" fill="#D85A30">15</text>
          <SpineLabel books={books} n={15} x={304} y={362} rotX={304} rotY={336} fill="#712B13" />

          <rect x="338" y="295" width="52" height="83" rx="4" fill="#EEEDFE" stroke="#534AB7" strokeWidth="1.5"/><text x="364" y="310" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="17" fill="#534AB7">16</text>
          <SpineLabel books={books} n={16} x={364} y={362} rotX={364} rotY={335} fill="#26215C" />

          <rect x="398" y="291" width="52" height="87" rx="4" fill="#E1F5EE" stroke="#1D9E75" strokeWidth="1.5"/><text x="424" y="306" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="17" fill="#1D9E75">17</text>
          <SpineLabel books={books} n={17} x={424} y={362} rotX={424} rotY={335} fill="#04342C" />

          <rect x="458" y="297" width="52" height="81" rx="4" fill="#FCEBEB" stroke="#E24B4A" strokeWidth="1.5"/><text x="484" y="312" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="17" fill="#E24B4A">18</text>
          <SpineLabel books={books} n={18} x={484} y={362} rotX={484} rotY={335} fill="#501313" />

          <rect x="518" y="293" width="52" height="85" rx="4" fill="#FBEAF0" stroke="#993556" strokeWidth="1.5"/><text x="544" y="308" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="17" fill="#993556">19</text>
          <SpineLabel books={books} n={19} x={544} y={362} rotX={544} rotY={336} fill="#4B1528" />

          <rect x="578" y="288" width="52" height="90" rx="4" fill="#FAEEDA" stroke="#BA7517" strokeWidth="2.5"/><text x="604" y="303" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="20" fill="#EF9F27">★</text>
          <SpineLabel books={books} n={20} x={604} y={362} rotX={604} rotY={333} fill="#412402" weight="700" />

          <rect x="56" y="390" width="160" height="26" rx="13" fill="#E6F1FB" stroke="#378ADD" strokeWidth="1.5"/><text x="136" y="408" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="#0C447C">Pool Party!</text>
          <rect x="510" y="390" width="138" height="26" rx="13" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="2"/><text x="579" y="408" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="#412402">Arcade Day at Round 1!</text>

          {/* ── Reading Days ── */}
          <text x="40" y="450" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" fill="#5F5E5A">READING DAYS</text>
          <circle cx="64" cy="480" r="17" fill={circleFill(1, daysLogged)} stroke="#9FE1CB" strokeWidth="2"/><text x="64" y="485" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">1</text>
          <circle cx="106" cy="480" r="17" fill={circleFill(2, daysLogged)} stroke="#9FE1CB" strokeWidth="2"/><text x="106" y="485" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">2</text>
          <circle cx="148" cy="480" r="17" fill={circleFill(3, daysLogged)} stroke="#9FE1CB" strokeWidth="2"/><text x="148" y="485" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">3</text>
          <circle cx="190" cy="480" r="17" fill={circleFill(4, daysLogged)} stroke="#9FE1CB" strokeWidth="2"/><text x="190" y="485" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">4</text>
          <circle cx="232" cy="480" r="17" fill={circleFill(5, daysLogged)} stroke="#9FE1CB" strokeWidth="2"/><text x="232" y="485" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">5</text>
          <circle cx="274" cy="480" r="17" fill={circleFill(6, daysLogged)} stroke="#9FE1CB" strokeWidth="2"/><text x="274" y="485" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">6</text>
          <circle cx="316" cy="480" r="17" fill={circleFill(7, daysLogged)} stroke="#9FE1CB" strokeWidth="2"/><text x="316" y="485" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">7</text>
          <circle cx="358" cy="480" r="17" fill={circleFill(8, daysLogged)} stroke="#9FE1CB" strokeWidth="2"/><text x="358" y="485" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">8</text>
          <circle cx="400" cy="480" r="17" fill={circleFill(9, daysLogged)} stroke="#9FE1CB" strokeWidth="2"/><text x="400" y="485" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">9</text>
          <circle cx="442" cy="480" r="17" fill={circleFill(10, daysLogged)} stroke="#9FE1CB" strokeWidth="2"/><text x="442" y="485" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">10</text>
          <circle cx="484" cy="480" r="17" fill={circleFill(11, daysLogged)} stroke="#FAC775" strokeWidth="2"/><text x="484" y="485" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">11</text>
          <circle cx="526" cy="480" r="17" fill={circleFill(12, daysLogged)} stroke="#FAC775" strokeWidth="2"/><text x="526" y="485" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">12</text>
          <circle cx="568" cy="480" r="17" fill={circleFill(13, daysLogged)} stroke="#FAC775" strokeWidth="2"/><text x="568" y="485" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">13</text>
          <circle cx="610" cy="480" r="17" fill={circleFill(14, daysLogged)} stroke="#FAC775" strokeWidth="2"/><text x="610" y="485" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">14</text>
          <circle cx="64" cy="522" r="17" fill={circleFill(15, daysLogged)} stroke="#FAC775" strokeWidth="2"/><text x="64" y="527" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">15</text>
          <circle cx="106" cy="522" r="17" fill={circleFill(16, daysLogged)} stroke="#FAC775" strokeWidth="2"/><text x="106" y="527" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">16</text>
          <circle cx="148" cy="522" r="17" fill={circleFill(17, daysLogged)} stroke="#FAC775" strokeWidth="2"/><text x="148" y="527" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">17</text>
          <circle cx="190" cy="522" r="17" fill={circleFill(18, daysLogged)} stroke="#FAC775" strokeWidth="2"/><text x="190" y="527" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">18</text>
          <circle cx="232" cy="522" r="17" fill={circleFill(19, daysLogged)} stroke="#FAC775" strokeWidth="2"/><text x="232" y="527" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fill="#5F5E5A">19</text>
          <circle cx="274" cy="522" r="17" fill={circleFill(20, daysLogged)} stroke="#1D9E75" strokeWidth="3"/><text x="274" y="527" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="#085041">20!</text>
          <rect x="300" y="506" width="168" height="26" rx="13" fill="#E1F5EE" stroke="#1D9E75" strokeWidth="1.5"/><text x="384" y="524" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="#085041">FCPL challenge done!</text>

          <rect x="0" y="552" width="680" height="1.5" fill="#D3D1C7"/>

          {/* ── Places Visited ── */}
          <text x="40" y="572" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" fill="#5F5E5A">PLACES VISITED</text>
          {visitedPlaces.length === 0 ? (
            <text x="44" y={placesStartY} fontFamily="Arial, sans-serif" fontSize="11" fill="#B4B2A9" fontStyle="italic">No places visited yet</text>
          ) : (
            visitedPlaces.map((d, i) => {
              const col = i % 2;
              const row = Math.floor(i / 2);
              const dx = col === 0 ? 44 : 364;
              const dy = placesStartY + row * 22;
              return (
                <g key={i}>
                  <circle cx={dx + 4} cy={dy - 5} r="4" fill="#d97706"/>
                  <text x={dx + 14} y={dy} fontFamily="Arial, sans-serif" fontSize="11" fill="#412402">{placeLabel(d.name)}</text>
                </g>
              );
            })
          )}

          <rect x="0" y={footerSepY} width="680" height="1.5" fill="#D3D1C7"/>
          {!readerName && (
            <text x="40" y={footerSepY + 20} fontFamily="Arial, sans-serif" fontSize="12" fill="#5F5E5A">Reader&apos;s name: _______________________________</text>
          )}
        </svg>
      </div>
    </div>
  );
}
