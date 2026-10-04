# Component to-do

A running list of what the form needs and the design system lacks. For each item, Lucas designs
it (usually in Figma), the prototype uses a local stand-in until then, and the FE team adds the real
component to Storybook.

Status: **needs design** → **designed** (Figma link) → **stand-in built** → **handed to FE**.

## Missing components

| Component | Used for | Status | Figma | Notes |
|---|---|---|---|---|
| Progress bar | Rail: « x sur 7 champs requis » | stand-in built | — | Nothing like it in the library. Stand-in: `src/stand-ins/progress-bar.tsx`. |
| Date picker, « With Input » type | DDN (§2), DDM / DPA (prenatal) | designed · stand-in built | [Date Picker page](https://www.figma.com/design/Y0l9SoMCYlTQZxce3NzZiK/Radiant-ui-kit---shadcn---January-2025?node-id=244-2898), [components](https://www.figma.com/design/Y0l9SoMCYlTQZxce3NzZiK/Radiant-ui-kit---shadcn---January-2025?node-id=26952-19852), [in a field](https://www.figma.com/design/Y0l9SoMCYlTQZxce3NzZiK/Radiant-ui-kit---shadcn---January-2025?node-id=27119-28101) | shadcn's date picker "Input" example on our theme. Stand-in: `src/stand-ins/date-picker.tsx`. See notes below. |
| Calendar (month + year dropdowns) | Inside the date picker | designed · stand-in built | [components](https://www.figma.com/design/Y0l9SoMCYlTQZxce3NzZiK/Radiant-ui-kit---shadcn---January-2025?node-id=26952-19852) | shadcn's Calendar on our theme. Stand-in: `src/stand-ins/calendar.tsx`. See notes below. |
| Segmented control (empty start, clearable) | Sexe (§2, fetal, §5), Consanguinité (§4) | partly covered | — | `ToggleButtonGroup` must start with a value. The DS `ToggleGroup` (shadcn, has a story) can start empty, so §2 uses it: outline, spacing 0, its own colours. Gap: a tooltip can't wrap an item (it takes over the item's selected state), so the tooltip sits on the label inside. Required groups ignore the click that would empty them. |
| Tree browser with checkboxes | HPO browser (§3), MONDO browser (§4) | needs design · stand-in built (HPO) | — | No tree component at all. Stand-in: `src/stand-ins/hpo-browser.tsx` (DS Dialog + Checkbox, chevron buttons, lazy rows, search with the path to each match). Needs: indent, caret, a node that sits under several parents, a locked row. |
| Pedigree | Rail | needs design | — | Symbols exist as icons (`base/icons/pedigree-*`). Lines and layout are new. |

## Changes to existing components

| Component | Gap | Status |
|---|---|---|
| AutoComplete (`base/data-entry/auto-complete.tsx`) | Search ignores accents (« genetique » misses « génétique ») | open |
| AutoComplete | Shows a ✕ even on a required field, which should not be clearable | open |
| AutoComplete | No highlight of the matching text in results | open |
| AutoComplete | Looks like a text input, no chevron. Check in review whether that reads as a select | open |
| Select (`base/shadcn/select.tsx`) | No way to clear back to the placeholder. The prototype adds a « ↺ Effacer la sélection » row (study, §1) | open |
| Button | A disabled button can't say why. Create is styled unavailable but stays clickable to explain what's missing. Is there a DS pattern for this? | open |
| Badge (`base/shadcn/badge.tsx`) | The ✕ of a closable badge has no accessible name (« Retirer — <terme> ») and passes `onClose` on to the `<div>` too | open |
| Search match highlight | No shared component. The prototype bolds the match (`src/stand-ins/highlight.tsx`), accent-insensitive, like the backend's `<strong>` | open |

AutoComplete searches one field only. That is not a gap: the prototype passes a combined name + code
text, the same way the MONDO field in the interpretation form does.

## Notes for the FE team: date picker and calendar

Lucas's Figma page also has a Time Picker and the « Date Picker / Button » on its own. The form
doesn't use them yet.

- **Calendar needs a new dependency.** shadcn's Calendar is built on `react-day-picker`, which the
  frontend doesn't install. Add it with the shadcn CLI. The prototype doesn't add it: its calendar
  is drawn with `date-fns`, already a dependency, to match the Figma component.
- **Figma measurements** (« Calendar / Basic »): 8 px padding, 16 px between header and grid,
  28 px day cells with 6 px radius and 8 px between rows, 12 px muted weekday labels, 28 px arrow
  buttons with 8 px radius. Selected day = primary. Today = accent. Days outside the month = muted.
- **Date shown and typed as `yyyy-mm-dd`**, not « Jan 10, 2025 » as in Figma. That is the app's
  date format in both languages (`common.date.year_month_day`), and it types the same in French and
  English. The field also takes `20190308` and normalizes it when you leave the field.
- **Height: Figma's field is 32 px, the DS Input default is 36 px.** The prototype keeps 36 px so
  the date lines up with the inputs beside it. Worth settling in the kit: is the Figma input 32 px
  everywhere (the DS Input's `sm`)?
- **The calendar opens under the field, aligned to its left edge**, not under the button. The DS
  Popover doesn't export Radix's `Anchor`, so the prototype imports it from Radix directly.
- **Week starts on Sunday** in both languages (date-fns `fr-CA` / `en-CA`), as in Figma.
- **Behaviour the real component needs:**
  - Later days are disabled when the field has a latest date (date of birth: today).
  - The year list runs from 1900 to that latest date's year. DDM / DPA list only last year onward.
  - Arrow Down in the field opens the calendar.
  - A typed date that doesn't exist gets « Format attendu : aaaa-mm-jj » once you leave the field.
  - A real date that is too late is still passed to the form, so the form can mark it and say why.

