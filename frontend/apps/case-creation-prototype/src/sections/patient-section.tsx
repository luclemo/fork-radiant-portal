import { useEffect, useState } from 'react';

import { Button } from '@/components/base/shadcn/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/base/shadcn/dialog';
import { Field, FieldError, FieldLabel } from '@/components/base/shadcn/field';
import { Input } from '@/components/base/shadcn/input';
import { RadioGroup, RadioGroupItem } from '@/components/base/shadcn/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/base/shadcn/select';
import { cn } from '@/components/lib/utils';

import {
  clearAutofill,
  confirmPatient,
  type FormState,
  type GestBasis,
  rejectPatient,
  setGestBasis,
} from '../form-state';
import { gestMax, gestState, todayStr } from '../gestational';
import { useCaseCreationT } from '../i18n';
import { LOOKUP_DELAY, lookupKey, ORGS, PATIENT_DB, type PatientRecord, type SexCode } from '../mock/patients';
import Required from '../required';
import RequiredSegments from '../required-segments';
import DatePicker from '../stand-ins/date-picker';
import { useFlash } from '../use-flash';

type Props = {
  state: FormState;
  update: (fn: (s: FormState) => FormState) => void;
};

const SEXES: SexCode[] = ['M', 'F', 'U'];
const FETAL_SEXES: SexCode[] = ['F', 'M', 'U'];

type Pending = { key: string; rec: PatientRecord };

