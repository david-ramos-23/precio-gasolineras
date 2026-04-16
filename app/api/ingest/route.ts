// app/api/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchGovData } from '@/lib/govApi';
import { bulkUpsertStations, bulkInsertSnapshots, getFavoritesWithCurrentPrice } from '@/lib/db';
import { generateInsight } from '@/lib/insights';
import { sendTelegramMessage } from '@/lib/telegram';
import type { FuelType } from '@/lib/types';

export function verifyIngestSecret(header: string): boolean {
  const secret = process.env.INGEST_SECRET;
  if (!secret || !header) return false;
  return header === secret;
}

const CHUNK_SIZE = 500;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-ingest-secret') ?? '';
  if (!verifyIngestSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isSummary = req.nextUrl.searchParams.get('summary') === '1';

  try {
    const { stations, prices } = await fetchGovData();

    // Bulk upsert stations in chunks
    for (let i = 0; i < stations.length; i += CHUNK_SIZE) {
      await bulkUpsertStations(stations.slice(i, i + CHUNK_SIZE));
    }

    // Bulk insert price snapshots in chunks
    const snapshots = prices.map(p => ({ stationId: p.stationId, fuel: p.fuel as FuelType, price: p.price }));
    for (let i = 0; i < snapshots.length; i += CHUNK_SIZE) {
      await bulkInsertSnapshots(snapshots.slice(i, i + CHUNK_SIZE));
    }

    // Build averages for insight
    const g95Prices = prices.filter(p => p.fuel === 'g95').map(p => p.price);
    const dieselPrices = prices.filter(p => p.fuel === 'diesel').map(p => p.price);
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    const favorites = await getFavoritesWithCurrentPrice('g95');
    const favoriteChanges = favorites.map(f => ({
      label: f.label,
      price: f.price ?? 0,
      prevPrice: f.prevPrice,
    }));

    const insightText = await generateInsight({
      avgG95: avg(g95Prices),
      avgG95Prev: null,
      avgDiesel: avg(dieselPrices),
      avgDieselPrev: null,
      province: 'España',
      favoriteChanges,
      isSummary,
    });

    await sendTelegramMessage(insightText);

    return NextResponse.json({
      ok: true,
      stationsProcessed: stations.length,
      snapshotsInserted: snapshots.length,
    });
  } catch (err) {
    console.error('[ingest] error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
