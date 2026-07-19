'use client';

import type { Note, OrganizeResult } from '@/lib/board-types';

export default function OrganizePanel({
  result,
  notes,
  onClose,
}: {
  result: OrganizeResult;
  notes: Note[];
  onClose: () => void;
}) {
  const byId = new Map(notes.map((n) => [n.id, n]));

  return (
    <div className='pointer-events-auto absolute right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-[var(--line)] bg-[var(--paper)] shadow-[-20px_0_50px_-20px_rgba(35,32,26,0.5)]'>
      <div className='flex items-center justify-between border-b border-[var(--line)] px-5 py-4'>
        <h2 className='font-display text-xl font-semibold text-[var(--ink)]'>AI summary</h2>
        <button
          onClick={onClose}
          className='flex h-7 w-7 items-center justify-center rounded-full text-[var(--ink)]/50 transition hover:bg-[var(--ink)]/10 hover:text-[var(--ink)]'
          aria-label='Close'
        >
          ✕
        </button>
      </div>

      <div className='flex-1 overflow-y-auto px-5 py-4'>
        <p className='rounded-xl bg-[var(--ink)]/5 p-4 text-sm leading-relaxed text-[var(--ink)]/80'>
          {result.summary}
        </p>

        <div className='mt-6 space-y-5'>
          {result.clusters.map((cluster, i) => (
            <div key={i}>
              <h3 className='mb-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)]'>
                {cluster.label}
              </h3>
              <ul className='space-y-1.5'>
                {cluster.noteIds
                  .map((id) => byId.get(id)) // ignore any hallucinated ids
                  .filter((n): n is Note => Boolean(n))
                  .map((note) => (
                    <li
                      key={note.id}
                      className='flex items-start gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)]'
                    >
                      <span
                        className='mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full'
                        style={{ backgroundColor: note.color }}
                      />
                      {note.text}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
