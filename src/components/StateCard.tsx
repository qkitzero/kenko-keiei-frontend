import Card from "@/components/Card";

type StateCardProps = {
  message: string;
  action?: React.ReactNode;
};

export default function StateCard({ message, action }: StateCardProps) {
  return (
    <Card as="div" padding="lg" dashed className="text-center">
      <p className="text-muted text-sm">{message}</p>
      {action && (
        <div className="mt-4 flex justify-center print:hidden">{action}</div>
      )}
    </Card>
  );
}
