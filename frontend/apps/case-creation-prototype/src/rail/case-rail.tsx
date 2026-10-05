import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';

import AnalysisTypeCodeBadge from '@/components/base/badges/analysis-type-code-badge';
import PriorityIndicator from '@/components/base/indicators/priority-indicator';
import { Button } from '@/components/base/shadcn/button';
import { Card, CardContent } from '@/components/base/shadcn/card';
import { cn } from '@/components/lib/utils';

import type { FormState } from '../form-state';
import { gestState, todayStr } from '../gestational';
import { useCaseCreationT } from '../i18n';
import { ANALYSES } from '../mock/analyses';
import type { Lang } from '../mock/hpo';
import { conditionLabel } from '../mock/mondo';
import { ETHNICITIES } from '../mock/options';
import { lookupKey } from '../mock/patients';
import ProgressBar from '../stand-ins/progress-bar';

export type Gate = { done: number; total: number };

type Props = {
  state: FormState;
  gate: Gate;
  flash: string;
  onCreate: () => void;
  onDraft: () => void;
};

/** One summary row. `done` inks the value: the user has answered, « Inconnu » included. */
function Row({ label, done, children }: { label: string; done?: boolean; children?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn('min-w-0 text-right', done ? 'text-foreground font-medium' : 'text-muted-foreground')}>
        {children ?? '—'}
      </span>
    </div>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-muted-foreground mt-4 mb-0.5 text-xs font-semibold uppercase tracking-wide">{children}</div>
  );
}

/** What is stored and what is derived: « DDM 2026-04-02 · 24 sem. ». Inked only once answered. */
function gestSummary(state: FormState, t: TFunction): [string | undefined, boolean] {
  const gest = gestState(state.gestBasis, state.lmpDate, state.eddDate);
  if (!gest) return [undefined, false];
  if (gest.basis === 'demise') return [t('patient.gest_basis.demise'), true];
  let text = [t(`patient.gest_abbr.${gest.basis}`), gest.date].filter(Boolean).join(' ');
  if (gest.weeks !== undefined) text += ` · ${t('patient.weeks_short', { count: gest.weeks })}`;
  return [text, !!gest.date && !gest.outOfRange];
}

