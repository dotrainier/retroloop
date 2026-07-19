/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { CursorInfo, Identity, Note, RoomUser } from '@/lib/board-types';
import { loadIdentity, scatterPosition } from '@/lib/identity';

export function useBoard(roomId: string) {
  const socketRef = useRef<Socket | null>(null);
  const lastCursorSent = useRef(0);
  const lastMoveSent = useRef(0);

  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [cursors, setCursors] = useState<Record<string, CursorInfo>>({});
  const [notes, setNotes] = useState<Record<string, Note>>({});

  const [me] = useState<Identity>(() => loadIdentity());
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  // Load persisted notes from the database (the source of truth) on mount.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    const loadBoard = async () => {
      try {
        const res = await fetch(`/api/boards/${roomId}`);
        if (!res.ok) throw new Error('Failed to load board');
        const board: { notes: Note[] } = await res.json();
        if (cancelled) return;

        const record: Record<string, Note> = {};
        for (const n of board.notes) record[n.id] = n;
        setNotes(record);
      } catch (e) {
        if (!cancelled) console.error('Failed to load board', e);
      }
    };

    loadBoard();

    return () => {
      cancelled = true;
    };
  }, [ready, roomId]);

  // Real-time layer: presence, cursors, and live note relays.
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
      const online = new Set(list.map((u) => u.socketId));
      setCursors((prev) => {
        const next: Record<string, CursorInfo> = {};
        for (const [id, c] of Object.entries(prev)) if (online.has(id)) next[id] = c;
        return next;
      });
    });

    socket.on('note-create', (note: Note) => {
      setNotes((prev) => ({ ...prev, [note.id]: note }));
    });
    socket.on('note-move', (m: { id: string; x: number; y: number }) => {
      setNotes((prev) =>
        prev[m.id] ? { ...prev, [m.id]: { ...prev[m.id], x: m.x, y: m.y } } : prev,
      );
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

    return () => {
      socket.disconnect();
    };
  }, [ready, roomId, me]);

  // ---- actions: each one persists to the DB, then relays over the socket ----

  const createNote = async (text: string) => {
    if (!text.trim()) return;
    const { x, y } = scatterPosition();
    try {
      const res = await fetch(`/api/boards/${roomId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, color: me.color, author: me.name, x, y }),
      });
      if (!res.ok) throw new Error('Failed to create note');
      const note: Note = await res.json(); // DB-assigned id comes back here
      setNotes((prev) => ({ ...prev, [note.id]: note })); // show it for us
      socketRef.current?.emit('note-create', { roomId, note }); // and for others
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNote = async (id: string) => {
    // Optimistic: remove locally right away, then confirm with the server.
    setNotes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    socketRef.current?.emit('note-delete', { roomId, noteId: id });

    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  // Persist a note's resting position. Kept separate so the hot-path moveNote
  // can stay synchronous and just fire-and-forget this on drop.
  const persistPosition = async (id: string, x: number, y: number) => {
    try {
      await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const moveNote = (id: string, x: number, y: number, isFinal = false) => {
    setNotes((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], x, y } } : prev));

    const now = Date.now();
    if (!isFinal && now - lastMoveSent.current < 40) return;
    lastMoveSent.current = now;
    socketRef.current?.emit('note-move', { roomId, id, x, y });

    // Only persist the FINAL resting position — no DB write per throttled tick.
    if (isFinal) void persistPosition(id, x, y);
  };

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
