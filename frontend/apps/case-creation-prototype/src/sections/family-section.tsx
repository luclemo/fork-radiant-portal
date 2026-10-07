import { PlusIcon, XIcon } from 'lucide-react';

import { Button } from '@/components/base/shadcn/button';
import { Field, FieldError, FieldLabel } from '@/components/base/shadcn/field';
import { Input } from '@/components/base/shadcn/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/base/shadcn/select';
import { Switch } from '@/components/base/shadcn/switch';
import { cn } from '@/components/lib/utils';

import {
  addMember,
  type AffectedCode,
  type FamilyMember,
  type FormState,
  isMirrored,
  memberOrg,
  type MemberProblem,
  memberProblems,
  RELATION_SEX,
  type RelationCode,
  relationsInUse,
  removeMember,
  setMemberField,
  setMemberInAnalysis,
  setMemberRelation,
  UNIQUE_RELATIONS,
} from '../form-state';
import { todayStr } from '../gestational';
import { useCaseCreationT } from '../i18n';
import { ORGS, type SexCode } from '../mock/patients';
import Required from '../required';
import RequiredSegments from '../required-segments';
import DatePicker from '../stand-ins/date-picker';
import { useFlash } from '../use-flash';

type Props = {
  state: FormState;
  update: (fn: (s: FormState) => FormState) => void;
  /** Set once Create has been tried: only then are missing fields marked. */
  showErrors: boolean;
};

const RELATIONS: RelationCode[] = ['mother', 'father', 'sister', 'brother', 'daughter', 'son', 'half_sibling', 'other'];
const SEXES: SexCode[] = ['M', 'F', 'U'];
const STATUSES: AffectedCode[] = ['affected', 'not_affected', 'unknown'];

/**
 * « Dossier patient : A-77 · CHU Sainte-Justine · Marie-Claude Gagnon » — the identifier is what the
 * user scans for, and organization + identifier is the key the lookup runs on. The name is appended
 * only once §2 holds one: this line is read long before the names are typed. Built as text, never
 * HTML — the identifier is free text.
 */
function PatientRecordLine({ state }: { state: FormState }) {
  const { t } = useCaseCreationT();
  const id = state.patientId.trim();
  const name = [state.firstName.trim(), state.lastName.trim()].filter(Boolean).join(' ');
  if (!id || !state.patientOrg) {
    return <p className="text-muted-foreground text-xs leading-normal">{t('family.patient_record_empty')}</p>;
  }
  return (
    <p className="text-muted-foreground text-xs leading-normal">
      {t('family.patient_record')} <b className="text-foreground font-semibold">{id}</b> · {state.patientOrg}
      {name && ` · ${name}`}
    </p>
  );
}

