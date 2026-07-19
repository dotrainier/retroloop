/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateRoomCode, normalizeRoomCode } from '@/lib/room-code';
import { NOTE_COLORS, loadIdentity, randomName, saveIdentity } from '@/lib/identity';

export default function HomePage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0]);

  // Prefill from a previously saved identity (client-only, after mount).
  useEffect(() => {
    const saved = loadIdentity();
    // If it's just a random "Guest ###", leave the field empty to show the placeholder.
    setName(saved.name.startsWith('Guest ') ? '' : saved.name);
    setColor(saved.color);
  }, []);

  const persistIdentity = () => {
    const finalName = name.trim() || randomName();
    saveIdentity({ name: finalName, color });
  };

  const createBoard = () => {
    persistIdentity();
    router.push(`/board/${generateRoomCode()}`);
  };

  const joinBoard = () => {
    const normalized = normalizeRoomCode(code);
    if (!normalized) return;
    persistIdentity();
    router.push(`/board/${normalized}`);
  };

  return (
    <main className='dot-grid flex min-h-screen w-screen items-center justify-center p-6'>
      <div className='w-full max-w-md rounded-3xl border border-[var(--line)] bg-[var(--paper)]/80 p-8 shadow-[0_20px_50px_-20px_rgba(35,32,26,0.5)] backdrop-blur'>
        <h1 className='font-display text-4xl font-semibold text-[var(--ink)]'>
          RetroLoop<span className='text-[var(--accent)]'>.</span>
        </h1>
        <p className='mt-2 text-sm text-[var(--ink)]/60'>
          Real-time retros &amp; brainstorms. No account needed — start a board and share the link.
        </p>

        {/* Identity */}
        <label className='mt-7 block text-xs font-semibold uppercase tracking-widest text-[var(--ink)]/50'>
          Your name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='e.g. Sarah (optional)'
          maxLength={24}
          className='mt-2 w-full rounded-full border border-[var(--line)] bg-transparent px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40'
        />

        <div className='mt-3 flex items-center gap-2'>
          <span className='text-xs font-medium text-[var(--ink)]/50'>Color</span>
          <div className='flex gap-1.5'>
            {NOTE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Pick color ${c}`}
                className={`h-6 w-6 rounded-full transition ${
                  color === c
                    ? 'ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--paper)]'
                    : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={createBoard}
          className='mt-6 w-full rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]'
        >
          Create a new board
        </button>

        <div className='my-6 flex items-center gap-3 text-xs text-[var(--ink)]/40'>
          <span className='h-px flex-1 bg-[var(--line)]' />
          or join with a code
          <span className='h-px flex-1 bg-[var(--line)]' />
        </div>

        <div className='flex items-center gap-2'>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && joinBoard()}
            placeholder='e.g. bold-falcon-72'
            className='min-w-0 flex-1 rounded-full border border-[var(--line)] bg-transparent px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40'
          />
          <button
            onClick={joinBoard}
            disabled={!code.trim()}
            className='rounded-full border border-[var(--ink)]/15 px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--ink)]/5 disabled:opacity-40'
          >
            Join
          </button>
        </div>
      </div>
    </main>
  );
}
