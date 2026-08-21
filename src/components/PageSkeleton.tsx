import Card from "@/components/Card";
import PageContainer from "@/components/PageContainer";

export const SKELETON_SECTION_TABLE = "h-32";

const SKELETON_TABLE = "h-64";

type PageSkeletonProps = {
  width?: "wide" | "detail";
  shape?: "block" | "list" | "count" | "section";
  summary?: boolean;
  form?: boolean;
  back?: boolean;
};

const SUMMARY_ITEMS = ["a", "b", "c", "d", "e"];

function Header({ back }: { back?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      {back && (
        <div className="bg-placeholder mb-1 h-4 w-20 animate-pulse rounded" />
      )}
      <div className="bg-placeholder h-7 w-40 animate-pulse rounded-md" />
      <div className="bg-placeholder h-5 w-64 animate-pulse rounded" />
    </div>
  );
}

function Table({ height }: { height: string }) {
  return (
    <div
      className={`bg-placeholder ${height} w-full animate-pulse rounded-lg`}
    />
  );
}

function Toolbar() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="bg-placeholder h-9 w-56 animate-pulse rounded-md" />
      <div className="bg-placeholder h-9 w-44 animate-pulse rounded-md" />
    </div>
  );
}

function HeadingRow() {
  return <div className="bg-placeholder h-5 w-24 animate-pulse rounded" />;
}

function Summary() {
  return (
    <Card as="div" padding="sm">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUMMARY_ITEMS.map((key) => (
          <div key={key}>
            <div className="bg-placeholder h-4 w-16 animate-pulse rounded" />
            <div className="bg-placeholder mt-0.5 h-5 w-24 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function Form() {
  return (
    <Card as="div">
      <div className="bg-placeholder h-5 w-40 animate-pulse rounded" />
      <div className="mt-4 flex gap-2">
        <div className="bg-placeholder h-9 w-full max-w-sm animate-pulse rounded-md" />
        <div className="bg-placeholder h-9 w-16 animate-pulse rounded-md" />
      </div>
    </Card>
  );
}

export default function PageSkeleton({
  width,
  shape = "block",
  summary,
  form,
  back,
}: PageSkeletonProps) {
  return (
    <PageContainer width={width}>
      <Header back={back} />
      {summary && <Summary />}
      {form && <Form />}
      {shape === "block" ? (
        <Table height={SKELETON_TABLE} />
      ) : (
        <div className="flex flex-col gap-3">
          {shape === "list" ? <Toolbar /> : <HeadingRow />}
          <Table
            height={
              shape === "section" ? SKELETON_SECTION_TABLE : SKELETON_TABLE
            }
          />
        </div>
      )}
    </PageContainer>
  );
}
