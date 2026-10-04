// French is the default language of the form. Every key here has a twin in en.ts.
// Wording is the wireframe's, unchanged, unless a note says otherwise.
const fr = {
  page: {
    title: 'Nouveau cas',
    prototype_banner: 'Prototype de design — pas du code de production',
  },
  section: {
    analysis: 'Analyse',
    patient: 'Patient (proband)',
    patient_prenatal: 'Patient (proband, mère)',
    clinical_signs: 'Signes cliniques',
    other_clinical: 'Autres informations cliniques (facultatives)',
    optional_sections: 'Sections facultatives',
    family: 'Famille',
    placeholder: 'Section à venir',
  },
  analysis: {
    label: 'Analyse',
    placeholder: 'Sélectionner une analyse…',
    no_match: 'Aucun résultat trouvé', // matches the MONDO field's empty state
    priority: 'Priorité',
    prenatal: 'Cas prénatal',
    study: 'Étude de recherche (consentement obtenu)',
    study_placeholder: 'Sélectionner une étude…',
    clear_selection: '↺ Effacer la sélection',
    prescriber_is_me: 'Je suis médecin prescripteur ou responsable',
    prescriber: 'Qui demande cette analyse',
    prescriber_placeholder: 'Nom du médecin',
  },
  category: {
    prenatal: 'Prénatal',
    postnatal: 'Postnatal',
  },
  rail: {
    create: 'Créer le cas',
    save_draft: 'Enregistrer le brouillon',
    required_count: '{{done}} sur {{total}} champs requis',
    summary: 'Résumé du cas',
    analysis: 'Analyse',
    category: 'Pré/Postnatal', // as in the case list
    priority: 'Priorité',
    proband_id: 'ID proband',
    mother_id: 'ID mère',
    patient_org: 'Établissement du patient',
    sex: 'Sexe',
    sex_mother: 'Sexe (mère)',
    dob: 'Date de naissance',
    name: 'Nom',
    phenotypes: 'Phénotypes',
    fetal: 'Informations fœtales',
    fetal_sex: 'Sexe fœtal',
    gest_age: 'Âge gestationnel',
    optional_additions: 'Ajouts facultatifs',
    condition: 'Indication principale',
    consanguinity: 'Consanguinité',
    ethnicities: 'Ethnicité(s)',
    note: 'Note clinique',
    family: 'Famille',
    terms_one: '{{count}} terme',
    terms_other: '{{count}} termes',
    members_one: '{{count}} membre',
    members_other: '{{count}} membres',
  },
  flash: {
    incomplete: 'Complétez les champs essentiels ci-dessus, puis « Créer » devient disponible.',
    created: '✓ Cas créé (prototype — rien n’a réellement été enregistré).',
    draft: '✓ Brouillon enregistré (prototype) — vous pouvez quitter et terminer plus tard.',
  },
};

export default fr;
