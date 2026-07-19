import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/notes/:noteId  — persist a moved note's final position
export async function PATCH(req: Request, { params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;
  const { x, y } = await req.json();

  // .catch swallows the "note was deleted mid-drag" race — idempotent, harmless.
  await prisma.note.update({ where: { id: noteId }, data: { x, y } }).catch(() => {});

  return new NextResponse(null, { status: 204 });
}

// DELETE /api/notes/:noteId
export async function DELETE(_req: Request, { params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;
  await prisma.note.delete({ where: { id: noteId } }).catch(() => {});
  return new NextResponse(null, { status: 204 });
}
