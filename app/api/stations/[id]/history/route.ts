// app/api/stations/[id]/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStationHistory } from '@/lib/db';
import type { FuelType } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const { searchParams } = req.nextUrl;
  const fuel = (searchParams.get('fuel') ?? 'g95') as FuelType;
  const days = parseInt(searchParams.get('days') ?? '30', 10);

  const history = await getStationHistory(id, fuel, days);
  return NextResponse.json(history);
}
