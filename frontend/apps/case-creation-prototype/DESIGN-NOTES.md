# Case creation — design notes

The behaviour spec for the hi-fi prototype. Ported on 2026-09-29 from the wireframe's `CLAUDE.md`
(`~/Sandbox/radiant-case-creation/case-create-wireframe/`), which stays the record of how each
decision was reached. **Decisions here are settled — don't re-litigate them.** New decisions go in
with their *why*.

Current to **2026-10-04**.

## What this is

A high-fidelity design prototype. The FE team will not ship it. It is worth two things: fidelity to
the real design system, and a link people can open without a checkout. See `/DESIGN-PROTOTYPE.md`.

The design idea is **derive-and-hide**: any required value the system can work out is dropped from
the form and set behind the scenes. Case type comes from the analysis and shows as a badge.

## Working rules

- **UI copy is French and English**, French by default. Every visible string is a key in both.
- **Strings live in this folder**, in `src/i18n/`, registered at runtime as their own namespace.
  The shared `translations/common/*.json` files are not touched. **To revisit** once the build is
  further along: how these keys should reach the real translation files.
- **Mock data lives in this folder** (`src/mock/`), in memory. No MSW: the hosted Storybook cannot
  run its service worker. Mocks follow the real API shapes where one exists.
- **Missing components are findings, not patches.** They go in `COMPONENT-TODO.md` with a local
  stand-in. The component library is never modified.
- Commits are an explicit ask; pushing is a second, separate ask.

## The form

Five sections, French by default. `*` = in the required gate.

**1 · Analyse** — Analyse\* | Priorité (Routine; **prefilled STAT in a prenatal case**, see
Prenatal); ☐ **Cas prénatal**; « Étude de recherche » full width (picking a study *is* the consent,
so there is no separate checkbox); then the prescriber, alone on its line and **carrying no field
label** — just ☑ « Je suis médecin prescripteur ou responsable », with « Qui demande cette
analyse » + an input appearing only when unticked.

**2 · Patient (proband)** — Identifiant\* | Établissement du patient\*, the lookup status line
spanning the row, RAMQ | **DDN\* · Sexe\*** sharing one cell, Prénom\* | Nom\*. The DDN · Sexe pair
fits one column only because both halves shrink: the label to « DDN » (§2 only — §5 and the patient
dialog still spell out « Date de naissance »), and Sexe to initials with the full word as tooltip.
The rail shows the full word, « Féminin » not « F ».

In **prenatal** mode the title becomes « Patient (proband, mère) » and Sexe prefills Féminin. The
fetus is the one sequenced; this section holds the *mother's* identity only because a fetus has no
identifying information of its own. A prenatal block — **« Informations fœtales »** — then opens at
the end of the section: Sexe (fœtus), then Âge gestationnel as DDM / DPA / Fœtus décédé, **the date
directly under the option that asks for it** (the option is the label) with the derived age to its
right.

**3 · Signes cliniques** — the ask, the search row (HPO search + tree button) **pinned directly
under it**, then « Phénotypes observés (n) » and « Suggestions » — one column, 5 shown, « Afficher
n de plus ». Every row is the same checklist row: checkbox, term, HP id, and an onset menu once
ticked (observed only). Below a rule, the not-observed half: picks as dismissable badges and one
button opening the HPO browser — no checkbox, no inline search, because it is a short aside rather
than the list you work through. Rhythm: 12 px under an instruction, 16 px before a sub-heading,
6 px under one.

**4 · Autres informations cliniques (facultatives)** — Consanguinité | Ethnicité(s) (chips);
Indication principale (MONDO typeahead + browse); Note clinique. **« Note clinique » keeps its
label** (2026-09-29) even though it now also carries the diagnosis hypothesis (see Backend).

**5 · Famille** — under « Sections facultatives ». No opt-in checkbox; a standing description
carries the ask, so the section is always open. One card per relative, in two halves: the
family-history top line (Lien de parenté · Sexe · Statut · Préciser), then ☐ « Inclure dans
l'analyse génétique », which opens the patient-identification block — because a member in the
analysis becomes a Patient in Radiant. Statut shows as initials so the free text takes the width
that is left.

**Prenatal exception**: a « Mère » card in the analysis does not re-ask for §2's identity. It shows
one derived line (« Dossier patient : **A-77** · CHU Sainte-Justine · Marie-Claude Gagnon »),
repainted whenever §2 changes. The identification inputs stay **empty and hidden** behind it, so
nothing stale reaches the case and switching the card to another relative opens a blank block. The
rule: prenatal **and** Mother **and** in the analysis.

