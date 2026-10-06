import type { ReactNode } from 'react';

import { cn } from '@/components/lib/utils';

/**
 * STAND-IN — not a design-system component. Lucas's « Anthology Code » (Case Create Figma, node
 * 12035:17646): an ontology id (HP:…, MONDO:…) set in mono, 12/16, muted, so it reads as a code next
 * to the term's name. Figma sets it in Geist Mono; the app doesn't ship that font, so this falls
 * back to the theme's `font-mono` (COMPONENT-TODO.md › Anthology Code).
 */
function AnthologyCode({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('text-muted-foreground font-mono text-xs leading-4', className)}>{children}</span>;
}

export default AnthologyCode;
