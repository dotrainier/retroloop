import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { organizeNotes } from '@/lib/gemini';

// Simple in-memory cooldown per board to protect the free-tier quota.
// Caveat (good interview point): on Vercel's serverless this resets on cold
// start and isn't shared across instances — a production version would use
// Vercel KV or Upstash Redis for durable, shared rate limiting.
const lastOrganize = new Map<string, number>();
const COOLDOWN_MS = 20_000;

export async function POST(_req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  const now = Date.now();
  const last = lastOrganize.get(roomId) ?? 0;
  if (now - last < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
    return NextResponse.json(
      { error: `Please wait ${wait}s before organizing again.` },
      { status: 429 },
    );
  }

  // Read notes from the DB (source of truth) rather than trusting the client.
  const notes = await prisma.note.findMany({
    where: { boardId: roomId },
    select: { id: true, text: true },
  });

  if (notes.length < 2) {
    return NextResponse.json({ error: 'Add at least 2 notes first.' }, { status: 400 });
  }

  lastOrganize.set(roomId, now);

  try {
    const result = await organizeNotes(notes);
    return NextResponse.json(result);
  } catch (e) {
    console.error('Organize failed', e);
    return NextResponse.json({ error: 'AI organize failed. Try again.' }, { status: 500 });
  }
}
