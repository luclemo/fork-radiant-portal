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
    patient_prenatal: 'Patient (proband, mother)',
    clinical_signs: 'Clinical signs',
    other_clinical: 'Other clinical information (optional)',
    optional_sections: 'Optional sections',
    family: 'Family',
    placeholder: 'Section coming soon',
  },
  analysis: {
    label: 'Analysis',
    placeholder: 'Select an analysis…',
    no_match: 'No results found', // matches the MONDO field's empty state
    priority: 'Priority',
    prenatal: 'Prenatal case',
    study: 'Research study (consent obtained)',
    study_placeholder: 'Select a study…',
    clear_selection: '↺ Clear selection',
    prescriber_is_me: 'I am the ordering or responsible physician',
    prescriber: 'Who is requesting this analysis',
    prescriber_placeholder: 'Physician’s name',
  },
  category: {
    prenatal: 'Prenatal',
    postnatal: 'Postnatal',
  },
  rail: {
    create: 'Create case',
    save_draft: 'Save draft',
    required_count: '{{done}} of {{total}} required fields',
    summary: 'Case summary',
    analysis: 'Analysis',
    category: 'Pre/Postnatal', // as in the case list
    priority: 'Priority',
    proband_id: 'Proband ID',
    mother_id: 'Mother ID',
    patient_org: 'Patient organization',
    sex: 'Sex',
    sex_mother: 'Sex (mother)',
    dob: 'Date of birth',
    name: 'Name',
    phenotypes: 'Phenotypes',
    fetal: 'Fetal information',
    fetal_sex: 'Fetal sex',
    gest_age: 'Gestational age',
    optional_additions: 'Optional additions',
    condition: 'Primary indication',
    consanguinity: 'Consanguinity',
    ethnicities: 'Ethnicities',
    note: 'Clinical note',
    family: 'Family',
    terms_one: '{{count}} term',
    terms_other: '{{count}} terms',
    members_one: '{{count}} member',
    members_other: '{{count}} members',
  },
  flash: {
    incomplete: 'Complete the core fields above, then Create becomes available.',
    created: '✓ Case created (prototype — nothing was actually saved).',
    draft: '✓ Draft saved (prototype) — you can leave and finish later.',
  },
};

export default en;
