import type fr from './fr';

// Typed against fr.ts so a key missing from either language fails the type check.
const en: typeof fr = {
  page: {
    title: 'New case',
    prototype_banner: 'Design prototype — not production code',
  },
  section: {
    analysis: 'Analysis',
    patient: 'Patient (proband)',
    clinical_signs: 'Clinical signs',
    other_clinical: 'Other clinical information (optional)',
    optional_sections: 'Optional sections',
    family: 'Family',
    placeholder: 'Section coming soon',
  },
  rail: {
    create: 'Create case',
    save_draft: 'Save draft',
    required_count: '{{done}} of {{total}} required fields',
    summary: 'Case summary',
  },
};

export default en;