**Rail** — the two actions **lead the card**: Créer le cas · Enregistrer le brouillon · progress
bar · `x sur 7 champs requis`, then 22 px, then « Résumé du cas »:

> Analyse (+ germline/somatic badge, + a composition badge once not solo) · Pré/Postnatal · Priorité ·
> ID proband · Établissement du patient · Sexe · Date de naissance · **Nom** · **Phénotypes** ·
> [« Informations fœtales »: Sexe fœtal · Âge gestationnel] · « Ajouts facultatifs »: Indication
> principale · Consanguinité · Ethnicité(s) · Note clinique · Famille · **pedigree**

- « Phénotypes » sits **above** the fetal block even though §3 follows §2, because that block is a
  *captioned* group and a captioned group must end at the next caption — below it, the proband's
  count read as a fetal fact.
- In prenatal mode « ID proband » → « ID mère » and « Sexe » → « Sexe (mère) ». DDN and Nom are
  hers too but are **not** qualified — three parentheses in a row would be noise.
- The gestational row carries what is stored **and** what is derived: « DDM 2026-04-02 · 24 sem. ».
- Wireframe geometry: shell 1200 px, rail 340 px, sticky 24 px from the top. With a pedigree drawn
  the rail can exceed a laptop viewport, but what falls below the fold is a picture, not the button.

## Conventions

- **A placeholder names the thing it wants, unless the control is too narrow to show it.**
  « Sélectionner une étude… », « …un établissement… ». **The relation field in §5 is the one
  exception** (« Sélectionner… »): it stays as narrow as its labels allow, and a placeholder you
  cannot read names nothing.
- **Free-text placeholders say what to type**: the prescriber's input asks « Nom du médecin »
  (« Qui demande cette analyse » is its *label*); the names read « Prénom » / « Nom », a bare echo,
  because a name has no format or example to offer.
- **Every dropdown is clearable** back to its placeholder while filled — **except a required one**,
  which keeps no clear.
- **« Inconnu » is an answer, so the rail inks it.** A value goes dark as soon as the user has
  answered, Unknown included; only the em-dash stays muted. Pré/Postnatal and Priorité ink
  unconditionally — they ship with defaults.
- **The indication field is a typeahead, not a select.** Free text is never a value: on blur the
  real label comes back.
- **Ethnicity is the one multi-valued control**, painted as removable chips.
- **One way a phenotype is drawn**: the same checklist row everywhere an observed term appears.
  Selection is the row's own ticked state — a term is dropped by unticking it, no ✓/✗ marker and no
  row ✕. A not-observed pick is a pill with a ✕. A picked term never appears twice: it leaves the
  suggestions for the picked list.
- **Only the observed list has an inline search.**
- **Not-observed badges are deliberately not struck through** — the heading already says these were
  looked for and absent; strikethrough reads as "removed from the list".
- **Blocks that open behind a checkbox clear themselves when closed** — prenatal fields, the family
  identification block, the prescriber input. Nothing hidden reaches the case. (The not-observed
  list is the exception: no checkbox, so badges are dropped one at a time.)
- **User text is never rendered as HTML.** An identifier is free text.
- **Reviewer annotations** (field codes and numbered footnotes on a « Codes » toggle) were a
  wireframe device. **Not ported yet** — decide whether the hi-fi needs them.

## Decisions already made (don't re-litigate)

### Analysis, catalog, phenotypes

- **The analysis menu is searchable** once a list passes 8 entries. It matches `name` **and**
  `code`, **anywhere in the string** (names start with the act number, so prefix-only would never
  find "muscul"), accent- and case-insensitive, and highlights the run.
