import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpenTextIcon } from 'lucide-react';

import { AutoComplete } from '@/components/base/data-entry/auto-complete';
import MultiSelector from '@/components/base/data-entry/multi-selector/multi-selector';
import { Button } from '@/components/base/shadcn/button';
import { Field, FieldLabel } from '@/components/base/shadcn/field';
import { Textarea } from '@/components/base/shadcn/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/base/shadcn/toggle-group';
import { cn } from '@/components/lib/utils';

import type { FormState } from '../form-state';
import { useCaseCreationT } from '../i18n';
import { fold, type Lang } from '../mock/hpo';
import { conditionDisplay, conditionHay, conditionsSorted, derivedCondition, UNDIAGNOSED } from '../mock/mondo';
import { CONSANGUINITY, type ConsanguinityCode, ETHNICITIES } from '../mock/options';
import AnthologyCode from '../stand-ins/anthology-code';
import MondoBrowser from '../stand-ins/mondo-browser';
import { useFlash } from '../use-flash';

type Props = {
  state: FormState;
  update: (fn: (s: FormState) => FormState) => void;
};

/**
 * Two workarounds so the form can set the indication from outside (an analysis switch):
 * - cmdk hands focus to any instance whose text changes, so setting this field while the cursor is
 *   in another cmdk input (the analysis field) would pull it out. The new value waits until focus
 *   leaves every cmdk input.
 * - AutoComplete keeps its own copy of the pick and ignores a value cleared from outside, so a
 *   clear remounts it (new `key`) rather than leave the old indication on screen.
 * Returns the value to hand AutoComplete, and its key. Both logged in COMPONENT-TODO.
 */
function useCmdkSafeValue(value: string): [string, number] {
  const [shown, setShown] = useState(value);
  const [key, setKey] = useState(0);
  const latest = useRef(value);
  const shownRef = useRef(shown);
  latest.current = value;
  shownRef.current = shown;
  useEffect(() => {
    if (value === shownRef.current) return;
    let el: Element | null = null;
    const apply = () => {
      el = document.activeElement;
      if (el?.hasAttribute('cmdk-input')) {
        el.addEventListener('blur', later, { once: true });
        return;
      }
      const v = latest.current;
      if (v === shownRef.current) return;
      if (v === '') setKey(k => k + 1);
      setShown(v);
    };
    const later = () => setTimeout(apply, 0); // let focus land first
    apply();
    return () => el?.removeEventListener('blur', later);
  }, [value]);
  return [shown, key];
}

function OtherClinicalSection({ state, update }: Props) {
  const { t, i18n } = useCaseCreationT();
  const lang: Lang = i18n.language.startsWith('fr') ? 'fr' : 'en';
  const [browsing, setBrowsing] = useState(false);

  // Memoized per language: AutoComplete re-syncs its input whenever the options change identity.
  const conditionOptions = useMemo(
    () =>
      conditionsSorted(lang).map(c => ({
        value: c.id,
        display: conditionDisplay(c.id, lang),
        // Raw and folded, so the DS search (accent-sensitive, COMPONENT-TODO) still finds
        // « epilepsie » — and the code, so « MONDO:0005 » works too.
        filter: conditionHay(c, lang).toLowerCase(),
        label: (
          <span>
            {c[lang]}
            {c.id !== UNDIAGNOSED && <AnthologyCode className="ml-1.5">{c.id}</AnthologyCode>}
          </span>
        ),
      })),
    [lang],
  );

  const ethnicityOptions = useMemo(() => ETHNICITIES.map(e => ({ value: e.code, label: e[lang] })), [lang]);
  const ethnicityHay = useMemo(() => Object.fromEntries(ETHNICITIES.map(e => [e.code, fold(e[lang])])), [lang]);

  const [conditionShown, conditionKey] = useCmdkSafeValue(state.condition);

  // The indication flashes when the analysis set it, never when the user picked it.
  const conditionFlash = useFlash(
    conditionShown,
    conditionShown !== '' && conditionShown === derivedCondition(state.analysisCode),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 items-start gap-4">
        <Field>
          <FieldLabel>{t('other.consanguinity')}</FieldLabel>
          {/* The one clearable segment: every other one is required, so only here does a second
              click on the selected option unset it. */}
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={0}
            value={state.consanguinity}
            onValueChange={v => update(s => ({ ...s, consanguinity: v as ConsanguinityCode | '' }))}
          >
            {CONSANGUINITY.map(code => (
              <ToggleGroupItem key={code} value={code}>
                {t(`other.consanguinity_values.${code}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        {/* The one multi-valued control: picks are removable chips, the menu stays open. */}
        <Field>
          <FieldLabel>{t('other.ethnicities')}</FieldLabel>
          <MultiSelector
            value={state.ethnicities}
            onChange={codes => update(s => ({ ...s, ethnicities: codes }))}
            // Both: `defaultOptions` alone is read once, so the menu would keep the first language.
            options={ethnicityOptions}
            defaultOptions={ethnicityOptions}
            placeholder={t('other.ethnicities_placeholder')}
            emptyIndicator={<div className="text-center text-sm">{t('analysis.no_match')}</div>}
            // cmdk filters on the option value (a code); search the displayed label instead.
            commandProps={{
              filter: (code, search) => (ethnicityHay[code]?.includes(fold(search.trim())) ? 1 : 0),
            }}
            openOnFocus
            size="sm"
            chevron
            multiline
            hidePlaceholderWhenSelected
          />
        </Field>
      </div>

      {/* The coded answer sits directly above the prose around it. Same shape as §3's search row:
          the field, then a browse button. */}
      <Field>
        <FieldLabel>{t('other.condition')}</FieldLabel>
        <div className="flex gap-4">
          <div className={cn('min-w-0 flex-1 rounded-md transition-shadow', conditionFlash && 'ring-ring ring-2')}>
            <AutoComplete
              key={conditionKey}
              size="sm"
              chevron
              options={conditionOptions}
              value={conditionShown}
              onChange={id => update(s => ({ ...s, condition: id }))}
              placeholder={t('other.condition_placeholder')}
              emptyIndicator={<div className="text-center text-sm">{t('analysis.no_match')}</div>}
              optionFilterProp="filter"
              optionLabelProp="display"
              debounceDelay={0}
            />
          </div>
          <Button variant="outline" size="sm" className="w-56 shrink-0" onClick={() => setBrowsing(true)}>
            <BookOpenTextIcon />
            {t('other.browse_mondo')}
          </Button>
        </div>
      </Field>

      {/* Keeps its label though it also carries the diagnosis hypothesis (`note`). */}
      <Field>
        <FieldLabel htmlFor="cc-note">{t('other.note')}</FieldLabel>
        <Textarea
          id="cc-note"
          className="min-h-[88px] text-sm"
          value={state.note}
          onChange={e => update(s => ({ ...s, note: e.target.value }))}
          placeholder={t('other.note_placeholder')}
        />
      </Field>

      <MondoBrowser
        open={browsing}
        lang={lang}
        value={state.condition}
        onCancel={() => setBrowsing(false)}
        onPick={id => {
          update(s => ({ ...s, condition: id }));
          setBrowsing(false);
        }}
      />
    </div>
  );
}

export default OtherClinicalSection;
