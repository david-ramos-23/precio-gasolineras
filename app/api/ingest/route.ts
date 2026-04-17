// app/api/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchGovData } from '@/lib/govApi';
import { bulkUpsertStations, bulkInsertSnapshots, getFavoritesWithCurrentPrice, getPreviousAverages, mean, mode } from '@/lib/db';
import { generateInsight } from '@/lib/insights';
import { sendTelegramMessage } from '@/lib/telegram';
import { getHomeConfig } from '@/lib/config';
import { haversineKm } from '@/lib/geo';
import type { FuelType } from '@/lib/types';

export function verifyIngestSecret(header: string): boolean {
  const secret = process.env.INGEST_SECRET;
  if (!secret || !header) return false;
  return header === secret;
}

const CHUNK_SIZE = 500;

async function runIngest(isSummary: boolean): Promise<NextResponse> {
  try {
    const { stations, prices } = await fetchGovData();

    for (let i = 0; i < stations.length; i += CHUNK_SIZE) {
      await bulkUpsertStations(stations.slice(i, i + CHUNK_SIZE));
    }

    const snapshots = prices.map(p => ({ stationId: p.stationId, fuel: p.fuel as FuelType, price: p.price }));
    for (let i = 0; i < snapshots.length; i += CHUNK_SIZE) {
      await bulkInsertSnapshots(snapshots.slice(i, i + CHUNK_SIZE));
    }

    const home = getHomeConfig();
    const scopedStations = home
      ? stations.filter(s =>
          s.lat != null && s.lng != null &&
          haversineKm(home.lat, home.lng, s.lat, s.lng) <= home.radiusKm
        )
      : stations;
    const scopedIds = new Set(scopedStations.map(s => s.id));

    const scopedG95Prices = prices.filter(p => p.fuel === 'g95' && scopedIds.has(p.stationId)).map(p => p.price);
    const scopedDieselPrices = prices.filter(p => p.fuel === 'diesel' && scopedIds.has(p.stationId)).map(p => p.price);

    const province = mode(scopedStations.map(s => s.province).filter((p): p is string => Boolean(p))) ?? 'España';
    const { avgG95Prev, avgDieselPrev } = await getPreviousAverages();
    const avgG95Now = mean(scopedG95Prices);
    const avgDieselNow = mean(scopedDieselPrices);

    const favorites = await getFavoritesWithCurrentPrice('g95');
    const favoriteChanges = favorites.map(f => ({ label: f.label, price: f.price ?? 0, prevPrice: f.prevPrice }));

    const insightText = await generateInsight({
      avgG95: avgG95Now, avgG95Prev,
      avgDiesel: avgDieselNow, avgDieselPrev,
      province, favoriteChanges, isSummary,
    });

    await sendTelegramMessage(insightText);

    return NextResponse.json({ ok: true, stationsProcessed: stations.length, snapshotsInserted: snapshots.length });
  } catch (err) {
    console.error('[ingest] error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get('authorization');
  const secret = req.headers.get('x-ingest-secret') ?? '';
  const validCron = auth === `Bearer ${process.env.CRON_SECRET}`;
  const validSecret = verifyIngestSecret(secret);
  if (!validCron && !validSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const isSummary = req.nextUrl.searchParams.get('summary') === '1';
  return runIngest(isSummary);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-ingest-secret') ?? '';
  if (!verifyIngestSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const isSummary = req.nextUrl.searchParams.get('summary') === '1';
  return runIngest(isSummary);
}
