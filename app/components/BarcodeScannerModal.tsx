'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException, BarcodeFormat, DecodeHintType } from '@zxing/library';
import type { IScannerControls } from '@zxing/browser';

export type ScannedBook = {
  title: string;
  author: string | null;
  isbn: string;
  cover_url: string | null;
};

interface Props {
  onDetected: (book: ScannedBook) => void;
  onClose: () => void;
}

const HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8]],
  [DecodeHintType.TRY_HARDER, true],
]);

async function lookupIsbn(isbn: string): Promise<ScannedBook> {
  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=details`
    );
    if (!res.ok) throw new Error('lookup failed');
    const data = await res.json();
    const details = data[`ISBN:${isbn}`]?.details;
    const title: string = details?.title ?? isbn;
    const author: string | null = details?.authors?.[0]?.name ?? null;
    // Use cover ID (more reliable than ISBN-based URL — avoids "no cover" placeholders)
    const coverId: number | undefined = details?.covers?.[0];
    const cover_url = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
    return { title, author, isbn, cover_url };
  } catch {
    return { title: isbn, author: null, isbn, cover_url: null };
  }
}

export default function BarcodeScannerModal({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [status, setStatus] = useState<'scanning' | 'looking-up' | 'error'>('scanning');
  const [message, setMessage] = useState('Point camera at the barcode on the back of the book');

  useEffect(() => {
    const reader = new BrowserMultiFormatReader(HINTS, { delayBetweenScanAttempts: 150 });

    reader
      .decodeFromConstraints(
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
        videoRef.current ?? undefined,
        (result, error, controls) => {
          controlsRef.current = controls;

          if (result) {
            controls.stop();
            const isbn = result.getText();
            setStatus('looking-up');
            setMessage('Looking up book…');
            lookupIsbn(isbn).then(onDetected);
          }

          if (error && !(error instanceof NotFoundException)) {
            setStatus('error');
            setMessage(error.message ?? 'Camera error');
          }
        }
      )
      .catch(err => {
        setStatus('error');
        setMessage(err?.message ?? 'Could not access camera');
      });

    return () => {
      controlsRef.current?.stop();
    };
  }, [onDetected]);

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-bold text-emerald-900">Scan Book Barcode</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="relative bg-black aspect-[4/3]">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />

          {status === 'scanning' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-3/4 h-14 rounded"
                style={{
                  border: '2px solid rgba(255,255,255,0.85)',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                }}
              />
            </div>
          )}

          {status === 'looking-up' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <p className="text-white text-sm font-semibold animate-pulse">Looking up book…</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 text-center space-y-2">
          <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
            {message}
          </p>
          <p className="text-xs text-gray-400">Hold the barcode steady — good light helps</p>
          <div className="text-xs text-gray-400 border-t border-gray-100 pt-2 space-y-0.5">
            <p>Works with: <span className="text-gray-500 font-medium">📚 books &amp; audiobook CDs</span></p>
            <p>Got a digital audiobook from Libby or Audible? Just type the title instead.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
