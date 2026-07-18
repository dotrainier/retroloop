'use client';

import { useBoard } from '@/hooks/useBoard';
import Toolbar from '@/components/board/Toolbar';
import BoardCanvas from '@/components/board/BoardCanvas';
import NoteComposer from '@/components/board/NoteComposer';

const ROOM_ID = 'test-room'; // hardcoded for now — will come from the URL later

export default function BoardPage() {
  const board = useBoard(ROOM_ID);

  if (!board.ready) {
    return (
      <div className='dot-grid flex h-screen w-screen items-center justify-center text-[var(--ink)]/50'>
        Connecting…
      </div>
    );
  }

  return (
    <main className='relative h-screen w-screen overflow-hidden'>
      <Toolbar roomId={ROOM_ID} connected={board.connected} users={board.users} me={board.me} />
      <BoardCanvas
        notes={board.notes}
        cursors={board.cursors}
        onCursorMove={board.reportCursor}
        onDeleteNote={board.deleteNote}
      />
      <NoteComposer onCreate={board.createNote} />
    </main>
  );
}
