'use client';

import { useState } from 'react';

export default function NoteComposer({ onCreate }: { onCreate: (text: string) => void }) {
  const [text, setText] = useState('');

  const submit = () => {
    if (!text.trim()) return;
    onCreate(text);
    setText('');
  };

  return (
    <div className='pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center p-5'>
      <div className='pointer-events-auto flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)]/90 p-1.5 pl-4 shadow-[0_10px_30px_-10px_rgba(35,32,26,0.5)] backdrop-blur'>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder='Write a sticky note…'
          className='w-64 bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--ink)]/40 focus:outline-none sm:w-80'
        />
        <button
          onClick={submit}
          className='rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95'
        >
          Add note
        </button>
      </div>
    </div>
  );
}
