import { cn } from '@/components/lib/utils';

/**
 * STAND-IN — not a design-system component. Lucas's "Step Count" (Case Create Figma, node 12030:16181):
 * a 28 px circle holding a mono number. Figma sets it in Geist Mono; the app doesn't ship that font,
 * so this falls back to the theme's `font-mono` (COMPONENT-TODO.md › Step Count).
 */
function StepCount({ value, className }: { value: number | string; className?: string }) {
  return (
    <span
      className={cn(
        'bg-muted flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-sm leading-none font-medium text-slate-800',
        className,
      )}
    >
      {value}
    </span>
  );
}

export default StepCount;
