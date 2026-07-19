import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/notes/:noteId  — persist a moved note's final position
export async function PATCH(req: Request, { params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;
  const { text, x, y, author } = await req.json();
  await prisma.note.update({ where: { id: noteId }, data: { text, x, y, author } }).catch(() => {});

  return new NextResponse(null, { status: 204 });
}
// DELETE /api/notes/:noteId
export async function DELETE(_req: Request, { params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;
  await prisma.note.delete({ where: { id: noteId } }).catch(() => {});
  return new NextResponse(null, { status: 204 });
}
