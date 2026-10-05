import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/base/shadcn/card';

import { lookupKey } from './mock/patients';
import CaseRail, { type Gate } from './rail/case-rail';
import AnalysisSection from './sections/analysis-section';
import ClinicalSignsSection from './sections/clinical-signs-section';
import OtherClinicalSection from './sections/other-clinical-section';
import PatientSection from './sections/patient-section';
import { type FormState, INITIAL_STATE } from './form-state';
import { gestAnswered, gestState, todayStr } from './gestational';
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
 * 7 items, 9 in a prenatal case. Items for sections not built yet stay unmet. Rail rows and gate
 * read the same values (and the same gestational computation), so they cannot drift.
 */
function computeGate(s: FormState): Gate {
  const key = lookupKey(s.patientOrg, s.patientId);
  const items = [
    s.analysisCode !== '', // Analyse
    // A rejected match means the identifier is wrong: it blocks Create, never Save draft.
    s.patientId.trim() !== '' && !(key && s.lookupDecisions[key] === 'rejected'), // Identifiant
    s.patientOrg !== '', // Établissement du patient
    s.sex !== '', // Sexe
    s.dob !== '' && s.dob <= todayStr(), // Date de naissance — a future one is marked, not counted
    s.firstName.trim() !== '' && s.lastName.trim() !== '', // Nom — first AND last, one item
    // Signes cliniques — at least one OBSERVED phenotype; a not-observed term is an aside.
    s.observed.length > 0,
  ];
  if (s.prenatal) {
    items.push(s.fetalSex !== '', gestAnswered(gestState(s.gestBasis, s.lmpDate, s.eddDate)));
  }
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
            <SectionCard index={2} titleKey={state.prenatal ? 'patient_prenatal' : 'patient'}>
              <PatientSection state={state} update={update} />
            </SectionCard>
            <SectionCard index={3} titleKey="clinical_signs">
              <ClinicalSignsSection state={state} update={update} />
            </SectionCard>
            <SectionCard index={4} titleKey="other_clinical">
              <OtherClinicalSection state={state} update={update} />
            </SectionCard>
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
