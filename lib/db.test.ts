// lib/db.test.ts
import { getRecentSnapshot } from './db';

describe('getRecentSnapshot', () => {
  it('returns null for unknown station', async () => {
    const result = await getRecentSnapshot('NONEXISTENT_ID_999', 'g95');
    expect(result).toBeNull();
  });
});
