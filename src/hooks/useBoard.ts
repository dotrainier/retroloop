'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { CursorInfo, Identity, Note, RoomUser } from '@/lib/board-types';
import { randomColor, randomName, scatterPosition } from '@/lib/identity';

export function useBoard(roomId: string) {
  const socketRef = useRef<Socket | null>(null);
  const lastCursorSent = useRef(0);
  const lastMoveSent = useRef(0);

  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [cursors, setCursors] = useState<Record<string, CursorInfo>>({});
  const [notes, setNotes] = useState<Record<string, Note>>({});

  // Our own identity. Generated lazily (once) and only ever shown after mount,
  // so the random value can't cause a server/client hydration mismatch.
  const [me] = useState<Identity>(() => ({ name: randomName(), color: randomColor() }));

  // Gate: false on server + first client render (they match), true after mount.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: bridges SSR/client hydration mismatch
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!url) {
      console.error('NEXT_PUBLIC_SOCKET_URL is not set');
      return;
    }

    const socket = io(url);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', { roomId, name: me.name, color: me.color });
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('presence-update', (list: RoomUser[]) => {
      setUsers(list);
      // Drop cursors belonging to people who have left.
      const online = new Set(list.map((u) => u.socketId));
      setCursors((prev) => {
        const next: Record<string, CursorInfo> = {};
        for (const [id, c] of Object.entries(prev)) if (online.has(id)) next[id] = c;
        return next;
      });
    });

    socket.on('notes-sync', (list: Note[]) => {
      const record: Record<string, Note> = {};
      for (const n of list) record[n.id] = n;
      setNotes(record);
    });
    socket.on('note-create', (note: Note) => {
      setNotes((prev) => ({ ...prev, [note.id]: note }));
    });
    socket.on('note-delete', (id: string) => {
      setNotes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    });

    socket.on('cursor-move', (c: CursorInfo & { socketId: string }) => {
      setCursors((prev) => ({
        ...prev,
        [c.socketId]: { name: c.name, color: c.color, x: c.x, y: c.y },
      }));
    });

    socket.on('note-move', (m: { id: string; x: number; y: number }) => {
      setNotes((prev) =>
        prev[m.id] ? { ...prev, [m.id]: { ...prev[m.id], x: m.x, y: m.y } } : prev,
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [ready, roomId, me]);

  // ---- actions exposed to the UI ----

  const createNote = (text: string) => {
    if (!text.trim() || !socketRef.current) return;
    const { x, y } = scatterPosition();
    socketRef.current.emit('note-create', { roomId, text, x, y });
  };

  const deleteNote = (id: string) => {
    socketRef.current?.emit('note-delete', { roomId, noteId: id });
  };

  const moveNote = (id: string, x: number, y: number, isFinal = false) => {
    // Optimistic: update our own copy instantly so the drag feels responsive.
    setNotes((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], x, y } } : prev));

    // Throttle the network chatter, but always send the final resting position.
    const now = Date.now();
    if (!isFinal && now - lastMoveSent.current < 40) return;
    lastMoveSent.current = now;
    socketRef.current?.emit('note-move', { roomId, noteId: id, x, y });
  };

  // Called on every mousemove by the canvas; throttled here so the socket
  // isn't flooded (~20 msgs/sec max). Keeping the throttle inside the hook
  // means the component doesn't have to know about it.
  const reportCursor = (x: number, y: number) => {
    const now = Date.now();
    if (now - lastCursorSent.current < 50) return;
    lastCursorSent.current = now;
    socketRef.current?.emit('cursor-move', { roomId, x, y });
  };

  return {
    ready,
    connected,
    me,
    users,
    notes: Object.values(notes),
    cursors,
    createNote,
    deleteNote,
    moveNote,
    reportCursor,
  };
}
