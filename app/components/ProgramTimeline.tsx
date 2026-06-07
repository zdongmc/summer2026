// Timeline: June 1 – September 4 (95 days, day 0 = June 1)
// Club starts June 7 (day 6), ends September 4 (day 95)

const LEFT = 122;   // px where timeline starts (label area)
const RIGHT = 696;  // px where timeline ends
const W = RIGHT - LEFT;    // 574
const TOTAL_DAYS = 95;     // June 1 → Sep 4
const SCALE = W / TOTAL_DAYS;

function px(day: number) { return LEFT + day * SCALE; }

function dayOf(month: number, date: number): number {
  // day offset from June 1
  const monthOffsets = [0, 30, 61, 92]; // Jun, Jul, Aug, Sep
  return monthOffsets[month - 6] + (date - 1);
}

const PROGRAMS = [
  {
    label:  'Our Club',
    dates:  'Jun 1 – Sep 4',
    start:  dayOf(6, 1),
    end:    dayOf(9, 4),
    fill:   '#d1fae5',
    stroke: '#059669',
    text:   '#065f46',
  },
  {
    label:  'FCPL',
    dates:  'Jun 1 – Aug 16',
    start:  dayOf(6, 1),
    end:    dayOf(8, 16),
    fill:   '#fef3c7',
    stroke: '#d97706',
    text:   '#78350f',
  },
  {
    label:  'MCPL',
    dates:  'Jun 13 – Aug 21',
    start:  dayOf(6, 13),
    end:    dayOf(8, 21),
    fill:   '#dbeafe',
    stroke: '#2563eb',
    text:   '#1e3a8a',
  },
  {
    label:  'White House',
    dates:  'Jun 1 – Sep 4',
    start:  dayOf(6, 1),
    end:    dayOf(9, 4),
    fill:   '#ede9fe',
    stroke: '#7c3aed',
    text:   '#3730a3',
  },
];

const MONTHS = [
  { day: dayOf(6, 1),  label: 'June',      nextDay: dayOf(7, 1) },
  { day: dayOf(7, 1),  label: 'July',      nextDay: dayOf(8, 1) },
  { day: dayOf(8, 1),  label: 'August',    nextDay: dayOf(9, 1) },
  { day: dayOf(9, 1),  label: 'September', nextDay: TOTAL_DAYS  },
];

const HEADER_H = 30;
const BAR_H    = 22;
const ROW_H    = 36;
const SVG_H    = HEADER_H + PROGRAMS.length * ROW_H + 14;

export default function ProgramTimeline() {
  return (
    <div className="my-6">
      <svg
        viewBox={`0 0 720 ${SVG_H}`}
        className="w-full"
        aria-label="Program overlap timeline June through September 2026"
      >
        {/* Month header background */}
        <rect x="0" y="0" width="720" height={HEADER_H} rx="6" fill="#f3f4f6" />

        {/* Month columns + labels */}
        {MONTHS.map((m, i) => {
          const mx   = px(m.day);
          const nextX = Math.min(px(m.nextDay), RIGHT);
          const cx   = (mx + nextX) / 2;
          return (
            <g key={m.label}>
              {i > 0 && (
                <line x1={mx} y1={HEADER_H} x2={mx} y2={SVG_H - 6}
                  stroke="#e5e7eb" strokeWidth="1" />
              )}
              <text x={cx} y={HEADER_H - 9} textAnchor="middle"
                fontFamily="Arial, sans-serif" fontSize="11"
                fontWeight="700" fill="#6b7280">
                {m.label.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Right edge line */}
        <line x1={RIGHT} y1={HEADER_H} x2={RIGHT} y2={SVG_H - 6}
          stroke="#e5e7eb" strokeWidth="1" />

        {/* Program rows */}
        {PROGRAMS.map((p, i) => {
          const ry  = HEADER_H + i * ROW_H + (ROW_H - BAR_H) / 2;
          const bx  = px(p.start);
          const bw  = px(p.end) - bx;

          return (
            <g key={p.label}>
              {/* Row zebra */}
              <rect x="0" y={HEADER_H + i * ROW_H} width="720"
                height={ROW_H} fill={i % 2 === 0 ? '#ffffff' : '#fafafa'} />

              {/* Label */}
              <text x={LEFT - 6} y={ry + BAR_H / 2 + 4}
                textAnchor="end" fontFamily="Arial, sans-serif"
                fontSize="11" fontWeight="700" fill={p.text}>
                {p.label}
              </text>

              {/* Timeline track (full-width ghost) */}
              <rect x={LEFT} y={ry} width={W} height={BAR_H}
                rx="4" fill="#f3f4f6" />

              {/* Active bar */}
              <rect x={bx} y={ry} width={bw} height={BAR_H}
                rx="4" fill={p.fill} stroke={p.stroke} strokeWidth="1.5" />

              {/* Date label inside bar if wide enough, else outside */}
              {bw > 80 && (
                <text x={bx + bw / 2} y={ry + BAR_H / 2 + 4}
                  textAnchor="middle" fontFamily="Arial, sans-serif"
                  fontSize="9" fontWeight="600" fill={p.text}>
                  {p.dates}
                </text>
              )}
            </g>
          );
        })}

        {/* Today / Club-start marker */}
        {(() => {
          const todayX = px(dayOf(6, 7));
          const markerTop = HEADER_H + 2;
          return (
            <g>
              <line x1={todayX} y1={markerTop} x2={todayX} y2={SVG_H - 14}
                stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" />
              <rect x={todayX - 17} y={SVG_H - 14} width="34" height="13"
                rx="3" fill="#ef4444" />
              <text x={todayX} y={SVG_H - 5}
                textAnchor="middle" fontFamily="Arial, sans-serif"
                fontSize="8" fontWeight="700" fill="white">
                TODAY
              </text>
            </g>
          );
        })()}

        {/* MCPL start gap note (tiny tick Jun 13) */}
        {(() => {
          const mcplX = px(dayOf(6, 13));
          return (
            <line x1={mcplX} y1={HEADER_H + ROW_H * 2}
              x2={mcplX} y2={HEADER_H + ROW_H * 3}
              stroke="#2563eb" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
          );
        })()}
      </svg>

      {/* Key overlap callout */}
      <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-800">
        <span className="font-bold">Full overlap window:</span> Jun 13 – Aug 16 — all four programs active at once.
        Books read in this window count toward every program.
        <span className="block mt-1 text-emerald-600">
          FCPL ends Aug 16 · MCPL ends Aug 21 · Club &amp; White House run through Sep 4
        </span>
      </div>
    </div>
  );
}
