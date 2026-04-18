// lib/types.ts
export type FuelType = 'g95' | 'diesel' | 'g98' | 'glp' | 'gnc';

export interface Station {
  id: string;
  name: string;
  brand: string;
  lat: number;
  lng: number;
  address: string;
  province: string;
  municipality: string;
  ventaRestringida: boolean;
}

export interface StationWithPrice extends Station {
  price: number | null;
  priceDelta: number | null; // change vs previous snapshot
  distanceKm: number;
  updatedAt: string | null;
}

export interface PriceSnapshot {
  stationId: string;
  fuelType: FuelType;
  price: number;
  capturedAt: string;
}
