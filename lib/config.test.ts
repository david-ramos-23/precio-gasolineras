import { getHomeConfig } from './config';

describe('getHomeConfig', () => {
  const OLD_ENV = process.env;
  beforeEach(() => { process.env = { ...OLD_ENV }; });
  afterAll(() => { process.env = OLD_ENV; });

  it('returns config when all vars are valid', () => {
    process.env.HOME_LAT = '40.4168';
    process.env.HOME_LNG = '-3.7038';
    process.env.HOME_RADIUS_KM = '25';
    expect(getHomeConfig()).toEqual({ lat: 40.4168, lng: -3.7038, radiusKm: 25 });
  });

  it('defaults radiusKm to 30 when HOME_RADIUS_KM is absent', () => {
    process.env.HOME_LAT = '40.4168';
    process.env.HOME_LNG = '-3.7038';
    delete process.env.HOME_RADIUS_KM;
    expect(getHomeConfig()).toEqual({ lat: 40.4168, lng: -3.7038, radiusKm: 30 });
  });

  it('returns null when HOME_LAT is not a number', () => {
    process.env.HOME_LAT = 'invalid';
    process.env.HOME_LNG = '-3.7038';
    expect(getHomeConfig()).toBeNull();
  });

  it('returns null when vars are absent', () => {
    delete process.env.HOME_LAT;
    delete process.env.HOME_LNG;
    expect(getHomeConfig()).toBeNull();
  });

  it('returns valid config for equator/prime meridian (lat=0, lng=0)', () => {
    process.env.HOME_LAT = '0';
    process.env.HOME_LNG = '0';
    delete process.env.HOME_RADIUS_KM;
    expect(getHomeConfig()).toEqual({ lat: 0, lng: 0, radiusKm: 30 });
  });

  it('returns null when HOME_RADIUS_KM is not a valid number', () => {
    process.env.HOME_LAT = '40.4168';
    process.env.HOME_LNG = '-3.7038';
    process.env.HOME_RADIUS_KM = 'abc';
    expect(getHomeConfig()).toBeNull();
  });
});
