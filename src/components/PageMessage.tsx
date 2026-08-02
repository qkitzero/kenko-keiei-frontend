import PageContainer from "@/components/PageContainer";
import Link from "next/link";

type PageMessageProps = {
  title?: string;
  message?: string;
  action?: React.ReactNode;
  link?: { href: string; label: string };
};

export default function PageMessage({
  title,
  message,
  action,
  link,
}: PageMessageProps) {
  return (
    <PageContainer centered>
      {title && (
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          {title}
        </h1>
      )}
      {message && <p className="text-subtle text-sm">{message}</p>}
      {action}
      {link && (
        <Link href={link.href} className="text-muted text-sm underline">
          {link.label}
        </Link>
      )}
    </PageContainer>
  );
}
