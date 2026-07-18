import type { Identity, RoomUser } from '@/lib/board-types';

function initials(name: string) {
  return name.replace('Guest ', '').slice(0, 3);
}

export default function Toolbar({
  roomId,
  connected,
  users,
}: {
  roomId: string;
  connected: boolean;
  users: RoomUser[];
  me: Identity;
}) {
  return (
    <header className='pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center p-4'>
      <div className='pointer-events-auto flex w-full max-w-5xl items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)]/85 px-5 py-3 shadow-[0_6px_20px_-10px_rgba(35,32,26,0.4)] backdrop-blur'>
        <div className='flex items-baseline gap-3'>
          <span className='font-display text-xl font-semibold text-[var(--ink)]'>
            RetroLoop<span className='text-[var(--accent)]'>.</span>
          </span>
          <span className='rounded-full bg-[var(--ink)]/5 px-2 py-0.5 text-xs font-medium text-[var(--ink)]/60'>
            {roomId}
          </span>
        </div>

        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-1.5 text-xs font-medium text-[var(--ink)]/60'>
            <span
              className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`}
            />
            {connected ? 'Live' : 'Connecting'}
          </div>

          <div className='flex items-center'>
            <div className='flex -space-x-2'>
              {users.map((u) => (
                <div
                  key={u.socketId}
                  title={u.name}
                  className='flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--paper)] text-[11px] font-bold text-[var(--ink)]'
                  style={{ backgroundColor: u.color }}
                >
                  {initials(u.name)}
                </div>
              ))}
            </div>
            <span className='ml-2 text-xs font-medium text-[var(--ink)]/60'>
              {users.length} online
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
