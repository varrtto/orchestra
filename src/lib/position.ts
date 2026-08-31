/** Gap between positions for fractional ordering. */
export const POSITION_GAP = 1024;

export function positionsForCount(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * POSITION_GAP);
}

export function nextPosition(items: { position: number }[]): number {
  if (items.length === 0) return POSITION_GAP;
  return Math.max(...items.map((i) => i.position)) + POSITION_GAP;
}

export function reindexPositions<T extends { id: string; position: number }>(
  items: T[],
): T[] {
  return items.map((item, index) => ({
    ...item,
    position: (index + 1) * POSITION_GAP,
  }));
}
