// Patient organizations and the existing-patient lookup, as in the wireframe.
// Organization names are proper nouns, the same in both languages.

export const ORGS = ['CHU Sainte-Justine', 'CHUM', 'CUSM — McGill', 'CHU de Québec'];

export type SexCode = 'M' | 'F' | 'U';

export type PatientRecord = {
  jhn: string;
  firstName: string;
  lastName: string;
  sex: SexCode;
  dob: string;
};

/** Keyed on organization + identifier, which is unique. Anything else is a new patient. */
export const PATIENT_DB: Record<string, PatientRecord> = {
  'CHU Sainte-Justine|1234': {
    jhn: 'TREL 1953 0801',
    firstName: 'Léa',
    lastName: 'Tremblay',
    sex: 'F',
    dob: '2019-03-08',
  },
};

export const LOOKUP_DELAY = 700;

export function lookupKey(org: string, id: string): string | null {
  return org && id.trim() ? `${org}|${id.trim()}` : null;
}
