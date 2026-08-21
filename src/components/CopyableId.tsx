import CopyButton from "@/components/CopyButton";

type CopyableIdProps = {
  label: string;
  value: string;
};

export default function CopyableId({ label, value }: CopyableIdProps) {
  if (!value) return null;

  return (
    <div>
      <p className="text-subtle text-xs">{label}</p>
      <div className="mt-0.5 flex items-center gap-1">
        <span className="text-foreground min-w-0 font-mono text-xs break-all">
          {value}
        </span>
        <CopyButton value={value} label={`${label}をコピー`} />
      </div>
    </div>
  );
}
