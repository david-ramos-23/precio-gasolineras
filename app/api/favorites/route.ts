// app/api/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getFavorites, addFavorite, removeFavorite } from '@/lib/db';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  const favorites = await getFavorites(session.user.id);
  return NextResponse.json(favorites);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  const { stationId, label } = await req.json();
  if (!stationId) return NextResponse.json({ error: 'stationId required' }, { status: 400 });
  await addFavorite(session.user.id, stationId, label ?? '');
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  const { stationId } = await req.json();
  if (!stationId) return NextResponse.json({ error: 'stationId required' }, { status: 400 });
  await removeFavorite(session.user.id, stationId);
  return NextResponse.json({ ok: true });
}
