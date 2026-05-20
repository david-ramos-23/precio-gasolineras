// app/api/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchGovData } from '@/lib/govApi';
import { bulkUpsertStations, bulkInsertSnapshots, getFavoritesWithCurrentPrice, getPreviousAverages, getLastCheckedAt, setLastCheckedAt, logIngestRun, markAlertSent, getAdminLocation, getPreviousCheapestPrices, setPreviousCheapestPrices, cleanupOldSnapshots } from '@/lib/db';
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
    const { stations, prices, fecha } = await fetchGovData();

    // Time-based dedup: skip if last successful ingest was < 25 min ago
    if (!force) {
      const lastCheckedAt = await getLastCheckedAt();
      if (lastCheckedAt) {
        const minutesSince = (Date.now() - new Date(lastCheckedAt).getTime()) / 60000;
        if (minutesSince < 25) {
          return NextResponse.json({ ok: true, skipped: true, lastCheckedAt });
        }
      }
    }

    if (stations.length === 0) {
      return NextResponse.json({ error: 'Gov API returned 0 stations — aborting ingest' }, { status: 502 });
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

    const stationMap = new Map(scopedStations.map(s => [s.id, s.name]));
    const scopedG95 = prices.filter(p => p.fuel === 'g95' && scopedIdsSet.has(p.stationId));
    const scopedDiesel = prices.filter(p => p.fuel === 'diesel' && scopedIdsSet.has(p.stationId));
    const cheapestG95Entry = scopedG95.length > 0 ? scopedG95.reduce((min, p) => p.price < min.price ? p : min) : null;
    const cheapestDieselEntry = scopedDiesel.length > 0 ? scopedDiesel.reduce((min, p) => p.price < min.price ? p : min) : null;
    const cheapestG95 = cheapestG95Entry ? { name: stationMap.get(cheapestG95Entry.stationId) ?? 'Desconocida', price: cheapestG95Entry.price } : null;
    const cheapestDiesel = cheapestDieselEntry ? { name: stationMap.get(cheapestDieselEntry.stationId) ?? 'Desconocida', price: cheapestDieselEntry.price } : null;

    const { g95: prevCheapestG95, diesel: prevCheapestDiesel } = await getPreviousCheapestPrices();

    const favorites = await getFavoritesWithCurrentPrice('g95');
    const favoriteChanges = favorites
      .filter(f => f.price != null)
      .map(f => ({ label: f.label, price: f.price!, prevPrice: f.prevPrice }));

    console.log('[ingest] prices scope:', { scopedCount: scopedIds.length, avgG95Now, avgDieselNow, cheapestG95: cheapestG95?.price, cheapestDiesel: cheapestDiesel?.price });

    const ALERT_THRESHOLD_EUR = 0.100; // minimum cheapest-station price change (€) to trigger Telegram notification
    const g95Delta = cheapestG95 !== null && prevCheapestG95 !== null ? Math.abs(cheapestG95.price - prevCheapestG95) : null;
    const dieselDelta = cheapestDiesel !== null && prevCheapestDiesel !== null ? Math.abs(cheapestDiesel.price - prevCheapestDiesel) : null;
    const priceMovedEnough = (g95Delta !== null && g95Delta >= ALERT_THRESHOLD_EUR)
      || (dieselDelta !== null && dieselDelta >= ALERT_THRESHOLD_EUR);
    const firstRun = (prevCheapestG95 === null && cheapestG95 !== null) || (prevCheapestDiesel === null && cheapestDiesel !== null);
    const shouldNotify = isSummary || firstRun || priceMovedEnough;

    console.log('[ingest] alert check:', { g95Delta, dieselDelta, shouldNotify, isSummary });

    const logId = await logIngestRun({
      fecha: fecha ?? null,
      g95Delta: g95Delta ?? null,
      dieselDelta: dieselDelta ?? null,
      priceMoved: priceMovedEnough,
      isSummary,
      shouldNotify,
    });

    if (shouldNotify && (avgG95Now !== null || avgDieselNow !== null)) {
      try {
        const insightText = await generateInsight({
          avgG95: avgG95Now, avgG95Prev,
          avgDiesel: avgDieselNow, avgDieselPrev,
          province, favoriteChanges, isSummary,
          cheapestG95, cheapestDiesel,
        });
        await sendTelegramMessage(insightText);
        if (logId) await markAlertSent(logId);
      } catch (alertErr) {
        console.error('[ingest] alert send failed:', alertErr);
        if (logId) await markAlertSent(logId, String(alertErr));
      }
    }

    await setPreviousCheapestPrices(cheapestG95?.price ?? null, cheapestDiesel?.price ?? null);
    await setLastCheckedAt();

    if (isSummary) await cleanupOldSnapshots();

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
