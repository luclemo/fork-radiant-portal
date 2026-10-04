import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  isToday,
  type Locale,
  setMonth,
  setYear,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/components/lib/utils';

import { useCaseCreationT } from '../i18n';

/**
 * STAND-IN — not a design-system component. Lucas's Calendar (Figma › Radiant ui kit › Date Picker,
 * « Calendar / Basic » with « Month and Year Dropdown ») is shadcn's Calendar on our theme. shadcn's
 * is built on react-day-picker, which the frontend doesn't install yet, so this draws the same
 * thing with date-fns (already a dependency) until the FE team adds the real one
 * (COMPONENT-TODO.md › Calendar). Measurements and tokens follow the Figma component.
 */

type Props = {
  selected?: Date;
  onSelect: (day: Date) => void;
  /** The month on screen. */
  month: Date;
  onMonthChange: (month: Date) => void;
  /** Days after this are disabled. */
  max?: Date;
  fromYear: number;
  toYear: number;
  locale: Locale;
};

/** A month or year dropdown: the native select sits invisibly over its label, as in shadcn. */
function CaptionSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: { value: number; label: string }[];
  onChange: (v: number) => void;
}) {
  const current = options.find(o => o.value === value)?.label;
  return (
    <span className="text-card-foreground relative inline-flex h-5 items-center gap-1 text-sm">
      {current}
      <ChevronDown className="text-muted-foreground size-4" />
      <select
        aria-label={label}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
}

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 grid size-7 place-items-center rounded-lg outline-none focus-visible:ring-[3px] [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

function Calendar({ selected, onSelect, month, onMonthChange, max, fromYear, toYear, locale }: Props) {
  const { t } = useCaseCreationT();

  const weekStart = startOfWeek(startOfMonth(month), { locale });
  const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(endOfMonth(month), { locale }) });
  const weeks = Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7));

  const months = Array.from({ length: 12 }, (_, m) => ({
    value: m,
    label: format(setMonth(month, m), 'LLL', { locale }),
  }));
  const years = Array.from({ length: toYear - fromYear + 1 }, (_, i) => ({
    value: toYear - i,
    label: String(toYear - i),
  }));

  return (
    <div className="flex flex-col gap-4 p-2">
      <div className="flex items-center justify-between">
        <NavButton label={t('date_picker.prev_month')} onClick={() => onMonthChange(addMonths(month, -1))}>
          <ChevronLeft />
        </NavButton>
        <div className="flex items-center gap-1.5">
          <CaptionSelect
            label={t('date_picker.month')}
            value={month.getMonth()}
            options={months}
            onChange={m => onMonthChange(setMonth(month, m))}
          />
          <CaptionSelect
            label={t('date_picker.year')}
            value={month.getFullYear()}
            options={years}
            onChange={y => onMonthChange(setYear(month, y))}
          />
        </div>
        <NavButton label={t('date_picker.next_month')} onClick={() => onMonthChange(addMonths(month, 1))}>
          <ChevronRight />
        </NavButton>
      </div>

      <div role="grid" className="flex flex-col gap-2">
        <div role="row" className="flex">
          {weeks[0].map(d => (
            <span
              key={d.toISOString()}
              role="columnheader"
              className="text-muted-foreground flex h-5 w-7 items-center justify-center text-xs"
            >
              {format(d, 'EEEEEE', { locale })}
            </span>
          ))}
        </div>
        {weeks.map(week => (
          <div key={week[0].toISOString()} role="row" className="flex">
            {week.map(d => {
              const outside = !isSameMonth(d, month);
              const isSelected = !!selected && isSameDay(d, selected);
              const disabled = !!max && isAfter(d, max);
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  role="gridcell"
                  aria-selected={isSelected}
                  aria-label={format(d, 'PPP', { locale })}
                  disabled={disabled}
                  onClick={() => onSelect(d)}
                  className={cn(
                    'text-card-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 size-7 rounded-md text-sm outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50',
                    outside && 'text-muted-foreground',
                    isToday(d) && !isSelected && 'bg-accent text-accent-foreground',
                    isSelected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Calendar;
