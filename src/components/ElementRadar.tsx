import { lineSegments } from "@/lib/chart";
import {
  MIN_RADAR_ELEMENTS,
  RANK_BOUNDARIES,
  TYPICAL_Z_SCORE_RANGE,
  Z_SCORE_MAX,
  Z_SCORE_MIN,
} from "@/lib/judgment";

const RADIUS = 92;
const LABEL_GAP = 16;
const LABEL_RADIUS = RADIUS + LABEL_GAP;
const LABEL_FONT_SIZE = 12;
const LABEL_MAX_CHARS = 5;
const LABEL_WIDTH = LABEL_FONT_SIZE * LABEL_MAX_CHARS;
const LABEL_OFFSET = LABEL_FONT_SIZE / 2;
const EMPHASIS_STROKE_WIDTH = 2.5;
const STROKE_WIDTH = 1.75;
const MARKER_RADIUS = 3;

const WIDTH = Math.ceil(
  2 * (LABEL_RADIUS * Math.cos(Math.PI / 6) + LABEL_WIDTH),
);
const HEIGHT = Math.ceil(2 * (LABEL_RADIUS + LABEL_OFFSET + LABEL_FONT_SIZE));
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;

export type RadarAxis = {
  key: string;
  label: string;
};

export type RadarSeries = {
  key: string;
  stroke: string;
  fill: string;
  values: (number | null)[];
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

function closedSegments(plotted: ([number, number] | null)[]) {
  return lineSegments([...plotted, plotted[0] ?? null]);
}

export default function ElementRadar({
  axes,
  series,
}: {
  axes: RadarAxis[];
  series: RadarSeries[];
}) {
  const count = axes.length;
  const drawable = series.filter(
    (entry) =>
      entry.values.filter((value) => value !== null).length >=
      MIN_RADAR_ELEMENTS,
  );

  if (count < MIN_RADAR_ELEMENTS || drawable.length === 0) return null;

  const [typicalMin, typicalMax] = TYPICAL_Z_SCORE_RANGE;

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

      {axes.map((axis, index) => {
        const [x, y] = vertex(index, RADIUS, count);
        return (
          <line
            key={axis.key}
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={x}
            y2={y}
            className="stroke-border"
            strokeWidth={1}
          />
        );
      })}

      {drawable.map((entry, entryIndex) => {
        const plotted = axes.map((_, index) => {
          const zScore = entry.values[index];
          return zScore === null || zScore === undefined
            ? null
            : vertex(index, radiusForZScore(zScore), count);
        });
        const emphasized = entryIndex === drawable.length - 1;

        return (
          <g key={entry.key}>
            {closedSegments(plotted).map((segment) => (
              <line
                key={segment.key}
                x1={segment.from[0]}
                y1={segment.from[1]}
                x2={segment.to[0]}
                y2={segment.to[1]}
                className={entry.stroke}
                strokeWidth={emphasized ? EMPHASIS_STROKE_WIDTH : STROKE_WIDTH}
                strokeLinecap="round"
              />
            ))}

            {plotted.map((point, index) =>
              point ? (
                <circle
                  key={axes[index].key}
                  cx={point[0]}
                  cy={point[1]}
                  r={MARKER_RADIUS}
                  className={`${entry.fill} stroke-surface`}
                  strokeWidth={1.5}
                />
              ) : null,
            )}
          </g>
        );
      })}

      {axes.map((axis, index) => {
        const [x, y] = vertex(index, LABEL_RADIUS, count);
        const onAxis = Math.abs(x - CENTER_X) < 1;
        const anchor = onAxis ? "middle" : x > CENTER_X ? "start" : "end";
        const dy = onAxis ? (y < CENTER_Y ? -LABEL_OFFSET : LABEL_OFFSET) : 0;
        const measured = drawable.some((entry) => entry.values[index] !== null);
        return (
          <text
            key={axis.key}
            x={x}
            y={y}
            dy={dy}
            textAnchor={anchor}
            fontSize={LABEL_FONT_SIZE}
            dominantBaseline="middle"
            className={measured ? "fill-foreground" : "fill-subtle"}
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}
