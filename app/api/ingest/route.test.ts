// app/api/ingest/route.test.ts
jest.mock('@/lib/db', () => ({
  bulkUpsertStations: jest.fn(),
  bulkInsertSnapshots: jest.fn(),
  getFavoritesWithCurrentPrice: jest.fn(),
  getPreviousAverages: jest.fn(),
  mean: jest.fn(),
  mode: jest.fn(),
}));
jest.mock('@/lib/govApi', () => ({ fetchGovData: jest.fn() }));
jest.mock('@/lib/insights', () => ({ generateInsight: jest.fn() }));
jest.mock('@/lib/telegram', () => ({ sendTelegramMessage: jest.fn() }));
jest.mock('@/lib/config', () => ({ getHomeConfig: jest.fn().mockReturnValue(null) }));
jest.mock('@/lib/geo', () => ({ haversineKm: jest.fn() }));

import { verifyIngestSecret } from './route';

describe('verifyIngestSecret', () => {
  it('returns true when header matches env var', () => {
    process.env.INGEST_SECRET = 'test-secret-abc';
    expect(verifyIngestSecret('test-secret-abc')).toBe(true);
  });

  it('returns false when header is wrong', () => {
    process.env.INGEST_SECRET = 'test-secret-abc';
    expect(verifyIngestSecret('wrong')).toBe(false);
  });

  it('returns false when header is empty', () => {
    expect(verifyIngestSecret('')).toBe(false);
  });
});
