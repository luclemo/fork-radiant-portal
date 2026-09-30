import type { Meta, StoryObj } from '@storybook/react-vite';

import CaseCreationPage from '@/apps/case-creation-prototype/src/case-creation-page';

/**
 * DESIGN PROTOTYPE — not for merge. The case-creation form on mock data.
 * Spec: frontend/apps/case-creation-prototype/DESIGN-NOTES.md
 */
const meta = {
  title: 'Prototypes/Case Creation',
  component: CaseCreationPage,
  parameters: {
    layout: 'fullscreen',
  },
  // French is the form's default language, but a story-level `globals` would lock the toolbar's
  // language switch. Shared links carry `&globals=locale:fr` instead.
} satisfies Meta<typeof CaseCreationPage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Empty form, postnatal, French. */
export const Default: Story = {};
