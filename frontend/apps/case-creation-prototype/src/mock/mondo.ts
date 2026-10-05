// The indication list: the catalog's 26 distinct MONDO conditions, labels from EBI OLS (open
// question 1), plus the wireframe's catch-all. The real form would call `mondoTermAutoComplete`;
// with no MONDO hierarchy on disk, the browser lists these flat (see mondo-browser.tsx).
import { ANALYSES } from './analyses';
import { fold, type Lang } from './hpo';

export type Condition = { id: string; fr: string; en: string };

/** Not a MONDO term: the wireframe's way to say "no indication yet, read the phenotypes". */
export const UNDIAGNOSED = 'undiagnosed';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const fromCatalog = new Map<string, Condition>();
for (const a of ANALYSES) {
  if (!a.primaryCondition?.startsWith('MONDO:') || fromCatalog.has(a.primaryCondition)) continue;
  fromCatalog.set(a.primaryCondition, {
    id: a.primaryCondition,
    fr: a.conditionLabelFr ?? '',
    en: capitalize(a.conditionLabelEn ?? ''),
  });
}

export const CONDITIONS: Condition[] = [
  ...fromCatalog.values(),
  { id: UNDIAGNOSED, fr: 'Non diagnostiqué — voir phénotypes', en: 'Undiagnosed — see phenotypes' },
];

const BY_ID = Object.fromEntries(CONDITIONS.map(c => [c.id, c]));

export function conditionLabel(id: string, lang: Lang) {
  return BY_ID[id]?.[lang] ?? id;
}

/** What the input shows once picked: the label with its code, so the coded answer stays visible. */
export function conditionDisplay(id: string, lang: Lang) {
  return id === UNDIAGNOSED ? conditionLabel(id, lang) : `${conditionLabel(id, lang)} (${id})`;
}

/** Sorted on the label actually displayed — the catch-all stays last. */
export function conditionsSorted(lang: Lang) {
  return [...CONDITIONS].sort((a, b) => {
    if (a.id === UNDIAGNOSED) return 1;
    if (b.id === UNDIAGNOSED) return -1;
    return a[lang].localeCompare(b[lang], lang);
  });
}

/** Label + code, raw and folded, so a search finds « epilepsie » and « épilepsie » alike. */
export function conditionHay(c: Condition, lang: Lang) {
  return `${c[lang]} ${fold(c[lang])} ${c.id === UNDIAGNOSED ? '' : c.id}`;
}

/** Only a MONDO code derives the indication; an HPO code or a blank leaves it empty. */
export function derivedCondition(analysisCode: string) {
  const pc = ANALYSES.find(a => a.code === analysisCode)?.primaryCondition;
  return pc?.startsWith('MONDO:') ? pc : '';
}
