// lib/types.ts
export type FuelType = 'g95' | 'diesel';

export interface Station {
  id: string;
  name: string;
  brand: string;
  lat: number;
  lng: number;
  address: string;
  province: string;
  municipality: string;
}

export interface StationWithPrice extends Station {
  price: number | null;
  priceDelta: number | null; // change vs previous snapshot
  distanceKm: number;
}

export interface PriceSnapshot {
  stationId: string;
  fuelType: FuelType;
  price: number;
  capturedAt: string;
}
