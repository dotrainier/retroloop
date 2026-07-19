'use client';

import { useRef, useState } from 'react';
import type { Note } from '@/lib/board-types';
import { rotationFromId } from '@/lib/identity';

const clamp = (v: number) => Math.min(0.95, Math.max(0, v));
const DRAG_THRESHOLD = 4; // px of movement before a press counts as a drag

export default function NoteCard({
  note,
  boardRef,
  onDelete,
  onMove,
  onUpdate,
}: {
  note: Note;
  boardRef: React.RefObject<HTMLDivElement | null>;
  onDelete: (id: string) => void;
  onMove: (id: string, x: number, y: number, isFinal?: boolean) => void;
  onUpdate: (id: string, text: string) => void;
}) {
  const rotation = rotationFromId(note.id);
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.text);

  // Pointer bookkeeping
  const grab = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null); // where the press began
  const pressed = useRef(false); // pointer is down but maybe not yet a drag
  const draggingRef = useRef(false); // synchronous mirror of `dragging`

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const positionFromPointer = (clientX: number, clientY: number) => {
    const canvas = boardRef.current;
    if (!canvas || !grab.current) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp((clientX - grab.current.offsetX - rect.left) / rect.width),
      y: clamp((clientY - grab.current.offsetY - rect.top) / rect.height),
    };
  };

  const beginEdit = () => {
    setDraft(note.text);
    setEditing(true);
    // Wait for the textarea to mount, then focus with the caret at the end.
    setTimeout(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length); // caret at end
    }, 0);
  };

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== note.text) onUpdate(note.id, trimmed);
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraft(note.text);
    setEditing(false);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editing) return;
    // Record the press, but DON'T start dragging yet — wait for movement.
    const noteRect = e.currentTarget.getBoundingClientRect();
    grab.current = { offsetX: e.clientX - noteRect.left, offsetY: e.clientY - noteRect.top };
    start.current = { x: e.clientX, y: e.clientY };
    pressed.current = true;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (editing || !pressed.current || !start.current) return;

    // Promote to a real drag only once the pointer moves past the threshold.
    if (!draggingRef.current) {
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      draggingRef.current = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    const pos = positionFromPointer(e.clientX, e.clientY);
    if (pos) onMove(note.id, pos.x, pos.y);
  };

  const endPress = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) {
      const pos = positionFromPointer(e.clientX, e.clientY);
      if (pos) onMove(note.id, pos.x, pos.y, true);
    }
    pressed.current = false;
    draggingRef.current = false;
    grab.current = null;
    start.current = null;
    setDragging(false);
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPress}
      onDoubleClick={beginEdit}
      className={`group absolute touch-none select-none animate-[note-pop_180ms_ease-out] ${
        dragging
          ? 'z-10 cursor-grabbing'
          : editing
            ? 'z-10'
            : 'cursor-grab transition-[left,top] duration-75 ease-out'
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
          onPointerDown={(e) => e.stopPropagation()}
          aria-label='Delete note'
          className='absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[var(--ink)]/50  sm:opacity-0 opacity-100 transition hover:bg-black/10 hover:text-[var(--ink)] sm:group-hover:opacity-100'
        >
          ✕
        </button>

        {editing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commitEdit();
              } else if (e.key === 'Escape') {
                cancelEdit();
              }
            }}
            rows={3}
            className='w-full resize-none bg-transparent text-[15px] leading-snug text-[var(--ink)] focus:outline-none'
          />
        ) : (
          <p className='min-h-[1.5rem] cursor-text whitespace-pre-wrap break-words text-[15px] leading-snug text-[var(--ink)]'>
            {note.text}
          </p>
        )}

        <p className='mt-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--ink)]/55'>
          <span
            className='inline-block h-2 w-2 rounded-full'
            style={{ backgroundColor: note.color, filter: 'brightness(0.7)' }}
          />
          {note.author}
        </p>
      </div>
    </div>
  );
}
