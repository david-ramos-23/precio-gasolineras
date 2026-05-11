// app/api/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchGovData } from '@/lib/govApi';
import { bulkUpsertStations, bulkInsertSnapshots, getFavoritesWithCurrentPrice, getPreviousAverages, getLastIngestFecha, setLastIngestFecha, setLastCheckedAt, getAdminLocation } from '@/lib/db';
import { mean, mode } from '@/lib/math';
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

async function runIngest(isSummary: boolean, force = false): Promise<NextResponse> {
  try {
    await setLastCheckedAt();
    const { stations, prices, fecha } = await fetchGovData();

    // Skip if government API hasn't published new data since last ingest
    if (fecha && !force) {
      const lastFecha = await getLastIngestFecha();
      if (lastFecha === fecha) {
        return NextResponse.json({ ok: true, skipped: true, fecha });
      }
    }

    for (let i = 0; i < stations.length; i += CHUNK_SIZE) {
      await bulkUpsertStations(stations.slice(i, i + CHUNK_SIZE));
    }

    const snapshots = prices.map(p => ({ stationId: p.stationId, fuel: p.fuel as FuelType, price: p.price }));
    for (let i = 0; i < snapshots.length; i += CHUNK_SIZE) {
      await bulkInsertSnapshots(snapshots.slice(i, i + CHUNK_SIZE));
    }

    const home = await getAdminLocation() ?? getHomeConfig();
    const scopedStations = home
      ? stations.filter(s =>
          s.lat != null && s.lng != null &&
          haversineKm(home.lat, home.lng, s.lat, s.lng) <= home.radiusKm
        )
      : stations;
    const scopedIds = scopedStations.map(s => s.id);
    const scopedIdsSet = new Set(scopedIds);

    const scopedG95Prices = prices.filter(p => p.fuel === 'g95' && scopedIdsSet.has(p.stationId)).map(p => p.price);
    const scopedDieselPrices = prices.filter(p => p.fuel === 'diesel' && scopedIdsSet.has(p.stationId)).map(p => p.price);

    const province = mode(scopedStations.map(s => s.province).filter((p): p is string => Boolean(p))) ?? 'España';
    const { avgG95Prev, avgDieselPrev } = await getPreviousAverages(scopedIds);
    const avgG95Now = mean(scopedG95Prices);
    const avgDieselNow = mean(scopedDieselPrices);

    const favorites = await getFavoritesWithCurrentPrice('g95');
    const favoriteChanges = favorites
      .filter(f => f.price != null)
      .map(f => ({ label: f.label, price: f.price!, prevPrice: f.prevPrice }));

    console.log('[ingest] prices scope:', { scopedCount: scopedIds.length, avgG95Now, avgDieselNow });

    const ALERT_THRESHOLD_EUR = 0.100; // minimum price change (€) to trigger Telegram notification
    const g95Delta = avgG95Now !== null && avgG95Prev !== null ? Math.abs(avgG95Now - avgG95Prev) : null;
    const dieselDelta = avgDieselNow !== null && avgDieselPrev !== null ? Math.abs(avgDieselNow - avgDieselPrev) : null;
    const priceMovedEnough = (g95Delta !== null && g95Delta >= ALERT_THRESHOLD_EUR)
      || (dieselDelta !== null && dieselDelta >= ALERT_THRESHOLD_EUR);
    const firstRun = (avgG95Prev === null && avgG95Now !== null) || (avgDieselPrev === null && avgDieselNow !== null);
    const shouldNotify = isSummary || firstRun || priceMovedEnough;

    console.log('[ingest] alert check:', { g95Delta, dieselDelta, shouldNotify, isSummary });

    if (shouldNotify && (avgG95Now !== null || avgDieselNow !== null)) {
      const stationMap = new Map(scopedStations.map(s => [s.id, s.name]));
      const scopedG95 = prices.filter(p => p.fuel === 'g95' && scopedIdsSet.has(p.stationId));
      const scopedDiesel = prices.filter(p => p.fuel === 'diesel' && scopedIdsSet.has(p.stationId));
      const cheapestG95Entry = scopedG95.length > 0 ? scopedG95.reduce((min, p) => p.price < min.price ? p : min) : null;
      const cheapestDieselEntry = scopedDiesel.length > 0 ? scopedDiesel.reduce((min, p) => p.price < min.price ? p : min) : null;
      const cheapestG95 = cheapestG95Entry ? { name: stationMap.get(cheapestG95Entry.stationId) ?? 'Desconocida', price: cheapestG95Entry.price } : null;
      const cheapestDiesel = cheapestDieselEntry ? { name: stationMap.get(cheapestDieselEntry.stationId) ?? 'Desconocida', price: cheapestDieselEntry.price } : null;

      const insightText = await generateInsight({
        avgG95: avgG95Now, avgG95Prev,
        avgDiesel: avgDieselNow, avgDieselPrev,
        province, favoriteChanges, isSummary,
        cheapestG95, cheapestDiesel,
      });
      await sendTelegramMessage(insightText);
    }

    if (fecha) await setLastIngestFecha(fecha);
    return NextResponse.json({ ok: true, stationsProcessed: stations.length, snapshotsInserted: snapshots.length, fecha });
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
  const force = req.nextUrl.searchParams.get('force') === '1';
  return runIngest(isSummary, force);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-ingest-secret') ?? '';
  if (!verifyIngestSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const isSummary = req.nextUrl.searchParams.get('summary') === '1';
  const force = req.nextUrl.searchParams.get('force') === '1';
  return runIngest(isSummary, force);
}
