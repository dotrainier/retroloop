'use client';

import type { CursorInfo, Note } from '@/lib/board-types';
import NoteCard from './NoteCard';
import Cursor from './Cursor';

export default function BoardCanvas({
  notes,
  cursors,
  onCursorMove,
  onDeleteNote,
}: {
  notes: Note[];
  cursors: Record<string, CursorInfo>;
  onCursorMove: (x: number, y: number) => void;
  onDeleteNote: (id: string) => void;
}) {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onCursorMove((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
  };

  return (
    <div onMouseMove={handleMouseMove} className='dot-grid absolute inset-0 overflow-hidden'>
      {notes.length === 0 && (
        <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center'>
          <p className='font-display text-2xl text-[var(--ink)]/70'>This board is empty</p>
          <p className='mt-1 text-sm text-[var(--ink)]/45'>
            Drop the first note using the bar below ↓
          </p>
        </div>
      )}

      {notes.map((note) => (
        <NoteCard key={note.id} note={note} onDelete={onDeleteNote} />
      ))}

      {Object.entries(cursors).map(([id, cursor]) => (
        <Cursor key={id} cursor={cursor} />
      ))}
    </div>
  );
}
