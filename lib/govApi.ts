// lib/govApi.ts
import type { FuelType, Station } from './types';

const GOV_API_URL =
  'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';

function parseSpanishFloat(s: string): number | null {
  if (!s || s.trim() === '') return null;
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseGovResponse(data: any): {
  stations: Station[];
  prices: Array<{ stationId: string; fuel: FuelType; price: number }>;
} {
  const stations: Station[] = [];
  const prices: Array<{ stationId: string; fuel: FuelType; price: number }> = [];

  for (const item of data.ListaEESSPrecio ?? []) {
    const id: string = item['IDEESS'];
    if (!id) continue;

    const lat = parseSpanishFloat(item['Latitud']);
    const lng = parseSpanishFloat(item['Longitud']);
    if (lat === null || lng === null) continue;

    stations.push({
      id,
      name: item['Rótulo'] ?? '',
      brand: item['Rótulo'] ?? '',
      lat,
      lng,
      address: item['Dirección'] ?? '',
      province: item['Provincia'] ?? '',
      municipality: item['Municipio'] ?? '',
    });

    const g95 = parseSpanishFloat(item['Precio Gasolina 95 E5']);
    if (g95 !== null) prices.push({ stationId: id, fuel: 'g95', price: g95 });

    const diesel = parseSpanishFloat(item['Precio Gasoleo A']);
    if (diesel !== null) prices.push({ stationId: id, fuel: 'diesel', price: diesel });
  }

  return { stations, prices };
}

export async function fetchGovData(): Promise<{
  stations: Station[];
  prices: Array<{ stationId: string; fuel: FuelType; price: number }>;
}> {
  const res = await fetch(GOV_API_URL, { next: { revalidate: 0 } } as RequestInit);
  if (!res.ok) throw new Error(`Gov API error: ${res.status}`);
  const data = await res.json();
  return parseGovResponse(data);
}
