import { useEffect, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { format } from 'date-fns';
import { enCA, frCA } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { FieldError } from '@/components/base/shadcn/field';
import { Input } from '@/components/base/shadcn/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/base/shadcn/popover';
import { cn } from '@/components/lib/utils';

import { useCaseCreationT } from '../i18n';

import Calendar from './calendar';

/**
 * STAND-IN — not a design-system component. Lucas's Date Picker, « With Input » type (Figma › Radiant
 * ui kit › Date Picker; shadcn's date picker "Input" example): a text field you can type in, with a
 * calendar button at its end that opens the Calendar under the field. See COMPONENT-TODO.md.
 *
 * The value is ISO `yyyy-MM-dd`, and the field shows and accepts the same: it is the app's date
 * format in both languages (common.date.year_month_day). Figma shows « Jan 10, 2025 ».
 */

const ISO = /^(\d{4})[-/.]?(\d{2})[-/.]?(\d{2})$/;

/** A typed date as ISO, or null when it isn't a real calendar date. */
function parse(text: string): string | null {
  const m = ISO.exec(text.trim());
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) return null;
  return format(d, 'yyyy-MM-dd');
}

function toDate(iso: string): Date | undefined {
  const m = ISO.exec(iso);
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : undefined;
}

type Props = {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  /** Latest pickable day, ISO. Later days are disabled in the calendar; a typed one is passed on,
   *  so the form can mark it and explain (never a silent block). */
  max?: string;
  /** Earliest year in the year dropdown. */
  fromYear?: number;
  invalid?: boolean;
  className?: string;
  'aria-label'?: string;
};

function DatePicker({ id, value, onChange, max, fromYear = 1900, invalid, className, ...aria }: Props) {
  const { t, i18n } = useCaseCreationT();
  const locale = i18n.language.startsWith('fr') ? frCA : enCA;

  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const maxDate = max ? toDate(max) : undefined;
  const [month, setMonth] = useState<Date>(
    () => toDate(value) ?? (maxDate && maxDate < new Date() ? maxDate : new Date()),
  );
  const [badFormat, setBadFormat] = useState(false);

  // The form can change the value without the user typing (a confirmed patient, a cleared block).
  useEffect(() => {
    if (parse(text) !== (value || null)) {
      setText(value);
      setBadFormat(false);
    }
    const d = toDate(value);
    if (d) setMonth(d);
  }, [value]);

  const commitText = (next: string) => {
    setText(next);
    setBadFormat(false);
    const iso = parse(next);
    // An unfinished or impossible date is not a value: the form sees empty until it parses.
    onChange(iso ?? '');
  };

  const selectDay = (d: Date) => {
    const iso = format(d, 'yyyy-MM-dd');
    setText(iso);
    setBadFormat(false);
    onChange(iso);
    setOpen(false);
  };

  const toYear = (maxDate ?? new Date()).getFullYear();

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Anchor asChild>
          <div className="relative">
            <Input
              id={id}
              {...aria}
              value={text}
              inputMode="numeric"
              autoComplete="off"
              placeholder={t('date_picker.placeholder')}
              aria-invalid={invalid || badFormat || undefined}
              className="pr-10 tabular-nums"
              onChange={e => commitText(e.target.value)}
              // A finished date is normalized to ISO; anything else left in the field is flagged.
              onBlur={() => {
                const iso = parse(text);
                if (iso) setText(iso);
                else if (text.trim()) setBadFormat(true);
              }}
              onKeyDown={e => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setOpen(true);
                }
              }}
            />
            {/* « Date Picker / Button »: 24 px, muted icon, accent on hover. */}
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={t('date_picker.open')}
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground focus-visible:ring-ring/50 absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md outline-none focus-visible:ring-[3px]"
              >
                <CalendarIcon className="size-3.5" />
              </button>
            </PopoverTrigger>
          </div>
        </PopoverPrimitive.Anchor>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-auto p-0"
          onOpenAutoFocus={e => e.preventDefault()} // keep typing in the field
        >
          <Calendar
            selected={toDate(value)}
            onSelect={selectDay}
            month={month}
            onMonthChange={setMonth}
            max={maxDate}
            fromYear={fromYear}
            toYear={toYear}
            locale={locale}
          />
        </PopoverContent>
      </Popover>
      {badFormat && <FieldError>{t('date_picker.format_error')}</FieldError>}
    </div>
  );
}

export default DatePicker;
