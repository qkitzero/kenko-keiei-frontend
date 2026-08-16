import { RANK_GROUPS, type RankGroupCounts } from "@/lib/organizationReport";

export type DistributionBar = {
  key: string;
  label: string;
  counts: RankGroupCounts;
};

export type DistributionGroup = {
  key: string;
  label: string;
  bars: DistributionBar[];
};

const WIDTH = 200;
const HEIGHT = 14;
const BAR_HEIGHT = 10;
const CENTER = WIDTH / 2;
const HALF = CENTER - 6;
const GAP = 1;

const MIN_SEGMENT = 1.5;

const FILLS = {
  attention: "fill-danger",
  typical: "fill-muted",
  good: "fill-success",
} as const;

const SWATCHES = {
  attention: "bg-danger",
  typical: "bg-muted",
  good: "bg-success",
} as const;

function Bar({ counts, scale }: { counts: RankGroupCounts; scale: number }) {
  const [attention, typical, good] = counts;
  const unit = scale > 0 ? HALF / scale : 0;
  const y = (HEIGHT - BAR_HEIGHT) / 2;

  const sideWidth = (count: number) =>
    count <= 0 ? 0 : Math.max(count * unit - GAP, MIN_SEGMENT);

  const attentionWidth = sideWidth(attention);
  const goodWidth = sideWidth(good);
  const typicalWidth = typical <= 0 ? 0 : Math.max(typical * unit, MIN_SEGMENT);
  const half = typicalWidth / 2;

  const segments = [
    {
      key: "attention",
      x: CENTER - half - GAP - attentionWidth,
      width: attentionWidth,
    },
    { key: "typical", x: CENTER - half, width: typicalWidth },
    { key: "good", x: CENTER + half + GAP, width: goodWidth },
  ] as const;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      aria-hidden
      className="h-3.5 w-full"
      preserveAspectRatio="none"
    >
      {segments.map((segment) =>
        segment.width > 0 ? (
          <rect
            key={segment.key}
            x={segment.x}
            y={y}
            width={segment.width}
            height={BAR_HEIGHT}
            className={FILLS[segment.key]}
          />
        ) : null,
      )}
      <line
        x1={CENTER}
        y1={0}
        x2={CENTER}
        y2={HEIGHT}
        className="stroke-border-strong"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Counts({ counts }: { counts: RankGroupCounts }) {
  return (
    <span className="text-muted text-xs tabular-nums">
      {RANK_GROUPS.map((group, index) => (
        <span key={group.key}>
          {index > 0 && (
            <span aria-hidden className="text-subtle mx-1">
              /
            </span>
          )}
          <span className="sr-only">{group.label} </span>
          {counts[index]}
          <span className="sr-only">人</span>
        </span>
      ))}
    </span>
  );
}

export default function RankDistribution({
  groups,
  scale,
}: {
  groups: DistributionGroup[];
  scale: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <dl className="flex flex-col gap-3">
        {groups.map((group) => (
          <div
            key={group.key}
            className="grid gap-1 sm:grid-cols-[6rem_1fr] sm:gap-2 print:break-inside-avoid print:grid-cols-[6rem_1fr]"
          >
            <dt className="text-foreground text-xs font-medium sm:text-right print:text-right">
              {group.label}
            </dt>
            <dd className="flex min-w-0 flex-col gap-1">
              {group.bars.map((bar) => (
                <div
                  key={bar.key}
                  className="grid grid-cols-[3.5rem_1fr_4.5rem] items-center gap-2"
                >
                  <span className="text-subtle text-xs tabular-nums">
                    {bar.label}
                  </span>
                  <Bar counts={bar.counts} scale={scale} />
                  <span className="text-right">
                    <Counts counts={bar.counts} />
                  </span>
                </div>
              ))}
            </dd>
          </div>
        ))}
      </dl>

      <ul className="text-muted flex flex-wrap gap-x-4 gap-y-1 text-xs print:break-before-avoid">
        {RANK_GROUPS.map((group) => (
          <li key={group.key} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={`inline-block size-2.5 rounded-xs ${SWATCHES[group.key]}`}
            />
            {group.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
