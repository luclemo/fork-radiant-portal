import type { ReactNode } from 'react';

import AnalysisTypeCodeBadge from '@/components/base/badges/analysis-type-code-badge';
import PriorityIndicator from '@/components/base/indicators/priority-indicator';
import { Button } from '@/components/base/shadcn/button';
import { Card, CardContent } from '@/components/base/shadcn/card';
import { cn } from '@/components/lib/utils';

import type { FormState } from '../form-state';
import { useCaseCreationT } from '../i18n';
import { ANALYSES } from '../mock/analyses';
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

function CaseRail({ state, gate, flash, onCreate, onDraft }: Props) {
  const { t } = useCaseCreationT();
  const analysis = ANALYSES.find(a => a.code === state.analysisCode);
  const ready = gate.done === gate.total;

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
        <Row label={t(state.prenatal ? 'rail.mother_id' : 'rail.proband_id')} />
        <Row label={t('rail.patient_org')} />
        <Row label={t(state.prenatal ? 'rail.sex_mother' : 'rail.sex')} />
        <Row label={t('rail.dob')} />
        <Row label={t('rail.name')} />
        {/* Above the fetal block: a captioned group must end at the next caption. */}
        <Row label={t('rail.phenotypes')}>{t('rail.terms', { count: 0 })}</Row>

        {state.prenatal && (
          <>
            <GroupLabel>{t('rail.fetal')}</GroupLabel>
            <Row label={t('rail.fetal_sex')} />
            <Row label={t('rail.gest_age')} />
          </>
        )}

        <GroupLabel>{t('rail.optional_additions')}</GroupLabel>
        <Row label={t('rail.condition')} />
        <Row label={t('rail.consanguinity')} />
        <Row label={t('rail.ethnicities')} />
        <Row label={t('rail.note')} />
        <Row label={t('rail.family')}>{t('rail.members', { count: 0 })}</Row>
      </CardContent>
    </Card>
  );
}

export default CaseRail;
