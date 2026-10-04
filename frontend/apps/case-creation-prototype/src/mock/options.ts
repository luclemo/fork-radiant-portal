// Priority codes match the design system's PriorityIndicator, which carries their FR/EN labels.
// `asap` exists there too; the form offers the wireframe's three.
export type PriorityCode = 'routine' | 'urgent' | 'stat';
export const PRIORITIES: PriorityCode[] = ['routine', 'urgent', 'stat'];

// Placeholder studies (project_code), same in both languages.
export const STUDIES = ['Pragmatic', 'Care4Rare', 'RQDM'];
