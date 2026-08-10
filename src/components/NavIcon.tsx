import type { NavIconName } from "@/lib/navigation";

const PATHS: Record<NavIconName, string[]> = {
  home: ["M3 10.5 12 3l9 7.5", "M5 9.5V20h5v-6h4v6h5V9.5"],
  customers: [
    "M2 20v-1a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4v1",
    "M12 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z",
    "M16.5 4.5a3.5 3.5 0 0 1 0 6.5",
    "M22 20v-1a4 4 0 0 0-3-3.87",
  ],
  organizations: [
    "M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17",
    "M15 10h4a1 1 0 0 1 1 1v10",
    "M2 21h20",
    "M8 7h3M8 11h3M8 15h3",
  ],
  measurementItems: ["M4 20V10M9 20V4M14 20v-7M19 20v-4", "M2 20h20"],
  tenants: [
    "m12 3 9 4.5-9 4.5-9-4.5L12 3Z",
    "m3 12 9 4.5 9-4.5",
    "m3 16.5 9 4.5 9-4.5",
  ],
};

export default function NavIcon({
  name,
  className,
}: {
  name: NavIconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