function PatientSection({ state, update }: Props) {
  const { t } = useCaseCreationT();

  // ---- The existing-patient lookup ----
  // Keys on organization + identifier, fires whenever the pair is complete, whichever half moved
  // last. While the pair is incomplete the line says nothing.
  const key = lookupKey(state.patientOrg, state.patientId);
  const decision = key ? state.lookupDecisions[key] : undefined;
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    setSearching(false);
    setNotFound(false);
    if (!state.patientId.trim()) {
      update(clearAutofill);
      return;
    }
    // Pair incomplete: wait. Already answered for this key: keep the answer, never re-ask.
    if (!key || state.lookupDecisions[key]) return;
    setSearching(true);
    const id = setTimeout(() => {
      setSearching(false);
      const rec = PATIENT_DB[key];
      // A match is a question, not an answer: nothing is written until it is confirmed.
      if (rec) setPending({ key, rec });
      else {
        update(clearAutofill);
        setNotFound(true);
      }
    }, LOOKUP_DELAY);
    return () => clearTimeout(id);
  }, [key]);

  const rejected = decision === 'rejected';
  let lookupLine = '';
  if (rejected) lookupLine = t('patient.lookup_unconfirmed');
  else if (searching) lookupLine = t('patient.lookup_searching');
  else if (notFound) lookupLine = t('patient.lookup_none');

  // A confirmed patient flashes the fields it filled, so the change can't go unnoticed.
  const filledFlash = useFlash(state.autofilled, !!state.autofilled);
  const flashRing = (field: keyof PatientRecord) =>
    filledFlash && state.autofilled?.[field] === state[field] ? 'ring-2 ring-ring transition-shadow' : '';

  const dobFuture = !!state.dob && state.dob > todayStr();

  // ---- Prenatal block ----
  const gest = gestState(state.gestBasis, state.lmpDate, state.eddDate);
  const gestDate = (basis: 'lmp' | 'edd') => {
    if (state.gestBasis !== basis) return null;
    const g = gest?.basis === basis ? gest : null;
    const value = basis === 'lmp' ? state.lmpDate : state.eddDate;
    return (
      // The option is the label: the date sits directly under it, the derived age to its right.
      <div className="ml-6 flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <DatePicker
            className="w-44"
            fromYear={new Date().getFullYear() - 1}
            aria-label={t(basis === 'lmp' ? 'patient.lmp_date' : 'patient.edd_date')}
            value={value}
            max={gestMax(basis)}
            invalid={g?.outOfRange}
            onChange={v => update(s => ({ ...s, [basis === 'lmp' ? 'lmpDate' : 'eddDate']: v }))}
          />
          {g?.weeks !== undefined && (
            <span className="text-muted-foreground text-sm">{t('patient.weeks', { count: g.weeks })}</span>
          )}
        </div>
        {g?.outOfRange && <FieldError>{t(basis === 'lmp' ? 'patient.err_lmp' : 'patient.err_edd')}</FieldError>}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* The first row carries the lookup status line. It sits in the 24 px gap under the row, so
            it costs no height and nothing jumps when it appears. */}
        <div className="relative grid grid-cols-2 items-start gap-x-4">
          <Field data-invalid={rejected || undefined}>
            <FieldLabel htmlFor="cc-patient-id">
              {t('patient.identifier')} <Required />
            </FieldLabel>
            {/* Free text, never rendered as HTML. */}
            <Input
              id="cc-patient-id"
              size="sm"
              value={state.patientId}
              aria-invalid={rejected || undefined}
              onChange={e => update(s => ({ ...s, patientId: e.target.value }))}
              placeholder={t('patient.identifier_placeholder')}
            />
            {/* No message in the cell: it would push this input out of line with its neighbour.
                The red field plus the status line below say it once. */}
          </Field>
          <Field>
            <FieldLabel>
              {t('patient.org')} <Required />
            </FieldLabel>
            {/* No default value. */}
            <Select value={state.patientOrg} onValueChange={v => update(s => ({ ...s, patientOrg: v }))}>
              <SelectTrigger
                size="sm"
                onClear={state.patientOrg ? () => update(s => ({ ...s, patientOrg: '' })) : undefined}
                clearLabel={t('common.clear')}
              >
                <SelectValue placeholder={t('patient.org_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {ORGS.map(o => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <p
            aria-live="polite"
            className={cn(
              'absolute inset-x-0 top-full mt-1 text-xs leading-4',
              rejected ? 'text-destructive font-medium' : 'text-muted-foreground',
            )}
          >
            {lookupLine}
          </p>
        </div>

        <div className="grid grid-cols-2 items-start gap-x-4">
          <Field>
            <FieldLabel htmlFor="cc-jhn">{t('patient.jhn')}</FieldLabel>
            <Input
              id="cc-jhn"
              size="sm"
              className={flashRing('jhn')}
              value={state.jhn}
              onChange={e => update(s => ({ ...s, jhn: e.target.value }))}
              placeholder={t('patient.jhn_placeholder')}
            />
          </Field>
          {/* Date of birth and Sex share one cell: Sex shows initials (full word as tooltip) and
              the date takes what is left — 204 px of 340 in the mock, room for the whole label. */}
          <div className="flex items-start gap-4">
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="cc-dob">
                {t('patient.dob')} <Required />
              </FieldLabel>
              <DatePicker
                id="cc-dob"
                className={cn('rounded-md', flashRing('dob'))}
                value={state.dob}
                max={todayStr()}
                invalid={dobFuture}
                onChange={v => update(s => ({ ...s, dob: v }))}
              />
              {dobFuture && <FieldError>{t('patient.err_dob')}</FieldError>}
            </Field>
            <Field className="w-auto shrink-0">
              <FieldLabel>
                {t('patient.sex')} <Required />
              </FieldLabel>
              <RequiredSegments
                className={cn('rounded-md', flashRing('sex'))}
                value={state.sex}
                options={SEXES}
                label={v => t(`patient.sex_abbr.${v}`)}
                title={v => t(`patient.sex_full.${v}`)}
                onChange={v => update(s => ({ ...s, sex: v }))}
              />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-2 items-start gap-x-4">
          <Field>
            <FieldLabel htmlFor="cc-first-name">
              {t('patient.first_name')} <Required />
            </FieldLabel>
            <Input
              id="cc-first-name"
              size="sm"
              className={flashRing('firstName')}
              value={state.firstName}
              onChange={e => update(s => ({ ...s, firstName: e.target.value }))}
              placeholder={t('patient.first_name')}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="cc-last-name">
              {t('patient.last_name')} <Required />
            </FieldLabel>
            <Input
              id="cc-last-name"
              size="sm"
              className={flashRing('lastName')}
              value={state.lastName}
              onChange={e => update(s => ({ ...s, lastName: e.target.value }))}
              placeholder={t('patient.last_name')}
            />
          </Field>
        </div>

        {/* The fetus is the one sequenced; it has no identity, so it gets its facts here, at the end
            of the mother's section, under a divider like the prescriber in §1. Unticking « Cas
            prénatal » clears all of it. */}
        {state.prenatal && (
          <div className="border-t pt-6">
            <h3 className="mb-4 text-sm font-semibold">{t('patient.fetal_info')}</h3>
            <div className="grid grid-cols-2 items-start gap-4">
              <Field>
                <FieldLabel>
                  {t('patient.fetal_sex')} <Required />
                </FieldLabel>
                <RequiredSegments
                  value={state.fetalSex}
                  options={FETAL_SEXES}
                  label={v => t(`patient.fetal_sex_full.${v}`)}
                  onChange={v => update(s => ({ ...s, fetalSex: v }))}
                />
              </Field>
              <Field>
                <FieldLabel>
                  {t('patient.gest_age')} <Required />
                </FieldLabel>
                <RadioGroup
                  value={state.gestBasis ?? ''}
                  onValueChange={v => update(s => setGestBasis(s, v as GestBasis))}
                  className="gap-3"
                >
                  {(['lmp', 'edd', 'demise'] as GestBasis[]).map(b => (
                    <div key={b} className="flex flex-col gap-2">
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                        <RadioGroupItem value={b} />
                        {t(`patient.gest_basis.${b}`)}
                      </label>
                      {b !== 'demise' && gestDate(b)}
                    </div>
                  ))}
                </RadioGroup>
              </Field>
            </div>
          </div>
        )}
      </div>

      {/* A found patient is confirmed before any PHI is written — in full, so a human can tell two
          siblings apart. Rejecting says "wrong key": org + identifier is unique, so there is no
          "use it anyway". Esc, the backdrop and ✕ all reject — the safe direction, it writes nothing. */}
      <Dialog
        open={!!pending}
        onOpenChange={open => {
          if (open || !pending) return;
          update(s => rejectPatient(s, pending.key));
          setPending(null);
          document.getElementById('cc-patient-id')?.focus();
        }}
      >
        <DialogContent size="sm" className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('patient.dialog_title')}</DialogTitle>
            <DialogDescription>{t('patient.dialog_ask')}</DialogDescription>
          </DialogHeader>
          {pending && (
            <DialogBody>
              <p className="text-muted-foreground border-border mb-3 border-b pb-2.5 text-xs">
                {pending.key.split('|')[0]} · {pending.key.split('|')[1]}
              </p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
                {(
                  [
                    ['first_name', pending.rec.firstName],
                    ['last_name', pending.rec.lastName],
                    ['sex', t(`patient.sex_full.${pending.rec.sex}`)],
                    ['dob', pending.rec.dob],
                    ['jhn', pending.rec.jhn],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{t(`patient.${k}`)}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </DialogBody>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (!pending) return;
                update(s => rejectPatient(s, pending.key));
                setPending(null);
              }}
            >
              {t('patient.dialog_reject')}
            </Button>
            <Button
              autoFocus
              onClick={() => {
                if (!pending) return;
                update(s => confirmPatient(s, pending.key, pending.rec));
                setPending(null);
              }}
            >
              {t('patient.dialog_confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PatientSection;
