// app/api/stations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStationsInBounds } from '@/lib/db';
import { haversineKm, boundingBox } from '@/lib/geo';
import type { FuelType } from '@/lib/types';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');
  const radius = parseFloat(searchParams.get('radius') ?? '10');
  const fuel = (searchParams.get('fuel') ?? 'g95') as FuelType;

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  const box = boundingBox(lat, lng, radius);
  const rows = await getStationsInBounds(box.latMin, box.latMax, box.lngMin, box.lngMax, fuel);

  const stations = rows
    .map(r => ({
      ...r,
      distanceKm: haversineKm(lat, lng, r.lat, r.lng),
      priceDelta: r.currentPrice !== null && r.prevPrice !== null ? r.currentPrice - r.prevPrice : null,
    }))
    .filter(s => s.distanceKm <= radius && s.currentPrice !== null)
    .sort((a, b) => (a.currentPrice ?? 999) - (b.currentPrice ?? 999));

  return NextResponse.json(stations);
}
