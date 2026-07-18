import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/boards/:roomId/notes
export async function POST(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const { text, color, author, x, y } = await req.json();

  if (!text?.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: { text: text.trim(), color, author, x, y, boardId: roomId },
  });

  return NextResponse.json(note, { status: 201 });
}
