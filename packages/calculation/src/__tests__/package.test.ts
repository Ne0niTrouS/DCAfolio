import { describe, expect, it } from 'vitest';

describe('@dcafolio/calculation package', () => {
  it('is importable as a workspace package', async () => {
    const calculation = await import('../index');
    expect(calculation).toBeTypeOf('object');
  });
});
