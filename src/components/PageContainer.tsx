type PageContainerProps = {
  centered?: boolean;
  children: React.ReactNode;
};

export default function PageContainer({
  centered = false,
  children,
}: PageContainerProps) {
  return (
    <main
      className={`mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12 ${
        centered ? "items-center justify-center gap-3 text-center" : "gap-8"
      }`}
    >
      {children}
    </main>
  );
}
