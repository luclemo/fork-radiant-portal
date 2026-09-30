# Design prototype — not for merge

This branch (`design/case-creation-hifi`) holds a **high-fidelity design prototype** of Radiant's
case-creation form. It is a design artifact, built with the real design system so the design stays
true to what exists. **The FE team will not ship this code, and it will never merge.**

- Review it for spacing, flow and copy, not for code quality, naming or test coverage.
- Everything lives in `frontend/apps/case-creation-prototype/`, plus one story in
  `frontend/components/stories/case-creation/`. No shared or production file is changed.
- The behaviour spec is `frontend/apps/case-creation-prototype/DESIGN-NOTES.md`.
- Missing design-system components are tracked in
  `frontend/apps/case-creation-prototype/COMPONENT-TODO.md`.

If a PR is opened for a review round, its title starts with `[DESIGN PROTOTYPE — DO NOT MERGE]`, and
it is closed after the round.
