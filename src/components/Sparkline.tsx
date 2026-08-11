import {
  chartRange,
  hasAdjacentPair,
  lineSegments,
  type ChartRange,
} from "@/lib/chart";

const WIDTH = 76;
const HEIGHT = 24;
const PADDING = 4;
const MARKER_RADIUS = 1.75;

function position(
  value: number,
  index: number,
  count: number,
  range: ChartRange,
): [number, number] {
  const x =
    count === 1
      ? WIDTH / 2
      : PADDING + (index * (WIDTH - PADDING * 2)) / (count - 1);
  const ratio = (value - range.min) / (range.max - range.min);
  const y = HEIGHT - PADDING - ratio * (HEIGHT - PADDING * 2);
  return [x, y];
}

export default function Sparkline({
  values,
  minRange,
}: {
  values: (number | null)[];
  minRange: number | null;
}) {
  const range = chartRange(values, minRange);
  if (!range || !hasAdjacentPair(values)) return null;

  const plotted = values.map((value, index) =>
    value === null ? null : position(value, index, values.length, range),
  );

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      className="block"
      aria-hidden
    >
      {lineSegments(plotted).map((segment) => (
        <line
          key={segment.key}
          x1={segment.from[0]}
          y1={segment.from[1]}
          x2={segment.to[0]}
          y2={segment.to[1]}
          className="stroke-primary"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ))}

      {plotted.map((point, index) =>
        point ? (
          <circle
            key={index}
            cx={point[0]}
            cy={point[1]}
            r={MARKER_RADIUS}
            className="fill-primary"
          />
        ) : null,
      )}
    </svg>
  );
}
