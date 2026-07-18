import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

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
    },
  );

  socket.on('note-create', ({ roomId, note }: { roomId: string; note: unknown }) => {
    socket.to(roomId).emit('note-create', note);
  });

  socket.on(
    'note-move',
    ({ roomId, id, x, y }: { roomId: string; id: string; x: number; y: number }) => {
      socket.to(roomId).emit('note-move', { id, x, y });
    },
  );

  socket.on('note-delete', ({ roomId, noteId }: { roomId: string; noteId: string }) => {
    socket.to(roomId).emit('note-delete', noteId);
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

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    const roomId = socket.data.roomId as string | undefined;
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId)!.delete(socket.id);
      io.to(roomId).emit('presence-update', getRoomUsers(roomId));

      // Avoid leaking memory: remove the room entry once nobody's left in it
      if (rooms.get(roomId)!.size === 0) {
        rooms.delete(roomId);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.io server listening on port ${PORT}`);
});
