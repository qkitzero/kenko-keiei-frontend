import {
  chartRange,
  hasAdjacentPair,
  lastIndexOfValue,
  lineSegments,
  type ChartRange,
} from "@/lib/chart";

const WIDTH = 620;
const HEIGHT = 224;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 32;
const PADDING_LEFT = 46;
const PADDING_RIGHT = 62;
const MARKER_RADIUS = 4;
const LABEL_OFFSET = 8;
const MAX_AXIS_LABELS = 5;

function axisIndexes(count: number): Set<number> {
  if (count <= MAX_AXIS_LABELS) {
    return new Set(Array.from({ length: count }, (_, index) => index));
  }

  const indexes = new Set<number>();
  for (let slot = 0; slot < MAX_AXIS_LABELS; slot += 1) {
    indexes.add(Math.round((slot * (count - 1)) / (MAX_AXIS_LABELS - 1)));
  }
  return indexes;
}

function xOf(index: number, count: number): number {
  const left = PADDING_LEFT;
  const right = WIDTH - PADDING_RIGHT;
  if (count <= 1) return (left + right) / 2;
  return left + (index * (right - left)) / (count - 1);
}

function yOf(value: number, range: ChartRange): number {
  const top = PADDING_TOP;
  const bottom = HEIGHT - PADDING_BOTTOM;
  const ratio = (value - range.min) / (range.max - range.min);
  return bottom - ratio * (bottom - top);
}

function Series({
  values,
  range,
  stroke,
  fill,
  dashed,
  label,
  above,
}: {
  values: (number | null)[];
  range: ChartRange;
  stroke: string;
  fill: string;
  dashed?: boolean;
  label: string;
  above: boolean;
}) {
  const plotted = values.map((value, index) =>
    value === null
      ? null
      : ([xOf(index, values.length), yOf(value, range)] as [number, number]),
  );
  const lastIndex = lastIndexOfValue(values);
  const lastPoint = lastIndex >= 0 ? plotted[lastIndex] : null;

  return (
    <>
      {lineSegments(plotted).map((segment) => (
        <line
          key={segment.key}
          x1={segment.from[0]}
          y1={segment.from[1]}
          x2={segment.to[0]}
          y2={segment.to[1]}
          className={stroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={dashed ? "4 3" : undefined}
        />
      ))}

      {plotted.map((point, index) =>
        point ? (
          <circle
            key={index}
            cx={point[0]}
            cy={point[1]}
            r={MARKER_RADIUS}
            className={`${fill} stroke-surface`}
            strokeWidth={2}
          />
        ) : null,
      )}

      {lastPoint && (
        <text
          x={lastPoint[0] + LABEL_OFFSET}
          y={lastPoint[1] + (above ? -LABEL_OFFSET : LABEL_OFFSET * 1.5)}
          textAnchor="start"
          fontSize={12}
          fontWeight={600}
          className={fill}
        >
          {label}
        </text>
      )}
    </>
  );
}

export default function TrendLine({
  values,
  context,
  labels,
  valueLabel,
  contextLabel,
}: {
  values: (number | null)[];
  context: (number | null)[];
  labels: string[];
  valueLabel: string;
  contextLabel: string;
}) {
  const range = chartRange([...values, ...context], null);
  if (!range || !hasAdjacentPair(values)) return null;

  const shown = axisIndexes(labels.length);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ width: WIDTH, maxWidth: "100%" }}
      aria-hidden
    >
      <line
        x1={PADDING_LEFT}
        y1={HEIGHT - PADDING_BOTTOM}
        x2={WIDTH - PADDING_RIGHT}
        y2={HEIGHT - PADDING_BOTTOM}
        className="stroke-border"
        strokeWidth={1}
      />

      <Series
        values={context}
        range={range}
        stroke="stroke-subtle"
        fill="fill-subtle"
        dashed
        label={contextLabel}
        above={false}
      />
      <Series
        values={values}
        range={range}
        stroke="stroke-primary"
        fill="fill-primary"
        label={valueLabel}
        above
      />

      {labels.map((label, index) =>
        shown.has(index) ? (
          <text
            key={`${label}-${index}`}
            x={xOf(index, labels.length)}
            y={HEIGHT - PADDING_BOTTOM + 16}
            textAnchor="middle"
            fontSize={11}
            className="fill-subtle"
          >
            {label}
          </text>
        ) : null,
      )}
    </svg>
  );
}
