// Request splitting for the translation provider. No network.
import { describe, expect, test } from 'vitest';
import { chunkSegments } from '../src/services/googleTranslate';
import type { TranslationSegment } from '../src/services/articleTranslation';

const seg = (key: string, format: 'html' | 'text', length: number): TranslationSegment => ({
  key,
  format,
  source: 'x'.repeat(length),
});

describe('chunkSegments', () => {
  test('keeps html and plain text in separate requests', () => {
    const chunks = chunkSegments(
      [seg('a', 'html', 1), seg('b', 'text', 1), seg('c', 'html', 1)],
      { maxItems: 10, maxChars: 100 },
    );
    expect(chunks.map((chunk) => chunk.map((s) => s.key))).toEqual([['a', 'c'], ['b']]);
  });

  test('respects the item cap', () => {
    const chunks = chunkSegments(
      [seg('a', 'text', 1), seg('b', 'text', 1), seg('c', 'text', 1)],
      { maxItems: 2, maxChars: 100 },
    );
    expect(chunks.map((chunk) => chunk.length)).toEqual([2, 1]);
  });

  test('respects the character cap, and sends an oversized segment alone', () => {
    const chunks = chunkSegments(
      [seg('a', 'text', 40), seg('b', 'text', 40), seg('big', 'text', 500), seg('c', 'text', 10)],
      { maxItems: 10, maxChars: 100 },
    );
    expect(chunks.map((chunk) => chunk.map((s) => s.key))).toEqual([['a', 'b'], ['big'], ['c']]);
  });

  test('loses and duplicates nothing', () => {
    const segments = Array.from({ length: 50 }, (_, i) =>
      seg(`k${i}`, i % 3 ? 'text' : 'html', (i * 37) % 90),
    );
    const keys = chunkSegments(segments, { maxItems: 7, maxChars: 200 }).flat().map((s) => s.key);
    expect([...keys].sort()).toEqual(segments.map((s) => s.key).sort());
  });
});
