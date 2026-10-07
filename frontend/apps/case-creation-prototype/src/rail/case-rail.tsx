import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';

import PriorityIndicator from '@/components/base/indicators/priority-indicator';
import { Badge } from '@/components/base/shadcn/badge';
import { Button } from '@/components/base/shadcn/button';
import { Card, CardContent } from '@/components/base/shadcn/card';
import { cn } from '@/components/lib/utils';

import { type FormState, sequencedCount } from '../form-state';
import { gestState, todayStr } from '../gestational';
import { useCaseCreationT } from '../i18n';
import { ANALYSES } from '../mock/analyses';
import type { Lang } from '../mock/hpo';
import { conditionLabel } from '../mock/mondo';
import { ETHNICITIES } from '../mock/options';
import { lookupKey } from '../mock/patients';
import ProgressBar from '../stand-ins/progress-bar';

import Pedigree from './pedigree';

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
    <div className="border-border flex items-baseline justify-between gap-3 border-b py-2 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn('min-w-0 text-right', done ? 'text-foreground font-medium' : 'text-muted-foreground')}>
        {children ?? '—'}
      </span>
    </div>
  );
}

/** A captioned block of rows. The caption is half-ink, so the rows carry the weight. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-foreground/50 text-xs font-semibold">{title}</h4>
      <div>{children}</div>
    </div>
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

/** « Duo » · « Trio » · « Quatuor », then the count. Solo has no label. */
function compositionLabel(sequenced: number, t: TFunction): string | null {
  if (sequenced < 2) return null;
  if (sequenced <= 4) return t(`rail.composition.${sequenced}`);
  return t('rail.composition.many', { count: sequenced });
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
  const gest = gestState(state.gestBasis, state.lmpDate, state.eddDate);

  // The batch: the proband plus every card ticked into the analysis. Solo shows nothing — it is the
  // default, so a badge would say nothing. The named ladder stops at four (duo, trio, quad are the
  // terms in use); past that, the count itself. The type badge says « Germline » either way: the
  // composition badge beside it is what tells solo from family.
  const sequenced = sequencedCount(state);
  const composition = compositionLabel(sequenced, t);

  return (
    <Card className="sticky top-6">
      <CardContent className="flex flex-col gap-6">
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
          <div className="flex flex-col gap-1.5 pt-1">
            <ProgressBar value={gate.done / gate.total} />
            <p className="text-muted-foreground text-right text-xs">
              {t('rail.required_count', { done: gate.done, total: gate.total })}
            </p>
            {/* Empty at rest, so it costs no height. A flash pushes the summary down for 2.4 s. */}
            {flash && <p className="text-foreground text-xs">{flash}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{t('rail.summary')}</h3>
          <div>
            <Row label={t('rail.analysis')} done={!!analysis}>
              {(analysis || composition) && (
                <span className="inline-flex items-center gap-1">
                  {analysis?.code}
                  {/* Plain secondary badges, so nothing in the row competes with the code. The
                      composition shows even with no analysis picked: it is a fact of the family. */}
                  {analysis && <Badge variant="secondary">{t(`rail.type.${analysis.type}`)}</Badge>}
                  {composition && <Badge variant="secondary">{composition}</Badge>}
                </span>
              )}
            </Row>
            {/* Category and Priority ink unconditionally: they ship with defaults. */}
            <Row label={t('rail.category')} done>
              {t(state.prenatal ? 'category.prenatal' : 'category.postnatal')}
            </Row>
            <Row label={t('rail.priority')} done>
              <PriorityIndicator code={state.priority} size="sm" />
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
          </div>
        </div>

        {state.prenatal && (
          <Group title={t('rail.fetal')}>
            {/* « Indéterminé » is an answer, so it inks. */}
            <Row label={t('rail.fetal_sex')} done={!!state.fetalSex}>
              {state.fetalSex ? t(`patient.fetal_sex_full.${state.fetalSex}`) : undefined}
            </Row>
            <Row label={t('rail.gest_age')} done={gestDone}>
              {gestText}
            </Row>
          </Group>
        )}

        <Group title={t('rail.optional_additions')}>
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
          {/* Counts the cards — every relative reported, in the analysis or not. The composition
              badge counts the batch instead, and the two disagreeing is correct. */}
          <Row label={t('rail.family')} done={state.family.length > 0}>
            {t('rail.members', { count: state.family.length })}
          </Row>
        </Group>

        <Pedigree
          members={state.family}
          // The proband is the fetus in a prenatal case, so its symbol takes the fetal sex.
          probandSex={(state.prenatal ? state.fetalSex : state.sex) || 'U'}
          probandDeceased={state.prenatal && gest?.basis === 'demise'}
          consanguinity={state.consanguinity === 'consanguinity'}
        />
      </CardContent>
    </Card>
  );
}

export default CaseRail;
