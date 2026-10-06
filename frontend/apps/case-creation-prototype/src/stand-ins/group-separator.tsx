import type { ReactNode } from 'react';

import { FieldSeparator } from '@/components/base/shadcn/field';

/**
 * Figma « Field / Separator » as the content pass uses it (Case Create, §3): a hairline with its
 * label sitting on the left, inset 8 px, and the same line, bare, to close a group. The DS
 * FieldSeparator centres its label and carries `-my-2` for its own FieldGroup gap, so both are
 * overridden here — a left-aligned variant is logged in COMPONENT-TODO.md. Bare, it is the DS's own
 * 4 px net height; labelled, it takes its full 20 px.
 */
function GroupSeparator({ children }: { children?: ReactNode }) {
  return <FieldSeparator className={children ? 'my-0 [&>span]:mx-0' : undefined}>{children}</FieldSeparator>;
}

export default GroupSeparator;
