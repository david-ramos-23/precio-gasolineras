// lib/db.ts
import { neon } from '@neondatabase/serverless';
import type { FuelType, PriceSnapshot, Station } from './types';

const sql = neon(process.env.DATABASE_URL!);

export async function getRecentSnapshot(stationId: string, fuel: FuelType): Promise<PriceSnapshot | null> {
  const rows = await sql`
    SELECT station_id, fuel_type, price::float, captured_at
    FROM price_snapshots
    WHERE station_id = ${stationId} AND fuel_type = ${fuel}
    ORDER BY captured_at DESC
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const r = rows[0];
  return { stationId: r.station_id, fuelType: r.fuel_type as FuelType, price: r.price, capturedAt: r.captured_at };
}

export async function bulkUpsertStations(stations: Station[]): Promise<void> {
  if (stations.length === 0) return;
  const ids = stations.map(s => s.id);
  const names = stations.map(s => s.name);
  const brands = stations.map(s => s.brand);
  const lats = stations.map(s => s.lat);
  const lngs = stations.map(s => s.lng);
  const addresses = stations.map(s => s.address);
  const provinces = stations.map(s => s.province);
  const municipalities = stations.map(s => s.municipality);

  await sql`
    INSERT INTO stations (id, name, brand, lat, lng, address, province, municipality)
    SELECT * FROM unnest(
      ${ids}::text[], ${names}::text[], ${brands}::text[],
      ${lats}::float8[], ${lngs}::float8[],
      ${addresses}::text[], ${provinces}::text[], ${municipalities}::text[]
    ) AS t(id, name, brand, lat, lng, address, province, municipality)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, brand = EXCLUDED.brand,
      lat = EXCLUDED.lat, lng = EXCLUDED.lng,
      address = EXCLUDED.address, province = EXCLUDED.province,
      municipality = EXCLUDED.municipality, updated_at = now()
  `;
}

export async function bulkInsertSnapshots(
  snapshots: { stationId: string; fuel: FuelType; price: number }[]
): Promise<void> {
  if (snapshots.length === 0) return;
  const stationIds = snapshots.map(s => s.stationId);
  const fuels = snapshots.map(s => s.fuel);
  const prices = snapshots.map(s => s.price);

  await sql`
    INSERT INTO price_snapshots (station_id, fuel_type, price)
    SELECT * FROM unnest(
      ${stationIds}::text[], ${fuels}::text[], ${prices}::numeric[]
    ) AS t(station_id, fuel_type, price)
  `;
}

export async function getStationsInBounds(
  latMin: number, latMax: number, lngMin: number, lngMax: number,
  fuel: FuelType
): Promise<Array<Station & { currentPrice: number | null; prevPrice: number | null }>> {
  const rows = await sql`
    SELECT
      s.id, s.name, s.brand, s.lat, s.lng, s.address, s.province, s.municipality,
      latest.price::float AS current_price,
      prev.price::float AS prev_price
    FROM stations s
    LEFT JOIN LATERAL (
      SELECT price FROM price_snapshots
      WHERE station_id = s.id AND fuel_type = ${fuel}
      ORDER BY captured_at DESC LIMIT 1
    ) latest ON true
    LEFT JOIN LATERAL (
      SELECT price FROM price_snapshots
      WHERE station_id = s.id AND fuel_type = ${fuel}
      ORDER BY captured_at DESC LIMIT 1 OFFSET 1
    ) prev ON true
    WHERE s.lat BETWEEN ${latMin} AND ${latMax}
      AND s.lng BETWEEN ${lngMin} AND ${lngMax}
  `;
  return rows.map(r => ({
    id: r.id, name: r.name, brand: r.brand,
    lat: r.lat, lng: r.lng, address: r.address,
    province: r.province, municipality: r.municipality,
    currentPrice: r.current_price, prevPrice: r.prev_price,
  }));
}

export async function getStationHistory(
  stationId: string, fuel: FuelType, days: number
): Promise<Array<{ price: number; capturedAt: string }>> {
  const rows = await sql`
    SELECT price::float, captured_at
    FROM price_snapshots
    WHERE station_id = ${stationId}
      AND fuel_type = ${fuel}
      AND captured_at >= now() - (${days} || ' days')::interval
    ORDER BY captured_at ASC
  `;
  return rows.map(r => ({ price: r.price, capturedAt: r.captured_at }));
}

export async function getFavorites(): Promise<Array<{ stationId: string; label: string }>> {
  const rows = await sql`SELECT station_id, label FROM favorites ORDER BY label`;
  return rows.map(r => ({ stationId: r.station_id, label: r.label }));
}

export async function addFavorite(stationId: string, label: string): Promise<void> {
  await sql`INSERT INTO favorites (station_id, label) VALUES (${stationId}, ${label}) ON CONFLICT DO NOTHING`;
}

export async function removeFavorite(stationId: string): Promise<void> {
  await sql`DELETE FROM favorites WHERE station_id = ${stationId}`;
}

export async function getPreviousAverages(stationIds?: string[]): Promise<{ avgG95Prev: number | null; avgDieselPrev: number | null }> {
  let rows;
  if (stationIds && stationIds.length > 0) {
    rows = await sql`
      WITH cycle_times AS (
        SELECT DISTINCT DATE_TRUNC('hour', captured_at) AS hr
        FROM price_snapshots
        ORDER BY hr DESC
        LIMIT 2
      ),
      prev_cycle AS (
        SELECT hr FROM cycle_times OFFSET 1 LIMIT 1
      )
      SELECT
        AVG(CASE WHEN fuel_type = 'g95'    THEN price END) AS avg_g95,
        AVG(CASE WHEN fuel_type = 'diesel' THEN price END) AS avg_diesel
      FROM price_snapshots ps
      WHERE DATE_TRUNC('hour', ps.captured_at) = (SELECT hr FROM prev_cycle)
        AND ps.station_id = ANY(${stationIds})
    `;
  } else {
    rows = await sql`
      WITH cycle_times AS (
        SELECT DISTINCT DATE_TRUNC('hour', captured_at) AS hr
        FROM price_snapshots
        ORDER BY hr DESC
        LIMIT 2
      ),
      prev_cycle AS (
        SELECT hr FROM cycle_times OFFSET 1 LIMIT 1
      )
      SELECT
        AVG(CASE WHEN fuel_type = 'g95'    THEN price END) AS avg_g95,
        AVG(CASE WHEN fuel_type = 'diesel' THEN price END) AS avg_diesel
      FROM price_snapshots ps
      WHERE DATE_TRUNC('hour', ps.captured_at) = (SELECT hr FROM prev_cycle)
    `;
  }
  const row = rows[0];
  return {
    avgG95Prev: row?.avg_g95 != null ? Number(row.avg_g95) : null,
    avgDieselPrev: row?.avg_diesel != null ? Number(row.avg_diesel) : null,
  };
}


export async function getFavoritesWithCurrentPrice(fuel: FuelType): Promise<
  Array<{ stationId: string; label: string; name: string; price: number | null; prevPrice: number | null }>
> {
  const rows = await sql`
    SELECT f.station_id, f.label, s.name,
      latest.price::float AS price,
      prev.price::float AS prev_price
    FROM favorites f
    JOIN stations s ON s.id = f.station_id
    LEFT JOIN LATERAL (
      SELECT price FROM price_snapshots
      WHERE station_id = f.station_id AND fuel_type = ${fuel}
      ORDER BY captured_at DESC LIMIT 1
    ) latest ON true
    LEFT JOIN LATERAL (
      SELECT price FROM price_snapshots
      WHERE station_id = f.station_id AND fuel_type = ${fuel}
      ORDER BY captured_at DESC LIMIT 1 OFFSET 1
    ) prev ON true
    ORDER BY f.label
  `;
  return rows.map(r => ({
    stationId: r.station_id, label: r.label, name: r.name,
    price: r.price, prevPrice: r.prev_price,
  }));
}