function CaseRail({ state, gate, flash, onCreate, onDraft }: Props) {
  const { t, i18n } = useCaseCreationT();
  const lang: Lang = i18n.language.startsWith('fr') ? 'fr' : 'en';
  const analysis = ANALYSES.find(a => a.code === state.analysisCode);
  const ready = gate.done === gate.total;
  const key = lookupKey(state.patientOrg, state.patientId);
  const idRejected = !!key && state.lookupDecisions[key] === 'rejected';
  const name = [state.firstName.trim(), state.lastName.trim()].filter(Boolean).join(' ');
  const [gestText, gestDone] = gestSummary(state, t);

  return (
    <Card className="sticky top-6">
      <CardContent className="flex flex-col">
        {/* The actions lead the card so Create is always above the fold; the bar and count sit
            directly under them because they explain why Create is not available yet. */}
        <div className="flex flex-col gap-2">
          {/* Not `disabled`: a disabled button cannot say why. It looks unavailable, and a click
              explains what is missing instead. */}
          <Button onClick={onCreate} aria-disabled={!ready} className={cn(!ready && 'opacity-50')}>
            {t('rail.create')}
          </Button>
          <Button variant="outline" onClick={onDraft}>
            {t('rail.save_draft')}
          </Button>
        </div>
        <ProgressBar className="mt-3" value={gate.done / gate.total} />
        <p className="text-muted-foreground mt-1.5 text-right text-xs">
          {t('rail.required_count', { done: gate.done, total: gate.total })}
        </p>
        {/* Empty at rest, so it costs no height. A flash pushes the summary down for 2.4 s. */}
        {flash && <p className="text-foreground mt-2 text-xs">{flash}</p>}

        <h3 className="mt-[22px] mb-1 text-sm font-semibold">{t('rail.summary')}</h3>

        <Row label={t('rail.analysis')} done={!!analysis}>
          {analysis && (
            <span className="inline-flex items-center gap-1.5">
              {analysis.code}
              {/* Solo for now; becomes germline_family once a relative is sequenced (§5). */}
              <AnalysisTypeCodeBadge code={analysis.type} />
            </span>
          )}
        </Row>
        {/* Category and Priority ink unconditionally: they ship with defaults. */}
        <Row label={t('rail.category')} done>
          {t(state.prenatal ? 'category.prenatal' : 'category.postnatal')}
        </Row>
        <Row label={t('rail.priority')} done>
          <PriorityIndicator code={state.priority} />
        </Row>
        {/* In a prenatal case §2 holds the mother's identity, so the identifier row says so.
            DDN and Nom are hers too but stay unqualified: three parentheses in a row is noise. */}
        <Row
          label={t(state.prenatal ? 'rail.mother_id' : 'rail.proband_id')}
          done={!!state.patientId.trim() && !idRejected}
        >
          {state.patientId.trim() || undefined}
        </Row>
        <Row label={t('rail.patient_org')} done={!!state.patientOrg}>
          {state.patientOrg || undefined}
        </Row>
        {/* The form shows initials; the rail spells the word: « Féminin », not « F ». */}
        <Row label={t(state.prenatal ? 'rail.sex_mother' : 'rail.sex')} done={!!state.sex}>
          {state.sex ? t(`patient.sex_full.${state.sex}`) : undefined}
        </Row>
        <Row label={t('rail.dob')} done={!!state.dob && state.dob <= todayStr()}>
          {state.dob || undefined}
        </Row>
        {/* One gate item: a first name alone is a half-answer and stays muted. */}
        <Row label={t('rail.name')} done={!!state.firstName.trim() && !!state.lastName.trim()}>
          {name || undefined}
        </Row>
        {/* Above the fetal block: a captioned group must end at the next caption. The text counts
            every term the case records; the ink answers the requirement — an OBSERVED one. */}
        <Row label={t('rail.phenotypes')} done={state.observed.length > 0}>
          {t('rail.terms', { count: state.observed.length + state.notObserved.length })}
        </Row>

        {state.prenatal && (
          <>
            <GroupLabel>{t('rail.fetal')}</GroupLabel>
            {/* « Indéterminé » is an answer, so it inks. */}
            <Row label={t('rail.fetal_sex')} done={!!state.fetalSex}>
              {state.fetalSex ? t(`patient.fetal_sex_full.${state.fetalSex}`) : undefined}
            </Row>
            <Row label={t('rail.gest_age')} done={gestDone}>
              {gestText}
            </Row>
          </>
        )}

        <GroupLabel>{t('rail.optional_additions')}</GroupLabel>
        {/* The label alone: the code is in the form, and the rail is read at a glance. */}
        <Row label={t('rail.condition')} done={!!state.condition}>
          {state.condition ? conditionLabel(state.condition, lang).replace(/\s*—.*$/, '') : undefined}
        </Row>
        {/* No default: « — » until answered, then inked — « Inconnue » included. */}
        <Row label={t('rail.consanguinity')} done={!!state.consanguinity}>
          {state.consanguinity ? t(`other.consanguinity_values.${state.consanguinity}`) : undefined}
        </Row>
        {/* In the chips' order — the DS multi-select lists picks in option order, not pick order. */}
        <Row label={t('rail.ethnicities')} done={state.ethnicities.length > 0}>
          {state.ethnicities.length
            ? ETHNICITIES.filter(e => state.ethnicities.includes(e.code))
                .map(e => e[lang])
                .join(', ')
            : undefined}
        </Row>
        {/* Free text: an indicator only, never the text itself. */}
        <Row label={t('rail.note')} done={!!state.note.trim()}>
          {state.note.trim() ? t('rail.note_added') : undefined}
        </Row>
        <Row label={t('rail.family')}>{t('rail.members', { count: 0 })}</Row>
      </CardContent>
    </Card>
  );
}

export default CaseRail;
