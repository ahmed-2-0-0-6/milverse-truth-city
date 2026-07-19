import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md bg-muted/60", className)}
      {...props}
    />
  );
}

export { Skeleton };
