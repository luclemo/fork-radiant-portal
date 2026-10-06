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
| Segmented control (empty start, clearable) | Sexe (§2, fetal, §5), Consanguinité (§4) | partly covered | — | `ToggleButtonGroup` must start with a value. The DS `ToggleGroup` (shadcn, has a story) can start empty, so §2 uses it: outline, spacing 0, its own colours. Gap: a tooltip can't wrap an item (it takes over the item's selected state), so the tooltip sits on the label inside. Required groups ignore the click that would empty them. Also used for Statut (§5, initials A · NA · I). |
| Tree browser with checkboxes | HPO browser (§3), MONDO browser (§4) | needs design · stand-in built | — | No tree component at all. Stand-ins: `src/stand-ins/hpo-browser.tsx` (DS Dialog + Checkbox, chevron buttons, lazy rows, search with the path to each match) and `mondo-browser.tsx` (flat, single pick), sharing `browser-shell.tsx`. Needs: indent, caret, a node that sits under several parents, a locked row, and a single-pick mode. |
| Pedigree | Rail | designed · stand-in built | [Pedigree component set](https://www.figma.com/design/Y0l9SoMCYlTQZxce3NzZiK/Radiant-ui-kit---shadcn---January-2025?node-id=24830-9173) | Stand-ins: `src/rail/pedigree.tsx` (lines and layout, which are new) and `src/stand-ins/pedigree-proband-symbol.tsx` (the Figma proband symbol, traced from its vectors). Relatives use the code icons (`base/icons/pedigree-*`). See « Pedigree: Figma and code icons » below. |
| Step Count | Section header number (§1–§5) | designed · stand-in built | [Components section](https://www.figma.com/design/G7MHa8tTIkNJF5baAZU4AD/Case-Create?node-id=12035-18322) | 28 px circle, muted fill, 1 px border, mono number 14 px medium. Figma uses Geist Mono, which the app doesn't ship: the stand-in uses `font-mono`. Stand-in: `src/stand-ins/step-count.tsx`. Add to Storybook. |
| Anthology Code | Ids in lists: HP:…, MONDO:… (§3, §4, browsers) | designed · stand-in built | [Components section](https://www.figma.com/design/G7MHa8tTIkNJF5baAZU4AD/Case-Create?node-id=12035-18322) | Mono 12/16, muted text. Stand-in: `src/stand-ins/anthology-code.tsx`, used in §3, §4 and both browsers. Same Geist Mono caveat as Step Count. Add to Storybook. |

## Accordion as section card

The form uses the DS `Accordion` (`base/shadcn/accordion.tsx`) with `type="multiple"`, chevron right,
following Lucas's Figma « Accordion / AccordionItem » ([node](https://www.figma.com/design/G7MHa8tTIkNJF5baAZU4AD/Case-Create?node-id=12046-23513)).
No change to the component. Overrides, all in `SectionCard` (`src/case-creation-page.tsx`):

- Item: `border rounded-lg p-6 shadow-xs`, replacing the DS `border-b`.
- Trigger: `py-0`. The DS adds 8 px, which would make the header 44 px instead of Figma's 28.
- Title: 16/24 semibold, 12 px after the step circle.
- Body: `forceMount`, so a closed section stays mounted (keeps local state). Cost: no close animation.
  Divider 24 px under the header, 24 px above the content, **16 px below it** (as drawn in Figma).
- Not in the DS: a way to open items from outside is just the controlled `value`; nothing to add.

## Changes to existing components

| Component | Gap | Status |
|---|---|---|
| AutoComplete (`base/data-entry/auto-complete.tsx`) | Search ignores accents (« genetique » misses « génétique ») | open |
| AutoComplete | Shows a ✕ even on a required field, which should not be clearable | open |
| AutoComplete | No highlight of the matching text in results | open |
| AutoComplete | Looks like a text input, no chevron. Check in review whether that reads as a select | open |
| Select (`base/shadcn/select.tsx`) | **Edited in this branch:** `SelectTrigger` takes `onClear` (and `clearLabel`) and draws a ✕ before the chevron while a value is picked, matching AutoComplete and MultiSelector. Replaces the « ↺ Effacer la sélection » row the prototype had | edited |
| Button | A disabled button can't say why. Create is styled unavailable but stays clickable to explain what's missing. Is there a DS pattern for this? | open |
| Badge (`base/shadcn/badge.tsx`) | The ✕ of a closable badge has no accessible name (« Retirer — <terme> ») and passes `onClose` on to the `<div>` too | open |
| AutoComplete | Ignores a value cleared from outside: it keeps showing the old pick. The prototype remounts it when the analysis clears the indication | open |
| AutoComplete, MultiSelector (cmdk) | Two on one page fight over focus. When one changes its text or selection while the cursor is in another, cmdk moves the cursor into it. The prototype holds the indication back until focus leaves the analysis field | open |
| MultiSelector | Its menu doesn't follow a change of language when given only `defaultOptions`; passing `options` too fixes it. Chips follow option order, not pick order | open |
| AutoComplete (`base/data-entry/auto-complete.tsx`) | **Edited in this branch, for the FE team to review:** new `size` (same scale as Input and Select), `clearable` (default true) and `chevron` props. The mock draws every select with a chevron on the right; every select clears with a ✕ before it. Open: the picked value is plain text inside the input, so a code in it (« Cancer (MONDO:0004992) ») cannot use the Anthology Code component | edited |
| MultiSelector (`base/data-entry/multi-selector`) | **Edited in this branch:** new `size` (`default` / `sm`) and `chevron` props, same reason | edited |
| Accordion (`base/shadcn/accordion.tsx`) | The body is `overflow: hidden` for its open/close animation, which clips focus rings and any dropdown that opens past the section. The prototype turns the animation and the clipping off from the outside (`SectionCard`). A DS-level answer is needed: dropdowns inside an accordion are the normal case in a form | open |
| FieldSeparator (`base/shadcn/field.tsx`) | Label is always centred, and the root carries `-my-2` for its own FieldGroup. The mock's separator has its label on the left. Stand-in: `src/stand-ins/group-separator.tsx` | open |
| Select vs AutoComplete / Input | A Select's placeholder is drawn in the foreground colour (`data-placeholder:text-foreground`), the others' in muted. The mock reproduces it. Decide which is right | open |
| Table | The mock's table has a 32 px header and 40 px rows with no vertical rules. Reached with class overrides (`[&>thead>tr>th]:h-8`, `variant="ghost"` on heads); a `size="sm"` / `dense` table variant would do it cleanly | open |
| Search match highlight | No shared component. The prototype bolds the match (`src/stand-ins/highlight.tsx`), accent-insensitive, like the backend's `<strong>` | open |

## Pedigree: Figma and code icons

The Figma `Pedigree` set is ahead of the icons in code. For the FE team, to bring them level:

- **Proband variants are missing in code** (Figma: Proband=True, 6 variants: male / female / unspecified × affected / unaffected). The arrow is part of the symbol, with a white halo where it crosses the shape. The proband icon in code is an outline with an arrow, which matches neither Figma variant. The prototype traces the three *affected* ones (the proband is always affected there); the unaffected three are not used.
- **Not in Figma either, and the form needs them:**
  - Affected status « unknown »: the set has only Affected / Unaffected (plus Carrier). The prototype draws « ? » on the unaffected symbol.
  - Proband that is deceased (fetal demise): Deceased exists only for non-proband, unaffected symbols. The prototype draws a slash over the affected proband, in the background colour, so it shows only on the filled shape.
- **Not used by the form:** Carrier (dot inside the symbol).
- **Figma draws the deceased slash inside the symbol**, standard notation draws it past the edge. Decide which one the kit means.
- **Lines and layout** (parents, siblings, children, consanguineous double line) are not in the kit. The prototype's layout is in `src/rail/pedigree.tsx`.

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
- **Height: 32 px** (the DS Input's `sm`), settled by the 2026-10-06 mock: every form control is 32.
- **The calendar opens under the field, aligned to its left edge**, not under the button. The DS
  Popover doesn't export Radix's `Anchor`, so the prototype imports it from Radix directly.
- **Week starts on Sunday** in both languages (date-fns `fr-CA` / `en-CA`), as in Figma.
- **Behaviour the real component needs:**
  - Later days are disabled when the field has a latest date (date of birth: today).
  - The year list runs from 1900 to that latest date's year. DDM / DPA list only last year onward.
  - Arrow Down in the field opens the calendar.
  - A typed date that doesn't exist gets « Format attendu : aaaa-mm-jj » once you leave the field.
  - A real date that is too late is still passed to the form, so the form can mark it and say why.