- **The real 37-analysis catalog** (`analysis_catalog_qlin.csv`, tenant `qlin`), in CSV order.
- **Primary condition derives only from a MONDO code** — an HPO code or a blank leaves it empty
  (RHAB, RAPIDE, GENOR don't derive).
- **Case type (germline/somatic) comes from `analysis_type_code`** — one per analysis.
- **Suggested phenotypes are one placeholder list for every analysis**, except RAPIDE and GENOR,
  which get none.
- **HPO search is scoped to the displayed language.** Searching "hearing" in French returns nothing,
  on purpose. The HP id matches in both.
- **The MONDO browser is a shell** — with no hierarchy on disk it lists the catalog's conditions
  flat and says so on screen.
- **Long HPO labels wrap** rather than truncate, except on a row showing its onset menu, where the
  name ellipsizes with the full term in its tooltip.

### The patient and the lookup

- **« Établissement du patient »** (not "issuing site") — FHIR's `managingOrganization`. **No
  default value.**
- **The identifier leads §2**, labelled simply « Identifiant »; examples live in its placeholder.
  No id-type dropdown. The lookup keys on **organization + identifier** and fires whenever the pair
  is complete, whichever half moved last. Mock: **1234** at Sainte-Justine, 700 ms delay; anything
  else reports "nouveau patient". While the pair is incomplete the line says **nothing**.
- **A found patient is confirmed before any PHI is written.** A match opens a dialog showing the
  record in full — names, sex, DOB, RAMQ — and only « Utiliser ce patient » writes it. Full PHI
  deliberately: the dialog exists so a human can tell two siblings apart.
- **Rejecting a match means the key is wrong**, not "ignore that record" — org + identifier is
  unique, so there is deliberately **no "use it anyway"**. Rejecting marks the identifier in error,
  warns, and **blocks Create** while leaving Save draft alone. What was typed is never erased. One
  answer is recorded per key, so a rejected key never re-opens the dialog in a loop.

### The gate

- **7 required fields, 9 in a prenatal case.** Analysis, identifier, patient organization, sex,
  date of birth, **name**, **clinical signs**; prenatal adds fetal sex and gestational age.
- **The rail's count *is* its rows** — the gate is how many required rail rows are inked.
- **First and last name count as ONE item**, because they share one rail row. Both halves are needed
  to tick it. On a §5 card they are checked **separately**, because there each is a field that is
  either filled or not.
- **Clinical signs is satisfied by at least one OBSERVED phenotype** — a not-observed term is an
  aside. The row's *text* still counts every term, so the count answers "what does this case
  record" while the ink answers "is the requirement met".
- §5's « Dossier patient » line **keeps** its no-name fallback: it is read long before the names
  are typed. Only *Create* is gated.

### Prenatal

- **The fetus is the one sequenced; the mother is the patient of record.** A fetus has no
  identifying information, so §2 carries hers. The case is **solo by default** — the fetus alone.
  Sequencing the mother too is optional: that is what her « Inclure dans l'analyse génétique »
  checkbox in §5 is for (confirmed by Lucas, 2026-09-29).
- **Her identification is stated, not re-asked** — derive-and-hide applied to §5. A read-only copy
  of §2 was built first and cut: six inert fields cost 240 px to say nothing new, and fields that
  look editable but are not invite clicks that do nothing. One line replaced it at 43 px.
- **Leaving « Mère » clears the block; a relationship correction does not.** Those values are §2's
  and the user never typed them there — keeping them would hand her identifiers to a sister. On an
  ordinary card the same edit keeps what was typed: that is the user's own input.
- **The pedigree's proband node reads the fetal sex**, not §2's Sexe (which prenatal prefills
  Féminin).
- **Gestational age is stored as a date and derived as an age.** `round(days/7)` from a DDM,
  `round((280 − daysUntil)/7)` from a DPA, on UTC midnights so a DST boundary cannot shift a day.
  **These are CLIN's formulas** (`clin-portal-ui`, `src/utils/age.ts`). An age is only true on the
  day it is computed, so the date is the value and the age is always a view. Gate and display read
  the same computation, so they cannot drift.
- **The date bounds are asymmetric, deliberately.** DDM capped at **today**, no floor. DPA capped at
  **today + 280 days**, no floor (an overdue pregnancy has a due date behind it). Out of range: no
  age, muted rail row, failed gate, marked field — never a silent block.
- **The pedigree slashes the proband on a fetal demise** — « Fœtus décédé » is the only death the
  form records, and standard notation slashes a stillbirth. Prenatal only. Drawn **white on a
  filled symbol**, since the proband is hardcoded affected.
- **Priority is prefilled, never derived.** Ticking « Cas prénatal » sets **STAT**, *unless* the
  basis is « Fœtus décédé » — nothing to rush for. The control stays open throughout and the change
  flashes.
  - **Two inputs decide it** (the checkbox and the basis), so one idempotent reconcile runs on
    either, in any order.
  - **Two flags, not one**: what to put back (held while the form owns the value), and whether the
    user has overridden it. With one flag, letting go on a demise let the form grab the value back
    on the way to DDM, overwriting a deliberate call. Only a fresh tick clears the override.
  - **The user's own answer wins and keeps winning** for that episode. Contrast Sex, which prenatal
    genuinely *knows* and therefore restores unconditionally.

### Family (§5)

- **One section, two roles** — a relative who is only *reported* and one who is also *sequenced*,
  split by a per-member checkbox. No opt-in checkbox on the section, so it never clears itself; a
  card is dropped with its ✕.
- **The per-member checkbox gates the required fields.** A reported-only relative needs nothing
  past the top line. Unticking **blanks** the identification inputs rather than just hiding them.
- **The pedigree draws the family, not the sequencing batch** — every member with a relationship,
  in or out of the analysis. There is **no sequenced ring** in the notation.
- **The composition badge counts the batch** — proband + every card ticked in — as « Duo » ·
  « Trio » · « Quatuor »/"Quad", and past four the count (« 5 séquencés »). Deliberately the
  **opposite** of the pedigree, and the two disagreeing is correct. **Solo shows nothing.** It uses
  the plain badge so the only colour in the row stays on the case type, and it shows even with no
  analysis picked. « Quatuor » is **worth checking with Vincent** — lab usage may be "quad" in both.
- **§5 offers the full relation list** (8 entries), not the four sequenceable ones — family history
  can name a half-sibling or an « Autre ». See open question 9.

### The prescriber

- **One checkbox, no field label.** Default: ☑ « Je suis médecin prescripteur ou responsable »,
  nothing else. Unticking reveals « Qui demande cette analyse » **and** its input, together.
- **Both states feed the one `ordering_physician`** — ticked, the system captures the **current
  user**; unticked, the **typed name**. It derives from the session, not from the page.
- **« Établissement prescripteur » stays removed.** The prescribing organization will not be
  required (decided 2026-09-29).

### The rail

- **Create and Save draft lead the card**, above the fold. The buttons, bar and count move together:
  the bar and count explain the button and are useless apart from it.
- **Feedback flashes under the button that raised it**, in a slot that is empty at rest and costs no
  height. A flash pushes the summary down for 2.4 s — a deliberate trade.
- **Consanguinity is the one segment you can clear** — clicking the selected option again unsets
  it. Every other segmented control is required, so a general toggle would let a stray click
  un-answer one.
- **Statut vital left the form** (team decision). At case creation the value is always Alive.

## Hi-fi decisions

Where the design system already had an answer, the prototype uses it over the wireframe's drawing.

- **Case type uses the DS badge** (`AnalysisTypeCodeBadge`): icon-only, name in the tooltip, as in
  the case list. The wireframe drew a coloured text badge. The DS also has a `germline_family`
  variant ("Family germline"), so it already tells solo from family. **To decide in review**:
  switch to `germline_family` once a relative is sequenced, and whether the composition badge
  (« Trio ») still earns its place beside it. For now: `germline` / `somatic`, composition badge
  still planned for §5.
- **Priority uses the DS `PriorityIndicator`** in the select and the rail, with its own FR/EN
  labels and colours. Codes are `routine` · `urgent` · `stat` (the DS also knows `asap`; the form
  doesn't offer it).
- **Create is never `disabled`.** It looks unavailable until the gate is met, and a click says
  what is missing, as in the wireframe. A disabled button can't explain itself. Logged as a DS
  question.
- **The STAT prefill flashes** with a brief focus ring on the Priority control. The ring only shows
  when the form changed the value, never when the user picked it.
- **Copy follows the app's vocabulary** (2026-10-04): « Proband » replaces « cas index », and the
  rail's « Catégorie » row is « Pré/Postnatal », as in the case list. Kept on purpose:
  « Ethnicité(s) » (several values), « Note clinique » (sentence case), EN "Date of birth".
- **The study is not in the rail**, as in the wireframe. It is optional and not part of the gate.
- **Sexe uses the DS `ToggleGroup`** as in its story: outline, spacing 0 (joined segments), and
  its own state colours (Lucas, 2026-10-04). The tooltip sits on the label inside each item.
- **The patient dialog is the DS `Dialog`.** Esc, the backdrop and ✕ all reject: the safe way
  out, since it writes nothing.
- **A rejected identifier gets one message, not two** (2026-10-04). The field and its label turn
  red, and the row-wide status line explains. The wireframe also put a message under the field;
  in the hi-fi it pushed the identifier out of line with the organization and said the same thing
  twice.
- **Dates use Lucas's date picker, « With Input » type** (2026-10-04): a field you can type in,
  with a calendar button at its end. Stand-in until the FE team adds it (COMPONENT-TODO).
- **Dates are shown and typed as `aaaa-mm-jj` / `yyyy-mm-dd`**, the app's format in both
  languages, rather than Figma's « Jan 10, 2025 ».
- **The date of birth is capped at today** (new in the hi-fi). Future days are disabled in the
  calendar. A typed future date is marked with a message, its rail row stays muted and it doesn't
  count toward the gate, the same treatment as DDM / DPA out of range. Those bounds are unchanged.
- **§3 rows are the DS `Checkbox` + term + HP id, and a DS `Select` (xs, 28 px) for the onset**
  (2026-10-04). A new observed term starts at « Inconnu ». The ellipsized name's full term is a DS
  `Tooltip`, not a browser title.
- **A search match is shown in bold**, as the app's own term autocomplete does (the backend wraps
  it in `<strong>`). The wireframe used a grey tint. Same in the HPO browser.
- **Not-observed picks are the DS closable `Badge`, `neutral`, default size** (Lucas, 2026-10-04),
  6 px apart. Not `red`, the wireframe's tint: in this app red is the pathogenic / oncogenic
  badge, and these terms were looked for and found absent. The heading already says « non
  observés ».
- **The HPO browser says which list it fills** (new in the hi-fi): one browser serves both lists,
  so its subtitle reads « Les termes cochés seront les phénotypes observés » (or « non observés »).
  The wireframe used the same title for both and nothing else told them apart.
- **The HPO browser is a DS `Dialog`** with a draft: ticks only reach the form on « Appliquer »;
  Esc, ✕, the backdrop and « Annuler » discard them. A term in the other list shows but can't be
  ticked. « Annuler » / « Appliquer » are the app's own words.
- **The whole HPO ontology ships with the prototype** (`src/mock/hpo-terms.txt`, 18,690 terms,
  1.5 MB) so search and the tree behave like the real thing. The real form would call
  `hpoTermAutoComplete`; the tree has no endpoint yet.

## Backend snapshot (upstream/main, 2026-09-29)

The backend is being built for this form in parallel (migration 000038 restores `draft` "for the
case creation form"), so this will move. Re-check before relying on it.

- **What the form sends, and what it doesn't** (decided 2026-09-29):
  - Status is **derived, never shown**: Save draft → `draft`, Create → submitted.
  - Project is **optional**. Diagnostic lab is **removed for now**. Prescribing organization is
    **not required**.
  - Sequencing tasks are likely **not** part of Radiant.
  - The diagnosis hypothesis goes in **`note`** (« Note clinique »).
- **Prenatal is modelled** (migration 000021): a `fetus` record with sex, life status
  (alive / deceased / unknown), optional LMP and EDD dates, and its own observations. The backend
  requires LMP or EDD **unless the fetus is deceased** — the same rule as DDM / DPA / Fœtus décédé.
  It rejects a future LMP (our DDM cap). It has no EDD cap (ours is form-only).
- **In the data the mother is the case's proband** and the fetus hangs off her. In the UX the fetus
  is the one sequenced. This gap is noted, not designed around.
- **Patients must already exist** before a case can reference them. Creating one is a separate call
  that carries the id type and life status.
- **`ordering_physician` is free text**, so the prescriber checkbox + input is the right control.

## Open questions

Numbered as in the wireframe, so they can be cross-referenced. Ranked there by how much they block.

1. **MONDO labels come from EBI OLS** — confirm the source and get the French reviewed. Still **no
   MONDO hierarchy** for the browse button. (Radiant has a `mondoTermAutoComplete` endpoint — check
   whether it can back the browser too.)
2. **Real per-analysis phenotype suggestions** — a clinical call nobody has made.
3. **The catalog has no English names.** In EN the form shows the French name.
4. **Category is not in the catalog**; Postnatal assumed for all 37.
5. **French HPO terms are largely machine-translated** and need a clinician's review.
6. **Two apparent catalog duplicates**: NPC / NEUTP both « Neutropénie congénitale »; HLEB / HLH
   both act 55412. Error, or a real distinction?
7. Whether search should apply to **« Établissement du patient »**. **On hold** since 2026-09-15.
8. **Prenatal requirements are still in flux** (Lucas, 2026-09-29). Build the design as it stands.
   Kept open: the backend needs a **fetus identifier** and a fetus **affected status** the form does
   not ask for; it allows **several fetuses** (twins) where the form assumes one; there is no
   `NEW_BORN` category.
9. **Relations.** Sequenced relatives accept only `mother father brother sister sibling proband`;
   reported-only relatives go to family history, which takes free text. The required condition text
   there will **likely be dropped**. **In a prenatal case, relations must become relative to the
   fetus** — today they are relative to the proband, who is the mother in the data. Keep the design's
   intent (the full list) and keep this open.
10. **Patient id type** — required when a patient is created, and the form has no dropdown. **Coming
    from the backend.**
11. **Resolved (UX)**: the mother is not sent twice by design — the fetus is sequenced by default and
    she joins only when ticked in §5. Whether the backend's "mother = proband" model fits that is
    folded into 8.
12. **Resolved**: `ordering_physician` is free text, so no directory typeahead is needed.
