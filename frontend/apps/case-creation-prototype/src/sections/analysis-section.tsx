import { useEffect, useMemo, useRef, useState } from 'react';

import { AutoComplete } from '@/components/base/data-entry/auto-complete';
import PriorityIndicator from '@/components/base/indicators/priority-indicator';
import { Checkbox } from '@/components/base/shadcn/checkbox';
import { Field, FieldLabel } from '@/components/base/shadcn/field';
import { Input } from '@/components/base/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/base/shadcn/select';
import { cn } from '@/components/lib/utils';

import { type FormState, setPrenatal, setPrescriberIsMe, setPriorityByUser } from '../form-state';
import { useCaseCreationT } from '../i18n';
import { ANALYSES } from '../mock/analyses';
import { PRIORITIES, type PriorityCode, STUDIES } from '../mock/options';

// Radix Select cannot hold an empty value, so the clear row uses a sentinel. The design system's
// Select has no clear of its own — logged in COMPONENT-TODO.md.
const CLEAR = '__clear__';

type Props = {
  state: FormState;
  update: (fn: (s: FormState) => FormState) => void;
};

function Required() {
  return <span className="text-destructive">*</span>;
}

/** A value the form set by itself (the STAT prefill) flashes, so the change can't go unnoticed. */
function useFlash(value: unknown, when: boolean) {
  const [on, setOn] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!when) return;
    setOn(true);
    const id = setTimeout(() => setOn(false), 900);
    return () => clearTimeout(id);
  }, [value]);
  return on;
}

function AnalysisSection({ state, update }: Props) {
  const { t } = useCaseCreationT();

  // Name and code are both searchable, anywhere in the string: names start with the act number,
  // so a prefix match would never find "muscul". AutoComplete searches one field, so it gets both.
  const analysisOptions = useMemo(
    () =>
      ANALYSES.map(a => ({
        value: a.code,
        display: a.name,
        filter: `${a.name} ${a.code}`,
        label: (
          <span className="flex w-full items-baseline justify-between gap-3">
            <span>{a.name}</span>
            <span className="text-muted-foreground shrink-0 text-xs">{a.code}</span>
          </span>
        ),
      })),
    [],
  );

  // Flash Priority only when the form changed it (the prefill), not when the user picked it.
  const priorityFlash = useFlash(state.priority, !state.priorityUserSet);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[minmax(0,1fr)_180px] items-start gap-4">
        <div className="flex flex-col gap-3">
          <Field>
            <FieldLabel>
              {t('analysis.label')} <Required />
            </FieldLabel>
            <AutoComplete
              options={analysisOptions}
              value={state.analysisCode}
              onChange={code => update(s => ({ ...s, analysisCode: code }))}
              placeholder={t('analysis.placeholder')}
              emptyIndicator={<div className="text-center text-sm">{t('analysis.no_match')}</div>}
              optionFilterProp="filter"
              optionLabelProp="display"
              debounceDelay={0}
            />
          </Field>
          <Field orientation="horizontal">
            <Checkbox
              id="cc-prenatal"
              checked={state.prenatal}
              onCheckedChange={on => update(s => setPrenatal(s, on === true))}
            />
            <FieldLabel htmlFor="cc-prenatal" className="font-normal">
              {t('analysis.prenatal')}
            </FieldLabel>
          </Field>
        </div>

        <Field>
          <FieldLabel>
            {t('analysis.priority')} <Required />
          </FieldLabel>
          {/* Required, so no clear row. Labels come from the design system's own indicator. */}
          <Select value={state.priority} onValueChange={v => update(s => setPriorityByUser(s, v as PriorityCode))}>
            <SelectTrigger className={cn('transition-shadow', priorityFlash && 'ring-2 ring-ring')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map(code => (
                <SelectItem key={code} value={code}>
                  <PriorityIndicator code={code} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Picking a study IS the consent, so there is no separate checkbox. */}
      <Field>
        <FieldLabel>{t('analysis.study')}</FieldLabel>
        <Select value={state.study} onValueChange={v => update(s => ({ ...s, study: v === CLEAR ? '' : v }))}>
          <SelectTrigger>
            <SelectValue placeholder={t('analysis.study_placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {state.study && (
              <>
                <SelectItem value={CLEAR} className="text-muted-foreground">
                  {t('analysis.clear_selection')}
                </SelectItem>
                <SelectSeparator />
              </>
            )}
            {STUDIES.map(name => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* The prescriber: no field label while ticked, because there is no field — the checkbox
          carries the whole statement. Unticking reveals the label and its input together. */}
      <div className="flex flex-col gap-2">
        <Field orientation="horizontal">
          <Checkbox
            id="cc-prescriber-me"
            checked={state.prescriberIsMe}
            onCheckedChange={on => update(s => setPrescriberIsMe(s, on === true))}
          />
          <FieldLabel htmlFor="cc-prescriber-me" className="font-normal">
            {t('analysis.prescriber_is_me')}
          </FieldLabel>
        </Field>
        {!state.prescriberIsMe && (
          <Field>
            <FieldLabel htmlFor="cc-prescriber">{t('analysis.prescriber')}</FieldLabel>
            <Input
              id="cc-prescriber"
              autoFocus // it only appears because the user asked for it — put them in it
              value={state.prescriberName}
              onChange={e => update(s => ({ ...s, prescriberName: e.target.value }))}
              placeholder={t('analysis.prescriber_placeholder')}
            />
          </Field>
        )}
      </div>
    </div>
  );
}

export default AnalysisSection;
