// Priority codes match the design system's PriorityIndicator, which carries their FR/EN labels.
// `asap` exists there too; the form offers the wireframe's three.
export type PriorityCode = 'routine' | 'urgent' | 'stat';
export const PRIORITIES: PriorityCode[] = ['routine', 'urgent', 'stat'];

// Placeholder studies (project_code), same in both languages.
export const STUDIES = ['Pragmatic', 'Care4Rare', 'RQDM'];

// Consanguinity value set, codes as in the backend's `consanguinity` table. Labels in i18n.
export type ConsanguinityCode = 'consanguinity' | 'no_consanguinity' | 'unknown';
export const CONSANGUINITY: ConsanguinityCode[] = ['consanguinity', 'no_consanguinity', 'unknown'];

// Ethnicity (`ancestry`), the wireframe's eight from clin-fhir's qc-ethnicity CodeSystem. Only
// CA-FR, EU and ES-AS are in the qlin seed (backend/scripts/init-sql/qlin/ancestry.sql); the other
// codes are placeholders.
export const ETHNICITIES = [
  { code: 'CA-FR', fr: 'Canadien français', en: 'French Canadian' },
  { code: 'EU', fr: 'Caucasien européen', en: 'European Caucasian' },
  { code: 'AFR', fr: 'Africain ou caribéen', en: 'African or Caribbean' },
  { code: 'LAT-AM', fr: 'Hispanique', en: 'Hispanic' },
  { code: 'ES-AS', fr: 'Asiatique de l’est et du sud-est', en: 'East and Southeast Asian' },
  { code: 'SO-AS', fr: 'Asiatique du sud', en: 'South Asian' },
  { code: 'FN', fr: 'Amérindien', en: 'Amerindian' },
  { code: 'MIX', fr: 'Origine mixte', en: 'Mixed origin' },
];
