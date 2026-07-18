import type { CursorInfo } from '@/lib/board-types';

export default function Cursor({ cursor }: { cursor: CursorInfo }) {
  return (
    <div
      className='pointer-events-none absolute z-20 transition-[left,top] duration-75 ease-linear'
      style={{ left: `${cursor.x * 100}%`, top: `${cursor.y * 100}%` }}
    >
      <svg width='20' height='20' viewBox='0 0 24 24' className='drop-shadow-sm'>
        <path
          d='M5 3l15 7.5-6.2 1.8L11 19 5 3z'
          fill={cursor.color}
          stroke='white'
          strokeWidth='1.5'
          strokeLinejoin='round'
        />
      </svg>
      <span
        className='ml-3 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm'
        style={{ backgroundColor: cursor.color }}
      >
        {cursor.name}
      </span>
    </div>
  );
}
