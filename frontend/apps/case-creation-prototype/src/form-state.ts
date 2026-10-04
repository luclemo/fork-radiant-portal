import type { PriorityCode } from './mock/options';
import type { PatientRecord, SexCode } from './mock/patients';

/** Gestational basis — built with §2's prenatal block. `demise` is « Fœtus décédé ». */
export type GestBasis = 'lmp' | 'edd' | 'demise';

export type FormState = {
  // §1
  analysisCode: string;
  priority: PriorityCode;
  prenatal: boolean;
  study: string;
  prescriberIsMe: boolean;
  prescriberName: string;
  // §2
  patientId: string;
  patientOrg: string;
  jhn: string;
  dob: string;
  sex: SexCode | '';
  firstName: string;
  lastName: string;
  /** One answer per org + identifier key, so a rejected key never re-opens the dialog in a loop. */
  lookupDecisions: Record<string, 'confirmed' | 'rejected'>;
  /** What the lookup itself wrote, so it can take back exactly that — and nothing edited since. */
  autofilled: PatientRecord | null;
  /** Sex before prenatal prefilled Féminin; put back when the box is unticked. */
  sexBeforePrenatal: SexCode | '' | null;
  // §2 prenatal block
  fetalSex: SexCode | '';
  gestBasis: GestBasis | null;
  lmpDate: string;
  eddDate: string;
  /**
   * Priority prefill — two flags because they are two different facts (DESIGN-NOTES › Prenatal).
   * `priorityBeforePrenatal` is non-null exactly while the form owns the value, and holds what to
   * put back. `priorityUserSet` says whether the form may take it at all. With one flag, letting go
   * on a demise let the form grab the value back on the way to DDM, overwriting a deliberate call.
   */
  priorityBeforePrenatal: PriorityCode | null;
  priorityUserSet: boolean;
};

export const INITIAL_STATE: FormState = {
  analysisCode: '',
  priority: 'routine',
  prenatal: false,
  study: '',
  prescriberIsMe: true,
  prescriberName: '',
  patientId: '',
  patientOrg: '',
  jhn: '',
  dob: '',
  sex: '',
  firstName: '',
  lastName: '',
  lookupDecisions: {},
  autofilled: null,
  sexBeforePrenatal: null,
  fetalSex: '',
  gestBasis: null,
  lmpDate: '',
  eddDate: '',
  priorityBeforePrenatal: null,
  priorityUserSet: false,
};

/**
 * STAT is prefilled for a prenatal case, but not for a fetal demise — nothing to rush for. Two
 * inputs decide it (the checkbox and the basis), so this one idempotent function reconciles after
 * either changes, in any order. Returns the state unchanged when there is nothing to do.
 */
export function reconcilePriority(s: FormState): FormState {
  const wantStat = s.prenatal && s.gestBasis !== 'demise';
  if (wantStat) {
    if (!s.priorityUserSet && s.priorityBeforePrenatal === null) {
      return { ...s, priorityBeforePrenatal: s.priority, priority: 'stat' };
    }
    return s;
  }
  if (s.priorityBeforePrenatal !== null) {
    return {
      ...s,
      priority: s.priority === 'stat' ? s.priorityBeforePrenatal : s.priority,
      priorityBeforePrenatal: null,
    };
  }
  return s;
}

/**
 * Ticking « Cas prénatal » afresh is a fresh prefill, whatever was chosen before. The patient of
 * record is then the mother, so Sex is known: prefilled Féminin, still editable, and put back
 * unconditionally on untick — unlike Priority, where the user's own answer keeps winning.
 */
export function setPrenatal(s: FormState, on: boolean): FormState {
  const next: FormState = on
    ? { ...s, prenatal: true, priorityUserSet: false, sexBeforePrenatal: s.sex, sex: 'F' }
    : // Closing the block clears what it revealed: nothing hidden reaches the case.
      {
        ...s,
        prenatal: false,
        sex: s.sexBeforePrenatal ?? s.sex,
        sexBeforePrenatal: null,
        fetalSex: '',
        gestBasis: null,
        lmpDate: '',
        eddDate: '',
      };
  return reconcilePriority(next);
}

/** Switching basis clears the other date: only the chosen one is the value. */
export function setGestBasis(s: FormState, basis: GestBasis): FormState {
  return reconcilePriority({
    ...s,
    gestBasis: basis,
    lmpDate: basis === 'lmp' ? s.lmpDate : '',
    eddDate: basis === 'edd' ? s.eddDate : '',
  });
}

/** Take back only what the lookup wrote, and only fields not edited since. */
export function clearAutofill(s: FormState): FormState {
  const a = s.autofilled;
  if (!a) return s;
  return {
    ...s,
    jhn: s.jhn === a.jhn ? '' : s.jhn,
    firstName: s.firstName === a.firstName ? '' : s.firstName,
    lastName: s.lastName === a.lastName ? '' : s.lastName,
    dob: s.dob === a.dob ? '' : s.dob,
    sex: s.sex === a.sex ? '' : s.sex,
    autofilled: null,
  };
}

/** « Utiliser ce patient » — the only path by which looked-up PHI reaches the form. */
export function confirmPatient(s: FormState, key: string, rec: PatientRecord): FormState {
  const base = clearAutofill(s);
  return {
    ...base,
    ...rec,
    autofilled: rec,
    lookupDecisions: { ...base.lookupDecisions, [key]: 'confirmed' },
  };
}

/** Rejecting means the key is wrong. Nothing typed is erased; the identifier is marked instead. */
export function rejectPatient(s: FormState, key: string): FormState {
  return { ...clearAutofill(s), lookupDecisions: { ...s.lookupDecisions, [key]: 'rejected' } };
}

/** The user's own answer wins, and keeps winning for this episode. */
export function setPriorityByUser(s: FormState, priority: PriorityCode): FormState {
  return { ...s, priority, priorityBeforePrenatal: null, priorityUserSet: true };
}

/** Ticking « Je suis médecin prescripteur » again clears the typed name (nothing hidden reaches the case). */
export function setPrescriberIsMe(s: FormState, me: boolean): FormState {
  return { ...s, prescriberIsMe: me, prescriberName: me ? '' : s.prescriberName };
}
