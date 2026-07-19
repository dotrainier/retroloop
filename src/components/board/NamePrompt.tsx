'use client';

import { useState } from 'react';
import { NOTE_COLORS, randomName, saveIdentity } from '@/lib/identity';
import type { Identity } from '@/lib/board-types';

export default function NamePrompt({ onDone }: { onDone: (identity: Identity) => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0]);

  const join = () => {
    const identity: Identity = { name: name.trim() || randomName(), color };
    saveIdentity(identity);
    onDone(identity);
  };

  const skip = () => {
    const identity: Identity = { name: randomName(), color };
    saveIdentity(identity); // persist so they aren't re-prompted next time
    onDone(identity);
  };

  return (
    <div className='absolute inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/30 p-6 backdrop-blur-sm'>
      <div className='w-full max-w-sm rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-7 shadow-[0_20px_50px_-20px_rgba(35,32,26,0.6)]'>
        <h2 className='font-display text-2xl font-semibold text-[var(--ink)]'>Join the board</h2>
        <p className='mt-1 text-sm text-[var(--ink)]/60'>
          Pick a name and color so others know who you are.
        </p>

        <label className='mt-5 block text-xs font-semibold uppercase tracking-widest text-[var(--ink)]/50'>
          Your name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && join()}
          placeholder='e.g. Rainier (optional)'
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

        <div className='mt-6 flex gap-2'>
          <button
            onClick={join}
            className='flex-1 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]'
          >
            Join board
          </button>
          <button
            onClick={skip}
            className='rounded-full border border-[var(--ink)]/15 px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--ink)]/5'
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
