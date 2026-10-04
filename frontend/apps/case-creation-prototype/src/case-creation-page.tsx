import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/base/shadcn/card';

import CaseRail, { type Gate } from './rail/case-rail';
import AnalysisSection from './sections/analysis-section';
import { type FormState, INITIAL_STATE } from './form-state';
import { useCaseCreationT } from './i18n';

type SectionKey = 'analysis' | 'patient' | 'patient_prenatal' | 'clinical_signs' | 'other_clinical' | 'family';

function SectionCard({ index, titleKey, children }: { index: number; titleKey: SectionKey; children?: ReactNode }) {
  const { t } = useCaseCreationT();
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {index} · {t(`section.${titleKey}`)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children ?? <p className="text-muted-foreground text-sm">{t('section.placeholder')}</p>}
      </CardContent>
    </Card>
  );
}

/**
 * The gate. The rail's count IS its rows: each required rail row is one item, satisfied or not.
 * 7 items, 9 in a prenatal case. Items for sections not built yet stay unmet.
 */
function computeGate(s: FormState): Gate {
  const items = [
    s.analysisCode !== '', // Analyse
    false, // Identifiant (§2)
    false, // Établissement du patient (§2)
    false, // Sexe (§2)
    false, // Date de naissance (§2)
    false, // Nom — first AND last, one item (§2)
    false, // Signes cliniques — at least one OBSERVED phenotype (§3)
  ];
  if (s.prenatal) items.push(false /* Sexe fœtal */, false /* Âge gestationnel */);
  return { done: items.filter(Boolean).length, total: items.length };
}

function CaseCreationPage() {
  const { t } = useCaseCreationT();
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const update = useCallback((fn: (s: FormState) => FormState) => setState(fn), []);
  const gate = computeGate(state);

  // Rail feedback: one message at a time, gone after 2.4 s.
  const [flash, setFlash] = useState('');
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flashNote = (msg: string) => {
    setFlash(msg);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(''), 2400);
  };
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  return (
    <div className="bg-background min-h-screen">
      {/* The prototype says what it is on screen, so a screenshot can't be mistaken for the product. */}
      <div className="bg-muted text-muted-foreground px-6 py-1.5 text-center text-xs">{t('page.prototype_banner')}</div>

      <div className="mx-auto max-w-[1200px] px-6 py-6">
        <h1 className="mb-6 text-2xl font-semibold">{t('page.title')}</h1>

        <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-6">
          <div className="flex flex-col gap-6">
            <SectionCard index={1} titleKey="analysis">
              <AnalysisSection state={state} update={update} />
            </SectionCard>
            {/* The fetus is the one sequenced; §2 holds the mother's identity in a prenatal case. */}
            <SectionCard index={2} titleKey={state.prenatal ? 'patient_prenatal' : 'patient'} />
            <SectionCard index={3} titleKey="clinical_signs" />
            <SectionCard index={4} titleKey="other_clinical" />
            <h2 className="text-muted-foreground mt-2 text-sm font-semibold uppercase tracking-wide">
              {t('section.optional_sections')}
            </h2>
            <SectionCard index={5} titleKey="family" />
          </div>

          <CaseRail
            state={state}
            gate={gate}
            flash={flash}
            onCreate={() => flashNote(t(gate.done === gate.total ? 'flash.created' : 'flash.incomplete'))}
            onDraft={() => flashNote(t('flash.draft'))}
          />
        </div>
      </div>
    </div>
  );
}

export default CaseCreationPage;
