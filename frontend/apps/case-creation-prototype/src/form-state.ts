import type { PriorityCode } from './mock/options';

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
  // §2 prenatal block (fields arrive with §2; the priority rule already reads the basis)
  gestBasis: GestBasis | null;
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
  gestBasis: null,
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

/** Ticking « Cas prénatal » afresh is a fresh prefill, whatever was chosen before. */
export function setPrenatal(s: FormState, on: boolean): FormState {
  const next: FormState = on
    ? { ...s, prenatal: true, priorityUserSet: false }
    : // Closing the block clears what it revealed: nothing hidden reaches the case.
      { ...s, prenatal: false, gestBasis: null };
  return reconcilePriority(next);
}

/** The user's own answer wins, and keeps winning for this episode. */
export function setPriorityByUser(s: FormState, priority: PriorityCode): FormState {
  return { ...s, priority, priorityBeforePrenatal: null, priorityUserSet: true };
}

/** Ticking « Je suis médecin prescripteur » again clears the typed name (nothing hidden reaches the case). */
export function setPrescriberIsMe(s: FormState, me: boolean): FormState {
  return { ...s, prescriberIsMe: me, prescriberName: me ? '' : s.prescriberName };
}
