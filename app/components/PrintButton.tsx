'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
    >
      Print
    </button>
  );
}
