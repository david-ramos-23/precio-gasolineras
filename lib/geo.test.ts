import { haversineKm, boundingBox } from './geo';

describe('haversineKm', () => {
  it('returns ~0 for same point', () => {
    expect(haversineKm(40.4, -3.7, 40.4, -3.7)).toBeCloseTo(0);
  });

  it('returns ~500-530km between Madrid and Barcelona', () => {
    const d = haversineKm(40.4168, -3.7038, 41.3851, 2.1734);
    expect(d).toBeGreaterThan(500);
    expect(d).toBeLessThan(530);
  });
});

describe('boundingBox', () => {
  it('returns a box covering at least the requested radius', () => {
    const box = boundingBox(40.4, -3.7, 10);
    expect(box.latMax - box.latMin).toBeGreaterThan(0.1);
    expect(box.lngMax - box.lngMin).toBeGreaterThan(0.1);
  });
});
