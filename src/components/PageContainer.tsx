const WIDTH = {
  wide: "",
  detail: "max-w-4xl",
} as const;

type PageContainerProps = {
  width?: keyof typeof WIDTH;
  centered?: boolean;
  children: React.ReactNode;
};

const MAIN =
  "mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 print:max-w-none print:px-0 print:py-0";

export default function PageContainer({
  width = "wide",
  centered = false,
  children,
}: PageContainerProps) {
  if (centered) {
    return (
      <main className={`${MAIN} items-center justify-center gap-3 text-center`}>
        {children}
      </main>
    );
  }

  return (
    <main className={MAIN}>
      <div
        className={`flex flex-1 flex-col gap-6 print:max-w-none ${WIDTH[width]}`}
      >
        {children}
      </div>
    </main>
  );
}
