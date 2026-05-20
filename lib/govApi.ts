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
    const lng = parseSpanishFloat(item['Longitud (WGS84)']);
    if (lat === null || lng === null) continue;

    const ventaRestringida = item['Tipo Venta'] === 'R';

    stations.push({
      id,
      name: item['Rótulo'] ?? '',
      brand: item['Rótulo'] ?? '',
      lat,
      lng,
      address: item['Dirección'] ?? '',
      province: item['Provincia'] ?? '',
      municipality: item['Municipio'] ?? '',
      ventaRestringida,
    });

    const fuelFields: Array<[FuelType, string]> = [
      ['g95',    'Precio Gasolina 95 E5'],
      ['diesel', 'Precio Gasoleo A'],
      ['g98',    'Precio Gasolina 98 E5'],
      ['glp',    'Precio Gases licuados del petróleo'],
      ['gnc',    'Precio Gas Natural Comprimido'],
    ];

    for (const [fuel, field] of fuelFields) {
      const price = parseSpanishFloat(item[field]);
      if (price !== null) prices.push({ stationId: id, fuel, price });
    }
  }

  return { stations, prices };
}

export async function fetchGovData(): Promise<{
  stations: Station[];
  prices: Array<{ stationId: string; fuel: FuelType; price: number }>;
  fecha: string | null;
}> {
  const res = await fetch(GOV_API_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Gov API error: ${res.status}`);
  const data = await res.json();
  return { ...parseGovResponse(data), fecha: (data.Fecha as string) ?? null };
}
