import { ToggleGroup, ToggleGroupItem } from '@/components/base/shadcn/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/base/shadcn/tooltip';

/**
 * A required single choice that may start empty (Sexe, §2 and §5; Statut, §5). The DS ToggleGroup can start empty; Radix lets a
 * second click on the selected item empty it again, so that click is ignored — a stray click must
 * not un-answer a required field (only Consanguinité, in §4, is clearable).
 */
function RequiredSegments<T extends string>({
  value,
  onChange,
  options,
  label,
  title,
  className,
}: {
  value: string;
  onChange: (v: T) => void;
  options: T[];
  label: (v: T) => string;
  title?: (v: T) => string;
  className?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={0}
      value={value}
      onValueChange={v => v && onChange(v as T)}
      className={className}
    >
      {options.map(v =>
        title ? (
          // The tooltip sits on the label inside the item, not around it: as the trigger, the item
          // would take the tooltip's data-state and lose its own selected look, and a wrapper would
          // break the joined corners of the group.
          <ToggleGroupItem key={v} value={v} aria-label={title(v)} className="min-w-10 px-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex h-full w-full cursor-pointer items-center justify-center px-2.5">{label(v)}</span>
              </TooltipTrigger>
              <TooltipContent>{title(v)}</TooltipContent>
            </Tooltip>
          </ToggleGroupItem>
        ) : (
          <ToggleGroupItem key={v} value={v}>
            {label(v)}
          </ToggleGroupItem>
        ),
      )}
    </ToggleGroup>
  );
}

export default RequiredSegments;
