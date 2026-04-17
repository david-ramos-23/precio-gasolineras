export function getHomeConfig(): { lat: number; lng: number; radiusKm: number } | null {
  const rawLat = process.env.HOME_LAT;
  const rawLng = process.env.HOME_LNG;
  if (!rawLat || !rawLng) return null;
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  const radiusKm = Number(process.env.HOME_RADIUS_KM ?? 30);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) return null;
  return { lat, lng, radiusKm };
}
