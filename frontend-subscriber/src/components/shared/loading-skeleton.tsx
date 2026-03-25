import { cn } from "@/lib/utils";

type SkeletonVariant = "card" | "table-row" | "chart" | "text-line";

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  count?: number;
  className?: string;
}

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-border/60",
        className,
      )}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl bg-surface p-6 shadow-sm">
      <SkeletonPulse className="h-4 w-24 mb-3" />
      <SkeletonPulse className="h-8 w-32 mb-2" />
      <SkeletonPulse className="h-3 w-20" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border/50">
      <SkeletonPulse className="h-4 w-24" />
      <SkeletonPulse className="h-4 w-32 hidden sm:block" />
      <SkeletonPulse className="h-4 w-16" />
      <SkeletonPulse className="h-4 w-20 ml-auto" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl bg-surface p-6 shadow-sm">
      <SkeletonPulse className="h-5 w-40 mb-4" />
      <SkeletonPulse className="h-48 w-full rounded-lg" />
    </div>
  );
}

function TextLineSkeleton() {
  return <SkeletonPulse className="h-4 w-full" />;
}

const variantMap: Record<SkeletonVariant, React.FC> = {
  card: CardSkeleton,
  "table-row": TableRowSkeleton,
  chart: ChartSkeleton,
  "text-line": TextLineSkeleton,
};

export function LoadingSkeleton({
  variant = "card",
  count = 1,
  className,
}: LoadingSkeletonProps) {
  const Component = variantMap[variant];

  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }, (_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
