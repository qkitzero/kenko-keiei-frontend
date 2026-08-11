const MIN_RANGE_RATIO = 0.04;

const MIN_RANGE_FLOOR = 0.01;

const RANGE_PADDING = 0.12;

export function hasAdjacentPair(values: (number | null)[]): boolean {
  for (let index = 0; index < values.length - 1; index += 1) {
    if (values[index] !== null && values[index + 1] !== null) return true;
  }
  return false;
}

export type ChartRange = { min: number; max: number };

export function chartRange(
  values: (number | null)[],
  minRange: number | null,
): ChartRange | null {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) return null;

  const lowest = Math.min(...present);
  const highest = Math.max(...present);
  const center = (lowest + highest) / 2;
  const floor =
    minRange ?? Math.max(Math.abs(center) * MIN_RANGE_RATIO, MIN_RANGE_FLOOR);
  const range = Math.max(highest - lowest, floor);
  const padding = range * RANGE_PADDING;

  return {
    min: center - range / 2 - padding,
    max: center + range / 2 + padding,
  };
}

export type Segment = {
  key: string;
  from: [number, number];
  to: [number, number];
};

export function lineSegments(points: ([number, number] | null)[]): Segment[] {
  const segments: Segment[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    if (!from || !to) continue;
    segments.push({ key: `${index}`, from, to });
  }
  return segments;
}

export function lastIndexOfValue(values: (number | null)[]): number {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (values[index] !== null) return index;
  }
  return -1;
}
