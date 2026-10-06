import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/base/shadcn/accordion';

import { lookupKey } from './mock/patients';
import CaseRail, { type Gate } from './rail/case-rail';
import AnalysisSection from './sections/analysis-section';
import ClinicalSignsSection from './sections/clinical-signs-section';
import FamilySection from './sections/family-section';
import OtherClinicalSection from './sections/other-clinical-section';
import PatientSection from './sections/patient-section';
import StepCount from './stand-ins/step-count';
import { familyProblemCount, type FormState, INITIAL_STATE } from './form-state';
import { gestAnswered, gestState, todayStr } from './gestational';
import { useCaseCreationT } from './i18n';

type SectionId = 'analysis' | 'patient' | 'clinical_signs' | 'other_clinical' | 'family';
type TitleKey = SectionId | 'patient_prenatal';

const ALL_SECTIONS: SectionId[] = ['analysis', 'patient', 'clinical_signs', 'other_clinical', 'family'];

/**
 * One form section: a DS accordion item drawn as a card (Figma « Accordion / AccordionItem »,
 * chevron right). Overrides on the DS parts, all from the Figma spec:
 * - item: card chrome (border, 8 px radius, 24 px padding, 24 px between header and body);
 * - trigger: `py-0` (the DS adds 8 px), so the header is the 28 px of its step circle;
 * - body: a divider 24 px under the header, 24 px above the content, 16 px below it.
 * The body stays mounted when closed (`forceMount`), so a section keeps its local state — an open
 * search, a typed-but-unpicked term — and the page can still find fields inside it.
 */
function SectionCard({
  id,
  index,
  titleKey,
  children,
}: {
  id: SectionId;
  index: number;
  titleKey: TitleKey;
  children: ReactNode;
}) {
  const { t } = useCaseCreationT();
  return (
    <AccordionItem
      value={id}
      data-section={id}
      // The body is `overflow: hidden` for the DS open/close animation, which clips focus rings and
      // any dropdown that opens past the card. Open instantly and unclipped instead.
      className="bg-card text-card-foreground flex flex-col gap-0 rounded-lg border p-6 shadow-xs [&>[role=region]]:animate-none [&>[role=region]]:overflow-visible"
    >
      <AccordionTrigger chevronPlacement="right" className="py-0">
        <span className="flex items-center gap-3">
          <StepCount value={index} />
          <span className="text-base font-semibold">{t(`section.${titleKey}`)}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent forceMount className="mt-6 border-t pt-6 pb-4">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

/**
 * The gate. The rail's count IS its rows: each required rail row is one item, satisfied or not.
 * 7 items, 9 in a prenatal case. Items for sections not built yet stay unmet. Rail rows and gate
 * read the same values (and the same gestational computation), so they cannot drift.
 */
function computeGate(s: FormState): Gate & { missing: SectionId[] } {
  const key = lookupKey(s.patientOrg, s.patientId);
  // Each item carries its section, so Create can open the ones that still miss something.
  const items: [SectionId, boolean][] = [
    ['analysis', s.analysisCode !== ''], // Analyse
    // A rejected match means the identifier is wrong: it blocks Create, never Save draft.
    ['patient', s.patientId.trim() !== '' && !(key && s.lookupDecisions[key] === 'rejected')], // Identifiant
    ['patient', s.patientOrg !== ''], // Établissement du patient
    ['patient', s.sex !== ''], // Sexe
    ['patient', s.dob !== '' && s.dob <= todayStr()], // Date de naissance — a future one is marked, not counted
    ['patient', s.firstName.trim() !== '' && s.lastName.trim() !== ''], // Nom — first AND last, one item
    // Signes cliniques — at least one OBSERVED phenotype; a not-observed term is an aside.
    ['clinical_signs', s.observed.length > 0],
  ];
  if (s.prenatal) {
    items.push(['patient', s.fetalSex !== ''], ['patient', gestAnswered(gestState(s.gestBasis, s.lmpDate, s.eddDate))]);
  }
  const missing = ALL_SECTIONS.filter(id => items.some(([section, ok]) => section === id && !ok));
  return { done: items.filter(([, ok]) => ok).length, total: items.length, missing };
}

function CaseCreationPage() {
  const { t } = useCaseCreationT();
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const update = useCallback((fn: (s: FormState) => FormState) => setState(fn), []);
  const gate = computeGate(state);

  // Every section starts expanded (Lucas, 2026-10-06). Controlled, so Create can open the ones with errors.
  const [openSections, setOpenSections] = useState<string[]>(ALL_SECTIONS);

  // Missing fields on a family card are marked only once Create has been tried.
  const [showFamilyErrors, setShowFamilyErrors] = useState(false);

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
    <div className="bg-muted min-h-screen">
      {/* The prototype says what it is on screen, so a screenshot can't be mistaken for the product. */}
      <div className="bg-background text-muted-foreground border-b px-6 py-1.5 text-center text-xs">
        {t('page.prototype_banner')}
      </div>

      <div className="mx-auto max-w-[1200px] px-6 py-6">
        <h1 className="mb-6 text-2xl font-semibold">{t('page.title')}</h1>

        <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-6">
          <Accordion
            type="multiple"
            value={openSections}
            onValueChange={setOpenSections}
            className="flex flex-col gap-6"
          >
            <SectionCard id="analysis" index={1} titleKey="analysis">
              <AnalysisSection state={state} update={update} />
            </SectionCard>
            {/* The fetus is the one sequenced; §2 holds the mother's identity in a prenatal case. */}
            <SectionCard id="patient" index={2} titleKey={state.prenatal ? 'patient_prenatal' : 'patient'}>
              <PatientSection state={state} update={update} />
            </SectionCard>
            <SectionCard id="clinical_signs" index={3} titleKey="clinical_signs">
              <ClinicalSignsSection state={state} update={update} />
            </SectionCard>
            <SectionCard id="other_clinical" index={4} titleKey="other_clinical">
              <OtherClinicalSection state={state} update={update} />
            </SectionCard>
            <SectionCard id="family" index={5} titleKey="family">
              <FamilySection state={state} update={update} showErrors={showFamilyErrors} />
            </SectionCard>
          </Accordion>

          <CaseRail
            state={state}
            gate={gate}
            flash={flash}
            onCreate={() => {
              if (gate.done !== gate.total) {
                // Open every section that still misses something, and bring the first into view.
                setOpenSections(open => [...new Set([...open, ...gate.missing])]);
                requestAnimationFrame(() =>
                  document
                    .querySelector(`[data-section="${gate.missing[0]}"]`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                );
                return flashNote(t('flash.incomplete'));
              }
              // The core gate is met; cards in the analysis may still miss their own fields.
              const missing = familyProblemCount(state);
              if (missing === 0) return flashNote(t('flash.created'));
              setShowFamilyErrors(true);
              setOpenSections(open => (open.includes('family') ? open : [...open, 'family']));
              flashNote(t('flash.family_missing', { count: missing }));
              requestAnimationFrame(() =>
                document
                  .querySelector('[data-family-invalid]')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
              );
            }}
            onDraft={() => flashNote(t('flash.draft'))}
          />
        </div>
      </div>
    </div>
  );
}

export default CaseCreationPage;
