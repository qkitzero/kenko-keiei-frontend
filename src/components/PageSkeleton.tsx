import PageContainer from "@/components/PageContainer";

type PageSkeletonProps = {
  width?: "wide" | "detail";
};

export default function PageSkeleton({ width }: PageSkeletonProps) {
  return (
    <PageContainer width={width}>
      <div className="flex flex-col gap-1">
        <div className="bg-placeholder h-7 w-40 animate-pulse rounded-md" />
        <div className="bg-placeholder h-4 w-64 animate-pulse rounded" />
      </div>
      <div className="bg-placeholder h-64 w-full animate-pulse rounded-lg" />
    </PageContainer>
  );
}
