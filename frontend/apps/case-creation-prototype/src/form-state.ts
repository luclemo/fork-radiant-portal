import type { OnsetCode } from './mock/hpo';
import { derivedCondition } from './mock/mondo';
import type { ConsanguinityCode, PriorityCode } from './mock/options';
import type { PatientRecord, SexCode } from './mock/patients';
import { todayStr } from './gestational';

/** An observed phenotype: the case's Term, `{ id, onset_code }`. */
export type ObservedTerm = { id: string; onset: OnsetCode };

/** Gestational basis — built with §2's prenatal block. `demise` is « Fœtus décédé ». */
export type GestBasis = 'lmp' | 'edd' | 'demise';

/** Family relations (§5). The full list, wider than what the backend sequences — open question 9. */
export type RelationCode = 'mother' | 'father' | 'sister' | 'brother' | 'daughter' | 'son' | 'half_sibling' | 'other';
export type AffectedCode = 'affected' | 'not_affected' | 'unknown';

/**
 * One relative. The top line is the family-history record; the identification fields only count
 * while `inAnalysis` (a member in the analysis becomes a Patient) and are blank otherwise.
 */
export type FamilyMember = {
  uid: number;
  relation: RelationCode | '';
  sex: SexCode | '';
  status: AffectedCode;
  note: string;
  inAnalysis: boolean;
  identifier: string;
  /** `null` = follows the proband's patient organization; a pick (even a clear) is the user's own. */
  org: string | null;
  jhn: string;
  dob: string;
  firstName: string;
  lastName: string;
};

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
  // §3
  observed: ObservedTerm[];
  /** Not-observed terms carry no onset: they were looked for and are absent. */
  notObserved: string[];
  // §4 — all optional
  consanguinity: ConsanguinityCode | '';
  ethnicities: string[];
  /** MONDO id (or the catch-all). Prefilled from the analysis, fully editable. */
  condition: string;
  /** Free text — also carries the diagnosis hypothesis (`note`). */
  note: string;
  // §5 — optional; every card is a family-history record
  family: FamilyMember[];
  nextMemberUid: number;
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
  observed: [],
  notObserved: [],
  consanguinity: '',
  ethnicities: [],
  condition: '',
  note: '',
  family: [],
  nextMemberUid: 1,
};

/**
 * Picking an analysis re-derives the indication, every time: its MONDO condition, or a blank when
 * it derives none (RAPIDE, GENOR, an HPO code) — so a stale indication never outlives a switch.
 */
export function setAnalysis(s: FormState, code: string): FormState {
  return { ...s, analysisCode: code, condition: derivedCondition(code) };
}

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
  return normalizeFamily(setPrenatalFields(s, on));
}

