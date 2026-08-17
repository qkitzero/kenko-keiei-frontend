import CopyButton from "@/components/CopyButton";

type CopyableIdProps = {
  label: string;
  value: string;
};

export default function CopyableId({ label, value }: CopyableIdProps) {
  return (
    <div className="flex items-start gap-1.5">
      <div className="min-w-0 flex-1">
        <p className="text-subtle text-xs">{label}</p>
        <p className="text-foreground mt-0.5 font-mono text-xs break-all">
          {value}
        </p>
      </div>
      <CopyButton value={value} label={`${label}をコピー`} />
    </div>
  );
}
