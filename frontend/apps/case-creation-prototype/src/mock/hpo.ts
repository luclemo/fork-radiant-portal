// The full HPO ontology (~18,690 terms), copied from the wireframe, which took it from the HPO
// mock. One line per term: number | French | English | flag | parent numbers. French labels came
// from EBI OLS and are largely machine-translated (open question 5). The real form would call
// `hpoTermAutoComplete`; the tree has no endpoint yet (COMPONENT-TODO).
import RAW from './hpo-terms.txt?raw';

export type HpoTerm = {
  id: string;
  fr: string;
  en: string;
  parents: string[];
  kids: string[];
  /** Folded label + HP id, one per language: a search only looks at the displayed language. */
  hay: { fr: string; en: string };
};

/** Accent- and case-insensitive, so « genetique » finds « génétique ». */
export function fold(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const hpid = (n: string) => `HP:${n.padStart(7, '0')}`;

// Hand fixes from the wireframe, for common and suggested terms the machine translation got wrong.
const FR_FIX: Record<string, string> = {
  'HP:0001250': 'Crise d’épilepsie',
  'HP:0002123': 'Épilepsie myoclonique généralisée',
  'HP:0005110': 'Fibrillation auriculaire',
  'HP:0001744': 'Splénomégalie',
  'HP:0001399': 'Insuffisance hépatique',
  'HP:0000648': 'Atrophie optique',
  'HP:0002376': 'Régression psychomotrice',
  'HP:0001344': 'Absence de langage',
  'HP:0000750': 'Retard de langage',
  'HP:0010864': 'Déficience intellectuelle sévère',
  'HP:0001263': 'Retard global de développement',
  'HP:0000508': 'Ptose',
  'HP:0001488': 'Ptose bilatérale',
  'HP:0006582': 'Épisodes de type syndrome de Reye',
};

export const HPO_BY_ID: Record<string, HpoTerm> = {};
export const HPO_LIST: HpoTerm[] = [];

for (const line of RAW.split('\n')) {
  if (!line) continue;
  const [n, fr0, en0, , parents] = line.split('|');
  const id = hpid(n);
  const fr = FR_FIX[id] ?? (fr0 || en0);
  const en = en0 || fr0;
  const term: HpoTerm = {
    id,
    fr,
    en,
    parents: parents ? parents.split(',').map(hpid) : [],
    kids: [],
    hay: { fr: `${fold(fr)}|${id.toLowerCase()}`, en: `${fold(en)}|${id.toLowerCase()}` },
  };
  HPO_BY_ID[id] = term;
  HPO_LIST.push(term);
}
for (const term of HPO_LIST) {
  for (const p of term.parents) HPO_BY_ID[p]?.kids.push(term.id);
}

export type Lang = 'fr' | 'en';

export const termLabel = (id: string, lang: Lang) => HPO_BY_ID[id]?.[lang] ?? id;

export const byLabel = (lang: Lang) => (a: string, b: string) =>
  termLabel(a, lang).localeCompare(termLabel(b, lang), lang);

/** « Phenotypic abnormality » — its children are the tree's top categories. */
export const TREE_ROOT = 'HP:0000118';

/**
 * Suggested phenotypes. Per-analysis lists are a clinical call nobody has made (open question 2),
 * so every analysis shows the same placeholder list — except a rapid exome and an unspecific
 * genome, ordered precisely because the picture isn't narrowed down.
 */
const SUGGESTIONS_DEFAULT = [
  'HP:0001263',
  'HP:0001249',
  'HP:0001256',
  'HP:0002342',
  'HP:0010864',
  'HP:0000750',
  'HP:0001344',
  'HP:0000252',
  'HP:0000717',
  'HP:0000729',
  'HP:0001290',
  'HP:0001257',
  'HP:0002376',
  'HP:0001250',
];
const SUGGESTIONS_NONE = ['RAPIDE', 'GENOR'];

export function suggestionsFor(analysisCode: string): string[] {
  if (!analysisCode || SUGGESTIONS_NONE.includes(analysisCode)) return [];
  return SUGGESTIONS_DEFAULT;
}

/**
 * The HPO onset value set, as in the HPO mock. The code is stored as the Term's `onset_code`; the
 * key names its label in i18n (an HP id can't be a key: i18next reads « : » as a namespace).
 */
export const ONSETS = [
  { code: 'unknown', key: 'unknown' },
  { code: 'HP:0030674', key: 'antenatal' },
  { code: 'HP:0003577', key: 'congenital' },
  { code: 'HP:0003623', key: 'neonatal' },
  { code: 'HP:0003593', key: 'infantile' },
  { code: 'HP:0011463', key: 'childhood' },
  { code: 'HP:0003621', key: 'juvenile' },
  { code: 'HP:0011462', key: 'young_adult' },
  { code: 'HP:0003596', key: 'middle_age' },
  { code: 'HP:0003584', key: 'late' },
] as const;
export type OnsetCode = (typeof ONSETS)[number]['code'];
