# Component to-do

A running list of what the form needs and the design system lacks. For each item, Lucas designs
it (usually in Figma), the prototype uses a local stand-in until then, and the FE team adds the real
component to Storybook.

Status: **needs design** → **designed** (Figma link) → **stand-in built** → **handed to FE**.

## Missing components

| Component | Used for | Status | Figma | Notes |
|---|---|---|---|---|
| Progress bar | Rail: « x sur 7 champs requis » | needs design | — | Nothing like it in the library. |
| Date input | DDN (§2), DDM / DPA (prenatal) | needs design | — | No date picker or date field exists. |
| Segmented control (empty start, clearable) | Sexe (§2, fetal, §5), Consanguinité (§4) | needs design | — | `ToggleButtonGroup` must start with a value and cannot be unselected. |
| Tree browser with checkboxes | HPO browser (§3), MONDO browser (§4) | needs design | — | No tree component at all. |
| Pedigree | Rail | needs design | — | Symbols exist as icons (`base/icons/pedigree-*`). Lines and layout are new. |

## Changes to existing components

| Component | Gap | Status |
|---|---|---|
| AutoComplete (`base/data-entry/auto-complete.tsx`) | Search ignores accents (« genetique » misses « génétique ») | open |
| AutoComplete | Shows a ✕ even on a required field, which should not be clearable | open |
| AutoComplete | No highlight of the matching text in results | open |
| AutoComplete | Looks like a text input, no chevron. Check in review whether that reads as a select | open |

AutoComplete searches one field only. That is not a gap: the prototype passes a combined name + code
text, the same way the MONDO field in the interpretation form does.
