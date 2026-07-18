'use client';

import { useRef, useState } from 'react';
import type { Note } from '@/lib/board-types';
import { rotationFromId } from '@/lib/identity';

// Keep notes on-canvas (0 = left/top edge). 0.95 leaves room for the note's width.
const clamp = (v: number) => Math.min(0.95, Math.max(0, v));

export default function NoteCard({
  note,
  boardRef,
  onDelete,
  onMove,
}: {
  note: Note;
  boardRef: React.RefObject<HTMLDivElement | null>;
  onDelete: (id: string) => void;
  onMove: (id: string, x: number, y: number, isFinal?: boolean) => void;
}) {
  const rotation = rotationFromId(note.id);
  const [dragging, setDragging] = useState(false);
  // Where inside the note the pointer grabbed it, so it doesn't jump to the corner.
  const grab = useRef<{ offsetX: number; offsetY: number } | null>(null);

  const positionFromPointer = (clientX: number, clientY: number) => {
    const canvas = boardRef.current;
    if (!canvas || !grab.current) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp((clientX - grab.current.offsetX - rect.left) / rect.width),
      y: clamp((clientY - grab.current.offsetY - rect.top) / rect.height),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const noteRect = e.currentTarget.getBoundingClientRect();
    grab.current = { offsetX: e.clientX - noteRect.left, offsetY: e.clientY - noteRect.top };
    e.currentTarget.setPointerCapture(e.pointerId); // keep events even if pointer strays
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const pos = positionFromPointer(e.clientX, e.clientY);
    if (pos) onMove(note.id, pos.x, pos.y); // throttled emit + local update
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const pos = positionFromPointer(e.clientX, e.clientY);
    if (pos) onMove(note.id, pos.x, pos.y, true); // final, unthrottled
    grab.current = null;
    setDragging(false);
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={`group absolute touch-none select-none animate-[note-pop_180ms_ease-out] ${
        dragging ? 'z-10 cursor-grabbing' : 'cursor-grab transition-[left,top] duration-75 ease-out'
      }`}
      style={{ left: `${note.x * 100}%`, top: `${note.y * 100}%` }}
    >
      <div
        className='relative w-[200px] px-4 pb-4 pt-6 shadow-[0_10px_20px_-8px_rgba(35,32,26,0.45),0_2px_4px_rgba(35,32,26,0.15)] transition-shadow duration-150 group-hover:shadow-[0_16px_28px_-8px_rgba(35,32,26,0.5)]'
        style={{
          transform: `rotate(${rotation}deg)`,
          backgroundColor: note.color,
          borderRadius: '3px 3px 10px 3px',
        }}
      >
        <div className='absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 -rotate-2 bg-white/35 backdrop-blur-[1px]' />

        <button
          onClick={() => onDelete(note.id)}
          onPointerDown={(e) => e.stopPropagation()} // don't start a drag when hitting ✕
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
