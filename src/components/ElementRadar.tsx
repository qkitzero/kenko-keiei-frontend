import {
  MIN_RADAR_ELEMENTS,
  RANK_BOUNDARIES,
  TYPICAL_Z_SCORE_RANGE,
  Z_SCORE_MAX,
  Z_SCORE_MIN,
} from "@/lib/judgment";

const RADIUS = 82;
const LABEL_GAP = 16;
const LABEL_RADIUS = RADIUS + LABEL_GAP;
const LABEL_FONT_SIZE = 12;
const LABEL_MAX_CHARS = 5;
const LABEL_WIDTH = LABEL_FONT_SIZE * LABEL_MAX_CHARS;
const LABEL_OFFSET = LABEL_FONT_SIZE / 2;

const WIDTH = Math.ceil(
  2 * (LABEL_RADIUS * Math.cos(Math.PI / 6) + LABEL_WIDTH),
);
const HEIGHT = Math.ceil(2 * (LABEL_RADIUS + LABEL_OFFSET + LABEL_FONT_SIZE));
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;

export type ElementPoint = {
  element: string;
  label: string;
  zScore: number | null;
};

function vertex(
  index: number,
  radius: number,
  count: number,
): [number, number] {
  const angle = ((-90 + (index * 360) / count) * Math.PI) / 180;
  return [
    CENTER_X + radius * Math.cos(angle),
    CENTER_Y + radius * Math.sin(angle),
  ];
}

function polygonPoints(radius: number, count: number): string {
  return Array.from({ length: count }, (_, index) =>
    vertex(index, radius, count).join(","),
  ).join(" ");
}

function ringPath(
  outerRadius: number,
  innerRadius: number,
  count: number,
): string {
  const outline = (radius: number) =>
    Array.from({ length: count }, (_, index) => {
      const [x, y] = vertex(index, radius, count);
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ") + " Z";

  return `${outline(outerRadius)} ${outline(innerRadius)}`;
}

function radiusForZScore(zScore: number): number {
  const ratio = (zScore - Z_SCORE_MIN) / (Z_SCORE_MAX - Z_SCORE_MIN);
  return Math.min(Math.max(ratio, 0), 1) * RADIUS;
}

export default function ElementRadar({ points }: { points: ElementPoint[] }) {
  const count = points.length;
  const measured = points.filter((point) => point.zScore !== null);
  if (count < MIN_RADAR_ELEMENTS || measured.length < MIN_RADAR_ELEMENTS) {
    return null;
  }

  const [typicalMin, typicalMax] = TYPICAL_Z_SCORE_RANGE;

  const plotted = points.map((point, index) =>
    point.zScore === null
      ? null
      : vertex(index, radiusForZScore(point.zScore), count),
  );

  const segments = plotted.flatMap((from, index) => {
    const to = plotted[(index + 1) % count];
    if (!from || !to) return [];
    return [{ key: `${index}`, from, to }];
  });

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ width: WIDTH, maxWidth: "100%" }}
      aria-hidden
    >
      <path
        d={ringPath(
          radiusForZScore(typicalMax),
          radiusForZScore(typicalMin),
          count,
        )}
        fillRule="evenodd"
        className="fill-surface-muted"
      />

      {RANK_BOUNDARIES.map((boundary) => (
        <polygon
          key={boundary}
          points={polygonPoints(radiusForZScore(boundary), count)}
          className="stroke-border fill-none"
          strokeWidth={1}
        />
      ))}

      <polygon
        points={polygonPoints(RADIUS, count)}
        className="stroke-border-strong fill-none"
        strokeWidth={1}
      />

      {points.map((point, index) => {
        const [x, y] = vertex(index, RADIUS, count);
        return (
          <line
            key={point.element}
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={x}
            y2={y}
            className="stroke-border"
            strokeWidth={1}
          />
        );
      })}

      {segments.map((segment) => (
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

      {plotted.map((position, index) =>
        position ? (
          <circle
            key={points[index].element}
            cx={position[0]}
            cy={position[1]}
            r={3}
            className="fill-primary"
          />
        ) : null,
      )}

      {points.map((point, index) => {
        const [x, y] = vertex(index, LABEL_RADIUS, count);
        const onAxis = Math.abs(x - CENTER_X) < 1;
        const anchor = onAxis ? "middle" : x > CENTER_X ? "start" : "end";
        const dy = onAxis ? (y < CENTER_Y ? -LABEL_OFFSET : LABEL_OFFSET) : 0;
        return (
          <text
            key={point.element}
            x={x}
            y={y}
            dy={dy}
            textAnchor={anchor}
            fontSize={LABEL_FONT_SIZE}
            dominantBaseline="middle"
            className={
              point.zScore === null ? "fill-subtle" : "fill-foreground"
            }
          >
            {point.label}
          </text>
        );
      })}
    </svg>
  );
}