function MemberCard({
  state,
  update,
  member: m,
  showErrors,
}: Props & {
  member: FamilyMember;
}) {
  const { t } = useCaseCreationT();
  const mirrored = isMirrored(state, m);
  const problems = showErrors ? memberProblems(state, m) : [];
  const bad = (p: MemberProblem) => problems.includes(p);
  const dobFuture = !!m.dob && m.dob > todayStr();
  const fid = (k: string) => `cc-fam-${m.uid}-${k}`;

  // The relation fills the sex it implies, so the change flashes: never when the user picked it.
  const sexFlash = useFlash(m.relation, m.relation !== '' && !!RELATION_SEX[m.relation]);

  const used = relationsInUse(state, m.uid);
  const set = <K extends keyof FamilyMember>(key: K, value: FamilyMember[K]) =>
    update(s => setMemberField(s, m.uid, key, value));

  return (
    <div
      id={`cc-fam-${m.uid}`}
      data-family-invalid={problems.length > 0 || undefined}
      className="border-border bg-card relative rounded-lg border p-4"
    >
      <Button
        variant="ghost"
        size="2xs"
        iconOnly
        className="absolute top-2 right-2"
        aria-label={t('family.remove')}
        onClick={() => update(s => removeMember(s, m.uid))}
      >
        <XIcon />
      </Button>

      {/* The family-history record every relative gets. Statut shows initials so the free text
          takes the width that is left; the relation stays as narrow as its labels allow. */}
      <div className="grid grid-cols-[148px_max-content_max-content_minmax(0,1fr)] items-start gap-4">
        <Field>
          <FieldLabel>
            {t('family.relation')} <Required />
          </FieldLabel>
          {/* Required, so no clear row. A parent already on another card can't be picked twice. */}
          <Select value={m.relation} onValueChange={v => update(s => setMemberRelation(s, m.uid, v as RelationCode))}>
            <SelectTrigger size="sm" aria-invalid={bad('relation') || undefined}>
              <SelectValue placeholder={t('family.relation_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {RELATIONS.map(r => (
                <SelectItem key={r} value={r} disabled={UNIQUE_RELATIONS.includes(r) && used.includes(r)}>
                  {t(`family.relations.${r}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field className="w-auto">
          <FieldLabel>
            {t('family.sex')} <Required />
          </FieldLabel>
          <RequiredSegments
            className={cn(
              'rounded-md transition-shadow',
              sexFlash && 'ring-ring ring-2',
              bad('sex') && 'ring-destructive ring-1',
            )}
            value={m.sex}
            options={SEXES}
            label={v => t(`patient.sex_abbr.${v}`)}
            title={v => t(`patient.sex_full.${v}`)}
            onChange={v => set('sex', v)}
          />
        </Field>
        <Field className="w-auto">
          <FieldLabel>{t('family.status')}</FieldLabel>
          {/* Starts at « Inconnu »: an answer, so never required. */}
          <RequiredSegments
            value={m.status}
            options={STATUSES}
            label={v => t(`family.status_abbr.${v}`)}
            title={v => t(`family.statuses.${v}`)}
            onChange={v => set('status', v)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={fid('note')}>{t('family.note')}</FieldLabel>
          <Input
            size="sm"
            id={fid('note')}
            value={m.note}
            onChange={e => set('note', e.target.value)}
            placeholder={t('family.note_placeholder')}
          />
        </Field>
      </div>

      <Field orientation="horizontal" className="mt-4">
        <Switch
          id={fid('in-analysis')}
          size="sm"
          checked={m.inAnalysis}
          onCheckedChange={on => update(s => setMemberInAnalysis(s, m.uid, on))}
        />
        <FieldLabel htmlFor={fid('in-analysis')} className="font-medium">
          {t('family.in_analysis')}
        </FieldLabel>
      </Field>

      {/* A member in the analysis becomes a Patient, so it is identified like the proband (sex is
          already on the line above). The block empties itself when closed. */}
      {m.inAnalysis && (
        <div className="mt-4 border-t pt-4">
          {mirrored ? (
            // Stated, not re-asked: §2 already holds her identity. The inputs stay empty and hidden.
            <PatientRecordLine state={state} />
          ) : (
            <div className="grid grid-cols-2 items-start gap-4">
              <Field data-invalid={bad('identifier') || undefined}>
                <FieldLabel htmlFor={fid('id')}>
                  {t('patient.identifier')} <Required />
                </FieldLabel>
                <Input
                  size="sm"
                  id={fid('id')}
                  value={m.identifier}
                  aria-invalid={bad('identifier') || undefined}
                  onChange={e => set('identifier', e.target.value)}
                  placeholder={t('patient.identifier_placeholder')}
                />
                {bad('identifier') && <FieldError>{t('family.required')}</FieldError>}
              </Field>
              <Field data-invalid={bad('org') || undefined}>
                <FieldLabel>
                  {t('patient.org')} <Required />
                </FieldLabel>
                {/* Follows the proband's organization until the user picks another. */}
                <Select value={memberOrg(state, m)} onValueChange={v => set('org', v)}>
                  <SelectTrigger size="sm" aria-invalid={bad('org') || undefined}>
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
                {bad('org') && <FieldError>{t('family.required')}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor={fid('jhn')}>{t('patient.jhn')}</FieldLabel>
                <Input
                  size="sm"
                  id={fid('jhn')}
                  value={m.jhn}
                  onChange={e => set('jhn', e.target.value)}
                  placeholder={t('patient.jhn_placeholder')}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={fid('dob')}>
                  {t('patient.dob')} <Required />
                </FieldLabel>
                <DatePicker
                  id={fid('dob')}
                  value={m.dob}
                  max={todayStr()}
                  invalid={dobFuture || bad('dob')}
                  onChange={v => set('dob', v)}
                />
                {dobFuture ? (
                  <FieldError>{t('patient.err_dob')}</FieldError>
                ) : (
                  bad('dob') && <FieldError>{t('family.required')}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor={fid('first')}>
                  {t('patient.first_name')} <Required />
                </FieldLabel>
                <Input
                  size="sm"
                  id={fid('first')}
                  value={m.firstName}
                  aria-invalid={bad('firstName') || undefined}
                  onChange={e => set('firstName', e.target.value)}
                  placeholder={t('patient.first_name')}
                />
                {bad('firstName') && <FieldError>{t('family.required')}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor={fid('last')}>
                  {t('patient.last_name')} <Required />
                </FieldLabel>
                <Input
                  size="sm"
                  id={fid('last')}
                  value={m.lastName}
                  aria-invalid={bad('lastName') || undefined}
                  onChange={e => set('lastName', e.target.value)}
                  placeholder={t('patient.last_name')}
                />
                {bad('lastName') && <FieldError>{t('family.required')}</FieldError>}
              </Field>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FamilySection({ state, update, showErrors }: Props) {
  const { t } = useCaseCreationT();
  return (
    <div className="flex flex-col gap-6">
      {/* No opt-in checkbox: a standing description carries the ask, so the section is always open. */}
      <p className="text-muted-foreground text-sm">{t('family.instruction')}</p>
      {/* Cards are containers inside a container, so they step the rhythm down: 16 px, not 24. */}
      {state.family.length > 0 && (
        <div className="flex flex-col gap-4">
          {state.family.map(m => (
            <MemberCard key={m.uid} state={state} update={update} member={m} showErrors={showErrors} />
          ))}
        </div>
      )}
      <Button variant="outline" size="sm" className="self-start" onClick={() => update(addMember)}>
        <PlusIcon />
        {t('family.add')}
      </Button>
    </div>
  );
}

export default FamilySection;
