import { priceColor, interpolateHex } from './priceColor';

describe('interpolateHex', () => {
  it('returns start color at t=0', () => {
    expect(interpolateHex('#000000', '#ffffff', 0)).toBe('#000000');
  });
  it('returns end color at t=1', () => {
    expect(interpolateHex('#000000', '#ffffff', 1)).toBe('#ffffff');
  });
  it('returns midpoint at t=0.5', () => {
    // 0x00 + 0.5*(0xff-0x00) = 127.5 floors to 127 = 0x7f
    expect(interpolateHex('#000000', '#ffffff', 0.5)).toBe('#7f7f7f');
  });
});

describe('priceColor', () => {
  it('returns amber when min === max (no spread)', () => {
    expect(priceColor(1.5, 1.5, 1.5)).toBe('#eab308');
  });
  it('returns green for the cheapest station (t=0)', () => {
    expect(priceColor(1.4, 1.4, 1.8)).toBe('#22c55e');
  });
  it('returns red for the most expensive station (t=1)', () => {
    expect(priceColor(1.8, 1.4, 1.8)).toBe('#ef4444');
  });
  it('returns a value between green and red for a midpoint price', () => {
    const mid = priceColor(1.6, 1.4, 1.8);
    expect(mid).not.toBe('#22c55e');
    expect(mid).not.toBe('#ef4444');
    expect(mid).toMatch(/^#[0-9a-f]{6}$/);
  });
  it('clamps below min to green', () => {
    expect(priceColor(1.0, 1.4, 1.8)).toBe('#22c55e');
  });
  it('clamps above max to red', () => {
    expect(priceColor(2.5, 1.4, 1.8)).toBe('#ef4444');
  });
});
