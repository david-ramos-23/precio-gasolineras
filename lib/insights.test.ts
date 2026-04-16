import { buildInsightPrompt } from './insights';

describe('buildInsightPrompt', () => {
  it('includes price and province in prompt', () => {
    const prompt = buildInsightPrompt({
      avgG95: 1.499,
      avgG95Prev: 1.529,
      avgDiesel: 1.439,
      avgDieselPrev: 1.449,
      province: 'MADRID',
      favoriteChanges: [],
      isSummary: false,
    });
    expect(prompt).toContain('1.499');
    expect(prompt).toContain('MADRID');
  });
});
