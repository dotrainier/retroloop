'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // Sync initial state from what the pre-paint script already applied.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('retroloop-theme', next ? 'dark' : 'light');
    } catch {
      // storage blocked — theme still applies for this session
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className='flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink)]/60 transition hover:bg-[var(--ink)]/10'
    >
      {dark ? (
        // sun
        <svg
          width='16'
          height='16'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        >
          <circle cx='12' cy='12' r='4' />
          <path d='M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19' />
        </svg>
      ) : (
        // moon
        <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
          <path d='M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z' />
        </svg>
      )}
    </button>
  );
}
