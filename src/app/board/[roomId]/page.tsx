'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useBoard } from '@/hooks/useBoard';
import { useOrganize } from '@/hooks/useOrganize';
import { hasStoredIdentity } from '@/lib/identity';
import Toolbar from '@/components/board/Toolbar';
import BoardCanvas from '@/components/board/BoardCanvas';
import NoteComposer from '@/components/board/NoteComposer';
import OrganizePanel from '@/components/board/OrganizePanel';
import NamePrompt from '@/components/board/NamePrompt';

export default function BoardPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const board = useBoard(roomId);
  const ai = useOrganize(roomId);

  // Decide once, after mount, whether this visitor needs the prompt.
  const [showPrompt, setShowPrompt] = useState(() => !hasStoredIdentity());

  if (!board.ready) {
    return (
      <div className='dot-grid flex h-screen w-screen items-center justify-center text-[var(--ink)]/50'>
        Connecting…
      </div>
    );
  }

  return (
    <main className='relative h-screen w-screen overflow-hidden'>
      <Toolbar
        roomId={roomId}
        connected={board.connected}
        users={board.users}
        me={board.me}
        onOrganize={ai.organize}
        organizing={ai.loading}
      />
      <BoardCanvas
        notes={board.notes}
        cursors={board.cursors}
        onCursorMove={board.reportCursor}
        onDeleteNote={board.deleteNote}
        onMoveNote={board.moveNote}
      />
      <NoteComposer onCreate={board.createNote} />

      {ai.error && (
        <div className='pointer-events-auto absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-lg'>
          {ai.error}
        </div>
      )}

      {ai.result && <OrganizePanel result={ai.result} notes={board.notes} onClose={ai.clear} />}

      {showPrompt && (
        <NamePrompt
          onDone={() => {
            setShowPrompt(false);
            // Reload so useBoard re-reads the freshly saved identity and
            // reconnects with the correct name/color.
            window.location.reload();
          }}
        />
      )}
    </main>
  );
}
