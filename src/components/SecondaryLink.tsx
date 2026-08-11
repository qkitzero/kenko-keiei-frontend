import {
  secondaryClassName,
  type SecondaryVariant,
} from "@/components/SecondaryButton";
import type { ControlSize } from "@/components/control";
import Link from "next/link";

type SecondaryLinkProps = {
  size?: ControlSize;
  variant?: SecondaryVariant;
} & React.ComponentProps<typeof Link>;

export default function SecondaryLink({
  size = "md",
  variant = "default",
  className,
  children,
  ...props
}: SecondaryLinkProps) {
  return (
    <Link {...props} className={secondaryClassName(size, variant, className)}>
      {children}
    </Link>
  );
}
