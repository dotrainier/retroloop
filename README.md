# RetroLoop

A real-time, multi-user collaborative retro & brainstorm board. Teams join a
shared board by link or code and drop sticky notes together live — with an
AI "Organize" action that clusters notes into labeled groups and summarizes
the board's key takeaways.

> **Status: early build.** This session proves the real-time sync layer end
> to end, locally. Sticky notes, persistence, and the AI feature are not
> built yet — see [Roadmap](#roadmap) below.

## Architecture

RetroLoop is split into two independently deployed pieces:

```
retroloop/
├── app/                 # Next.js frontend (this repo root)
├── socket-server/       # Separate Express + Socket.io app
```

| Piece                 | Tech                      | Hosted on | Responsibility                                    |
| --------------------- | ------------------------- | --------- | ------------------------------------------------- |
| Frontend + API routes | Next.js (App Router) + TS | Vercel    | UI, database access, AI "Organize" call           |
| Real-time server      | Express + Socket.io + TS  | Render    | Socket connections, rooms, broadcasting, presence |

**Why two separate servers?** Socket.io needs a long-lived, persistent
connection to hold open sockets. Vercel's serverless functions spin up per
request and don't stay alive — they can't host a Socket.io server. So the
real-time layer runs as its own small Node process on Render (which supports
long-running services), while the rest of the app stays on Vercel. The two
communicate over a Socket.io connection from the browser directly to Render;
regular data operations (saving boards/notes, calling the AI) go through
Next.js API routes as normal.

This keeps the socket server intentionally minimal — it only ever handles
real-time concerns (connections, rooms, broadcasting events, presence). It
has no database access and no business logic beyond relaying messages to the
right room.

## What's working right now

Built and manually verified with two simultaneous browser sessions:

- **Live messaging** — a client sends a `test-message`; every other client in
  the same room receives it instantly.
- **Presence** — each connected client gets a random guest name/color; the
  server tracks who's in each room in memory and broadcasts the live list on
  join/disconnect.
- **Live cursors** — mouse position is broadcast (throttled, and sent as
  percentage coordinates so it scales correctly across different screen/
  window sizes) and rendered as a colored, labeled dot for every other
  participant.

All of this currently runs **locally only** — the socket server on
`localhost:4000`, the Next.js app on `localhost:3000`. No Render deployment,
no database, no AI yet.

## Key concepts (Socket.io)

- **Room** — a named group a socket can join (`socket.join(roomId)`), used
  to scope broadcasts to one board instead of every connected client on the
  server.
- **`socket.emit`** — sends only to the sender.
- **`io.emit`** — sends to every connected client on the server, no
  exceptions.
- **`socket.broadcast.emit`** — everyone except the sender, server-wide.
- **`socket.to(room).emit`** — everyone in that room _except_ the sender.
  Used for messages and cursor moves — you don't want your own action
  echoed back to you.
- **`io.to(room).emit`** — everyone in that room, _including_ the sender.
  Used for presence updates — the joining client also needs the full
  current user list.

## Running locally

Requires two terminals.

**Terminal 1 — real-time server:**

```cmd
cd socket-server
npm install
npm run dev
```

Should log `Socket.io server listening on port 4000`.

**Terminal 2 — Next.js app:**

```cmd
npm install
npm run dev
```

Visit `http://localhost:3000/socket-test`.

Copy `.env.local.example` to `.env.local` first if you haven't:

```cmd
copy .env.local.example .env.local
```

Open the test page in two browser windows (e.g. one normal, one incognito)
to see live sync between them.

## Roadmap

1. ✅ Prove real-time sync (messaging, presence, cursors) — local only
2. ⬜ Sticky-note board: add/edit/delete/drag notes, synced in real time
3. ⬜ Persistence: PostgreSQL (Neon) + Prisma/Drizzle for boards and notes
4. ⬜ AI "Organize" feature: cluster notes + summarize via Gemini API
5. ⬜ Deploy socket server to Render, frontend to Vercel
6. ⬜ Polish: light/dark mode, responsive design, animations, final docs

## Tech stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS,
  socket.io-client
- **Real-time server:** Node.js, Express, Socket.io
- **Data (planned):** PostgreSQL (Neon), Prisma or Drizzle
- **AI (planned):** Google Gemini API
- **Hosting (planned):** Vercel (frontend), Render (socket server), Neon
  (database) — free tiers throughout
