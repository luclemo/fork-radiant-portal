import { cn } from '@/components/lib/utils';

/**
 * STAND-IN — not a design-system component. The library has no progress bar; this placeholder
 * uses the design tokens until Lucas's design lands (COMPONENT-TODO.md › Progress bar).
 */
function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn('bg-primary/20 h-1.5 w-full overflow-hidden rounded-full', className)}
    >
      <div className="bg-primary h-full rounded-full transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default ProgressBar;
