import { describe, expect, it } from 'vitest';

import { DONUT_RADIUS, slicePaths, type DonutSegment } from '../donut-geometry';

function segment(id: string, percent: number): DonutSegment {
  return { id, label: id, percent };
}

/** The `A` command's large-arc flag, which decides which way round the arc goes. */
function largeArcFlag(d: string): string {
  return d.split(' A ')[1]!.split(' ')[3]!;
}

describe('slicePaths', () => {
  it('gives every segment its own arc', () => {
    const paths = slicePaths([segment('a', 50), segment('b', 30), segment('c', 20)]);

    expect(paths.map((path) => path.id)).toEqual(['a', 'b', 'c']);
    // Distinct geometry per slice is the whole point: a shared path is what
    // made a click anywhere on the ring land on whichever drew last.
    expect(new Set(paths.map((path) => path.d)).size).toBe(3);
  });

  it('starts at twelve o clock', () => {
    const [first] = slicePaths([segment('a', 25), segment('b', 75)]);

    expect(first?.d).toMatch(/^M 84 (12|12\.00)? ?/);
  });

  it('picks up where the previous slice stopped', () => {
    const [first, second] = slicePaths([segment('a', 25), segment('b', 75)]);
    // `A rx ry rotation large-arc sweep x y` — the endpoint is the last pair.
    const end = first!.d.split(' A ')[1]!.split(' ').slice(5).join(' ');

    expect(second?.d.startsWith(`M ${end}`)).toBe(true);
  });

  it('takes the long way round for a slice over half the ring', () => {
    const [big] = slicePaths([segment('a', 60), segment('b', 40)]);
    const [small] = slicePaths([segment('a', 40), segment('b', 60)]);

    expect(largeArcFlag(big!.d)).toBe('1');
    expect(largeArcFlag(small!.d)).toBe('0');
  });

  it('closes a full ring with two arcs rather than collapsing to nothing', () => {
    // One holding is 100%: an arc from a point back to itself draws nothing.
    const [only] = slicePaths([segment('a', 100)]);

    expect(only?.d.match(/ A /g)).toHaveLength(2);
    expect(only?.d).toContain(`${DONUT_RADIUS}`);
  });

  it('never runs a slice past the end of the ring', () => {
    // Allocation percentages are computed elsewhere and could exceed 100 by a
    // rounding hair; the drawing must not wrap around on top of itself.
    const paths = slicePaths([segment('a', 80), segment('b', 80)]);

    expect(paths).toHaveLength(2);
    expect(paths[1]?.d).not.toContain('NaN');
  });

  it('ignores a negative percentage rather than drawing backwards', () => {
    const [first, second] = slicePaths([segment('a', -10), segment('b', 100)]);

    expect(first?.d).not.toContain('NaN');
    expect(second?.d.match(/ A /g)).toHaveLength(2);
  });
});
