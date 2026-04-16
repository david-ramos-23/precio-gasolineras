// app/api/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFavorites, addFavorite, removeFavorite } from '@/lib/db';

export async function GET(): Promise<NextResponse> {
  const favorites = await getFavorites();
  return NextResponse.json(favorites);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { stationId, label } = await req.json();
  if (!stationId) return NextResponse.json({ error: 'stationId required' }, { status: 400 });
  await addFavorite(stationId, label ?? '');
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const { stationId } = await req.json();
  if (!stationId) return NextResponse.json({ error: 'stationId required' }, { status: 400 });
  await removeFavorite(stationId);
  return NextResponse.json({ ok: true });
}
