'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const ROOM_ID = 'test-room';
const COLORS = ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6'];

interface RoomUser {
  socketId: string;
  name: string;
  color: string;
}

interface CursorInfo {
  name: string;
  color: string;
  x: number;
  y: number;
}

function randomName() {
  return `Guest ${Math.floor(Math.random() * 1000)}`;
}

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export default function SocketTestPage() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<RoomUser[]>([]);

  const [cursors, setCursors] = useState<Record<string, CursorInfo>>({});
  const boardRef = useRef<HTMLDivElement>(null);
  const lastSentRef = useRef(0);

  // Computed once via lazy initializer — same on every render, but WILL differ
  // between the server's render and the client's first render. That's fine
  // because we never show it until `mounted` is true (see below).
  const [myInfo] = useState(() => ({ name: randomName(), color: randomColor() }));

  // Starts false on both server and client, so their first render matches.
  // Flips true only after mounting in the browser.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: bridges SSR/client hydration mismatch
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) {
      console.error('NEXT_PUBLIC_SOCKET_URL is not set');
      return;
    }

    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', {
        roomId: ROOM_ID,
        name: myInfo.name,
        color: myInfo.color,
      });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('test-message', (message: string) => {
      setReceivedMessages((prev) => [...prev, message]);
    });

    socket.on('presence-update', (users: RoomUser[]) => {
      setOnlineUsers(users);

      const onlineIds = new Set(users.map((u) => u.socketId));
      setCursors((prev) => {
        const next: Record<string, CursorInfo> = {};
        for (const [id, info] of Object.entries(prev)) {
          if (onlineIds.has(id)) next[id] = info;
        }
        return next;
      });
    });

    socket.on(
      'cursor-move',
      (data: { socketId: string; name: string; color: string; x: number; y: number }) => {
        setCursors((prev) => ({
          ...prev,
          [data.socketId]: { name: data.name, color: data.color, x: data.x, y: data.y },
        }));
      },
    );

    return () => {
      socket.disconnect();
    };
  }, [mounted, myInfo]);

  const sendMessage = () => {
    if (!messageInput.trim() || !socketRef.current) return;
    socketRef.current.emit('test-message', { roomId: ROOM_ID, message: messageInput });
    setMessageInput('');
  };

  if (!mounted) {
    return <div style={{ padding: 24 }}>Connecting…</div>;
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!socketRef.current || !boardRef.current) return;

    // Throttle: only send at most once every 50ms (~20 updates/sec).
    // Raw mousemove can fire 100+ times/sec — sending every one of those
    // over the socket would flood the server and every other client for
    // no visual benefit.
    const now = Date.now();
    if (now - lastSentRef.current < 50) return;
    lastSentRef.current = now;

    const rect = boardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0–1
    const y = (e.clientY - rect.top) / rect.height; // 0–1

    socketRef.current.emit('cursor-move', { roomId: ROOM_ID, x, y });
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Socket.io Test</h1>
      <p>
        Status:{' '}
        <strong style={{ color: connected ? 'green' : 'red' }}>
          {connected ? 'Connected' : 'Disconnected'}
        </strong>{' '}
        as <strong style={{ color: myInfo.color }}>{myInfo.name}</strong>
      </p>

      <h3>Online ({onlineUsers.length})</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {onlineUsers.map((u) => (
          <div
            key={u.socketId}
            title={u.name}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: u.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 11,
              fontWeight: 'bold',
            }}
          >
            {u.name.replace('Guest ', '')}
          </div>
        ))}
      </div>

      <div>
        <input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder='Type a test message'
          style={{ padding: 8, marginRight: 8 }}
        />
        <button onClick={sendMessage} style={{ padding: 8 }}>
          Send
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2>Received messages:</h2>
        {receivedMessages.length === 0 && <p>(none yet)</p>}
        <ul>
          {receivedMessages.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      </div>

      <div
        ref={boardRef}
        onMouseMove={handleMouseMove}
        style={{
          position: 'relative',
          marginTop: 24,
          height: 300,
          border: '1px dashed #ccc',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#fafafa',
        }}
      >
        <p style={{ padding: 8, color: '#999', fontSize: 12 }}>
          Move your mouse here — it should show up in the other window
        </p>

        {Object.entries(cursors).map(([socketId, cur]) => (
          <div
            key={socketId}
            style={{
              position: 'absolute',
              left: `${cur.x * 100}%`,
              top: `${cur.y * 100}%`,
              pointerEvents: 'none',
              transition: 'left 0.05s linear, top 0.05s linear',
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: cur.color,
              }}
            />
            <span
              style={{
                fontSize: 11,
                background: cur.color,
                color: 'white',
                padding: '1px 6px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
              }}
            >
              {cur.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