function setPrenatalFields(s: FormState, on: boolean): FormState {
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

/**
 * A term is observed or not observed, never both, so a term already in the other list can't be
 * ticked here. A new observed term starts at « Inconnu »: an onset is asked for, never required.
 */
export function toggleObserved(s: FormState, id: string): FormState {
  if (s.observed.some(o => o.id === id)) return { ...s, observed: s.observed.filter(o => o.id !== id) };
  if (s.notObserved.includes(id)) return s;
  return { ...s, observed: [...s.observed, { id, onset: 'unknown' }] };
}

export function removeNotObserved(s: FormState, id: string): FormState {
  return { ...s, notObserved: s.notObserved.filter(x => x !== id) };
}

export function setOnset(s: FormState, id: string, onset: OnsetCode): FormState {
  return { ...s, observed: s.observed.map(o => (o.id === id ? { ...o, onset } : o)) };
}

/** The HPO browser's « Appliquer »: its ticks replace the list it was opened for. Kept terms keep their onset. */
export function applyBrowser(s: FormState, target: 'observed' | 'notObserved', picked: string[]): FormState {
  if (target === 'notObserved') return { ...s, notObserved: picked };
  const kept = s.observed.filter(o => picked.includes(o.id));
  const added = picked.filter(id => !kept.some(o => o.id === id)).map(id => ({ id, onset: 'unknown' as const }));
  return { ...s, observed: [...kept, ...added] };
}

// ---- §5 Famille ----

/** The sex a relation implies, where it is unambiguous. Half-sibling and Other leave it alone. */
export const RELATION_SEX: Partial<Record<RelationCode, SexCode>> = {
  mother: 'F',
  father: 'M',
  sister: 'F',
  brother: 'M',
  daughter: 'F',
  son: 'M',
};

/** Mother and Father can each appear once; a new card prefills the first not yet used. */
export const UNIQUE_RELATIONS: RelationCode[] = ['mother', 'father'];

/**
 * The one card §2 stands in for: prenatal, Mother, in the analysis. Her identification is stated
 * (derived from §2), not re-asked, so its inputs stay empty and hidden.
 */
export function isMirrored(s: Pick<FormState, 'prenatal'>, m: Pick<FamilyMember, 'relation' | 'inAnalysis'>): boolean {
  return s.prenatal && m.relation === 'mother' && m.inAnalysis;
}

const BLANK_IDENTIFICATION = { identifier: '', org: null, jhn: '', dob: '', firstName: '', lastName: '' } as const;

/**
 * Nothing hidden reaches the case: a card that is out of the analysis, or whose identity §2 holds,
 * keeps no identification. Idempotent, so it runs after anything that could change either fact.
 */
export function normalizeFamily(s: FormState): FormState {
  let changed = false;
  const family = s.family.map(m => {
    if (m.inAnalysis && !isMirrored(s, m)) return m;
    const dirty = m.identifier || m.org !== null || m.jhn || m.dob || m.firstName || m.lastName;
    if (!dirty) return m;
    changed = true;
    return { ...m, ...BLANK_IDENTIFICATION };
  });
  return changed ? { ...s, family } : s;
}

function patchMember(s: FormState, uid: number, patch: Partial<FamilyMember>): FormState {
  return { ...s, family: s.family.map(m => (m.uid === uid ? { ...m, ...patch } : m)) };
}

export function relationsInUse(s: FormState, exceptUid?: number): RelationCode[] {
  return s.family.filter(m => m.uid !== exceptUid && m.relation !== '').map(m => m.relation as RelationCode);
}

/** A new card prefills Mother, then Father; nothing once both exist. */
export function addMember(s: FormState): FormState {
  const used = relationsInUse(s);
  const relation = UNIQUE_RELATIONS.find(r => !used.includes(r)) ?? '';
  const member: FamilyMember = {
    uid: s.nextMemberUid,
    relation,
    sex: relation ? (RELATION_SEX[relation] ?? '') : '',
    status: 'unknown',
    note: '',
    inAnalysis: false,
    ...BLANK_IDENTIFICATION,
  };
  return { ...s, family: [...s.family, member], nextMemberUid: s.nextMemberUid + 1 };
}

export function removeMember(s: FormState, uid: number): FormState {
  return { ...s, family: s.family.filter(m => m.uid !== uid) };
}

/**
 * The relation infers sex where it can (still editable). Leaving « Mère » while she was the mirrored
 * card empties the block — those values are §2's and the user never typed them here — whereas on an
 * ordinary card a relationship correction keeps what was typed.
 */
export function setMemberRelation(s: FormState, uid: number, relation: RelationCode | ''): FormState {
  const inferred = relation ? RELATION_SEX[relation] : undefined;
  const wasMirrored = s.family.some(m => m.uid === uid && isMirrored(s, m));
  let next = patchMember(s, uid, { relation, ...(inferred ? { sex: inferred } : {}) });
  if (wasMirrored && relation !== 'mother') next = patchMember(next, uid, { ...BLANK_IDENTIFICATION });
  return normalizeFamily(next);
}

/** Unticking blanks the identification inputs rather than just hiding them. */
export function setMemberInAnalysis(s: FormState, uid: number, on: boolean): FormState {
  return normalizeFamily(patchMember(s, uid, { inAnalysis: on }));
}

export function setMemberField<K extends keyof FamilyMember>(
  s: FormState,
  uid: number,
  key: K,
  value: FamilyMember[K],
): FormState {
  return patchMember(s, uid, { [key]: value });
}

/** The organization a card shows: its own pick, else the proband's. */
export function memberOrg(s: FormState, m: FamilyMember): string {
  return m.org ?? s.patientOrg;
}

/** The people this case sequences: the proband plus every card ticked into the analysis. */
export function sequencedCount(s: FormState): number {
  return 1 + s.family.filter(m => m.inAnalysis).length;
}

export type MemberProblem = 'relation' | 'sex' | 'identifier' | 'org' | 'dob' | 'firstName' | 'lastName';

/**
 * What Create needs from a card, beyond the core gate. The top line (relation, sex) is the
 * family-history record; a member in the analysis becomes a Patient, so it also needs an identifier,
 * organization, date of birth and — checked separately, as fields — first and last name. The mirrored
 * mother needs none: §2 holds her identity and the core gate already asks for it there.
 */
export function memberProblems(s: FormState, m: FamilyMember): MemberProblem[] {
  const out: MemberProblem[] = [];
  if (!m.relation) out.push('relation');
  if (!m.sex) out.push('sex');
  if (!m.inAnalysis || isMirrored(s, m)) return out;
  if (!m.identifier.trim()) out.push('identifier');
  if (!memberOrg(s, m)) out.push('org');
  if (!m.dob || m.dob > todayStr()) out.push('dob');
  if (!m.firstName.trim()) out.push('firstName');
  if (!m.lastName.trim()) out.push('lastName');
  return out;
}

export function familyProblemCount(s: FormState): number {
  return s.family.reduce((n, m) => n + memberProblems(s, m).length, 0);
}
