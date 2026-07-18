import type { Note } from '@/lib/board-types';
import { rotationFromId } from '@/lib/identity';

export default function NoteCard({
  note,
  onDelete,
}: {
  note: Note;
  onDelete: (id: string) => void;
}) {
  const rotation = rotationFromId(note.id);

  return (
    <div
      // Outer: absolute position on the canvas + the entrance "pop".
      className='group absolute animate-[note-pop_180ms_ease-out]'
      style={{ left: `${note.x * 100}%`, top: `${note.y * 100}%` }}
    >
      {/* Inner: the tilt lives here so it doesn't fight the pop animation. */}
      <div
        className='relative w-[200px] px-4 pb-4 pt-6 shadow-[0_10px_20px_-8px_rgba(35,32,26,0.45),0_2px_4px_rgba(35,32,26,0.15)] transition-transform duration-150 group-hover:-translate-y-1 group-hover:shadow-[0_16px_28px_-8px_rgba(35,32,26,0.5)]'
        style={{
          transform: `rotate(${rotation}deg)`,
          backgroundColor: note.color,
          borderRadius: '3px 3px 10px 3px', // varied corners = organic, not uniform
        }}
      >
        {/* "Tape" strip */}
        <div className='absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 -rotate-2 bg-white/35 backdrop-blur-[1px]' />

        <button
          onClick={() => onDelete(note.id)}
          aria-label='Delete note'
          className='absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[var(--ink)]/50 opacity-0 transition hover:bg-black/10 hover:text-[var(--ink)] group-hover:opacity-100'
        >
          ✕
        </button>

        <p className='whitespace-pre-wrap break-words text-[15px] leading-snug text-[var(--ink)]'>
          {note.text}
        </p>

        <p className='mt-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--ink)]/55'>
          <span
            className='inline-block h-2 w-2 rounded-full'
            style={{ backgroundColor: note.color, filter: 'brightness(0.7)' }}
          />
          {note.authorName}
        </p>
      </div>
    </div>
  );
}
