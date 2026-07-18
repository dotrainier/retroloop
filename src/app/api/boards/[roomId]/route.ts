import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  const board = await prisma.board.upsert({
    where: { id: roomId },
    update: {},
    create: { id: roomId },
    include: { notes: true },
  });

  return NextResponse.json(board);
}
