export function getHomeConfig(): { lat: number; lng: number; radiusKm: number } | null {
  const lat = Number(process.env.HOME_LAT);
  const lng = Number(process.env.HOME_LNG);
  const radiusKm = Number(process.env.HOME_RADIUS_KM ?? 30);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return null;
  return { lat, lng, radiusKm };
}
