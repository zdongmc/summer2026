'use client';

export default function MentionText({ text }: { text: string }) {
  const parts = text.split(/(@\w+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="font-semibold text-emerald-700 not-italic">{part}</span>
        ) : (
          part
        )
      )}
    </>
  );
}
