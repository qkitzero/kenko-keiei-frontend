import { primaryClassName, type PrimarySize } from "@/components/PrimaryButton";
import Link from "next/link";

type PrimaryLinkProps = {
  size?: PrimarySize;
} & React.ComponentProps<typeof Link>;

export default function PrimaryLink({
  size = "md",
  className,
  children,
  ...props
}: PrimaryLinkProps) {
  return (
    <Link {...props} className={primaryClassName(size, className)}>
      {children}
    </Link>
  );
}
