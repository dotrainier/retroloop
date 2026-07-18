'use client';

import { useParams } from 'next/navigation';
import { useBoard } from '@/hooks/useBoard';
import Toolbar from '@/components/board/Toolbar';
import BoardCanvas from '@/components/board/BoardCanvas';
import NoteComposer from '@/components/board/NoteComposer';

export default function BoardPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const board = useBoard(roomId);

  if (!board.ready) {
    return (
      <div className='dot-grid flex h-screen w-screen items-center justify-center text-[var(--ink)]/50'>
        Connecting…
      </div>
    );
  }

  return (
    <main className='relative h-screen w-screen overflow-hidden'>
      <Toolbar roomId={roomId} connected={board.connected} users={board.users} me={board.me} />
      <BoardCanvas
        notes={board.notes}
        cursors={board.cursors}
        onCursorMove={board.reportCursor}
        onDeleteNote={board.deleteNote}
        onMoveNote={board.moveNote}
      />
      <NoteComposer onCreate={board.createNote} />
    </main>
  );
}
