import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { randomUUID } from 'crypto';

interface Note {
  id: string;
  text: string;
  color: string;
  authorName: string;
  x: number;
  y: number;
}

interface RoomUser {
  socketId: string;
  name: string;
  color: string;
}

const app = express();

// Allow requests from your Next.js dev server
app.use(cors({ origin: 'http://localhost:3000' }));

// Simple health check — lets you sanity-check the server in a browser
app.get('/', (_req, res) => {
  res.send('Socket.io server is running');
});

// Socket.io needs a raw http server to attach to (not just the Express app)
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map<string, Map<string, RoomUser>>();
const notes = new Map<string, Map<string, Note>>();

function getRoomNotes(roomId: string): Note[] {
  const room = notes.get(roomId);
  return room ? Array.from(room.values()) : [];
}

function getRoomUsers(roomId: string): RoomUser[] {
  const room = rooms.get(roomId);
  return room ? Array.from(room.values()) : [];
}

const PORT = process.env.PORT || 4000;

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on(
    'join-room',
    ({ roomId, name, color }: { roomId: string; name: string; color: string }) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} (${name}) joined room: ${roomId}`);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      rooms.get(roomId)!.set(socket.id, { socketId: socket.id, name, color });

      // Remember which room this socket is in, so disconnect can clean up correctly
      socket.data.roomId = roomId;

      // Broadcast the full updated list to EVERYONE in the room, including the joiner
      io.to(roomId).emit('presence-update', getRoomUsers(roomId));

      socket.emit('notes-sync', getRoomNotes(roomId));
    },
  );

  socket.on(
    'note-create',
    ({ roomId, text, x, y }: { roomId: string; text: string; x: number; y: number }) => {
      const room = rooms.get(roomId);
      const user = room?.get(socket.id);
      if (!user || !text.trim()) return;

      const note: Note = {
        id: randomUUID(),
        text: text.trim(),
        color: user.color,
        authorName: user.name,
        x: typeof x === 'number' ? x : 0.5,
        y: typeof y === 'number' ? x : 0.5,
      };

      if (!notes.has(roomId)) notes.set(roomId, new Map());
      notes.get(roomId)!.set(note.id, note);

      // Include the sender (io.to, not socket.to) — they need the
      // server-assigned id back, not just their own optimistic copy.
      io.to(roomId).emit('note-create', note);
    },
  );

  socket.on('note-delete', ({ roomId, noteId }: { roomId: string; noteId: string }) => {
    notes.get(roomId)?.delete(noteId);
    io.to(roomId).emit('note-delete', noteId);
  });

  socket.on('cursor-move', ({ roomId, x, y }: { roomId: string; x: number; y: number }) => {
    const room = rooms.get(roomId);
    const user = room?.get(socket.id);
    if (!user) return; // socket hasn't joined a room yet — ignore

    // Look up name/color from server-side state rather than trusting
    // whatever the client sends — cheaper payload, and no way for a
    // client to spoof someone else's name/color.
    socket.to(roomId).emit('cursor-move', {
      socketId: socket.id,
      name: user.name,
      color: user.color,
      x,
      y,
    });
  });

  socket.on(
    'note-move',
    ({ roomId, noteId, x, y }: { roomId: string; noteId: string; x: number; y: number }) => {
      const note = notes.get(roomId)?.get(noteId);
      if (!note) return; // note was deleted concurrently — safely ignore

      note.x = x;
      note.y = y;

      // Everyone EXCEPT the dragger — they already moved it optimistically.
      socket.to(roomId).emit('note-move', { id: noteId, x, y });
    },
  );

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    const roomId = socket.data.roomId as string | undefined;
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId)!.delete(socket.id);
      io.to(roomId).emit('presence-update', getRoomUsers(roomId));

      // Avoid leaking memory: remove the room entry once nobody's left in it
      if (rooms.get(roomId)!.size === 0) {
        rooms.delete(roomId);
        notes.delete(roomId);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.io server listening on port ${PORT}`);
});
