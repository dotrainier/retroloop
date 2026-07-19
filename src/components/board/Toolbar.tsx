'use client';

import { useState } from 'react';
import type { Identity, RoomUser } from '@/lib/board-types';
import ThemeToggle from '../ThemeToggle';

const MAX_AVATARS = 4; // cap shown avatars so the bar can't overflow on mobile

function initials(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return words[0].slice(0, 1).toUpperCase();
}

export default function Toolbar({
  roomId,
  connected,
  users,
  onOrganize,
  organizing,
}: {
  roomId: string;
  connected: boolean;
  users: RoomUser[];
  me: Identity;
  onOrganize: () => void;
  organizing: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Copy failed');
    }
  };

  const shownUsers = users.slice(0, MAX_AVATARS);
  const overflow = users.length - shownUsers.length;

  return (
    <header className='pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center p-2 sm:p-4'>
      <div className='pointer-events-auto flex w-full max-w-5xl items-center justify-between gap-2 rounded-2xl border border-[var(--line)] bg-[var(--paper)]/85 px-3 py-2 shadow-[0_6px_20px_-10px_rgba(35,32,26,0.4)] backdrop-blur sm:gap-4 sm:px-5 sm:py-3'>
        {/* Left: wordmark + copy link */}
        <div className='flex min-w-0 items-baseline gap-2 sm:gap-3'>
          <span className='font-display text-lg font-semibold text-[var(--ink)] sm:text-xl'>
            RetroLoop<span className='text-[var(--accent)]'>.</span>
          </span>
          <button
            onClick={copyLink}
            title='Copy board link'
            className={`min-w-0 truncate rounded-full px-2 py-0.5 text-xs font-medium transition ${
              copied
                ? 'bg-emerald-500/15 text-emerald-700'
                : 'bg-[var(--ink)]/5 text-[var(--ink)]/60 hover:bg-[var(--ink)]/10'
            }`}
          >
            {copied ? (
              '✓ Copied!'
            ) : (
              <>
                {roomId}
                <span className='hidden sm:inline'> · copy link</span>
              </>
            )}
          </button>
        </div>

        {/* Right: actions + presence */}
        <div className='flex shrink-0 items-center gap-2 sm:gap-4'>
          <ThemeToggle />

          <button
            onClick={onOrganize}
            disabled={organizing}
            title={organizing ? 'Organizing…' : 'Organize with AI'}
            aria-label={organizing ? 'Organizing…' : 'Organize with AI'}
            className='flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-2.5 py-2 text-xs font-semibold text-[var(--paper)] transition hover:brightness-125 disabled:opacity-50 sm:px-3.5'
          >
            <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M12 2l1.9 5.6L19.5 9.5 13.9 11.4 12 17l-1.9-5.6L4.5 9.5l5.6-1.9z' />
            </svg>
            <span className='hidden sm:inline'>
              {organizing ? 'Organizing…' : 'Organize with AI'}
            </span>
          </button>

          <div
            className='flex items-center gap-1.5 text-xs font-medium text-[var(--ink)]/60'
            title={connected ? 'Live' : 'Connecting'}
          >
            <span
              className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`}
            />
            <span className='hidden sm:inline'>{connected ? 'Live' : 'Connecting'}</span>
          </div>

          <div className='flex items-center'>
            <div className='flex -space-x-2'>
              {shownUsers.map((u) => (
                <div
                  key={u.socketId}
                  title={u.name}
                  className='flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--paper)] text-[11px] font-bold text-[var(--ink)]'
                  style={{ backgroundColor: u.color }}
                >
                  {initials(u.name)}
                </div>
              ))}
              {overflow > 0 && (
                <div className='flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--paper)] bg-[var(--ink)]/10 text-[11px] font-bold text-[var(--ink)]/70'>
                  +{overflow}
                </div>
              )}
            </div>
            <span className='ml-2 hidden text-xs font-medium text-[var(--ink)]/60 md:inline'>
              {users.length} online
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
