import type { ReactNode } from 'react';
import { SearchIcon } from 'lucide-react';

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/base/shadcn/dialog';
import { Input } from '@/components/base/shadcn/input';

type Props = {
  open: boolean;
  onCancel: () => void;
  title: string;
  description: string;
  query: string;
  onQuery: (q: string) => void;
  placeholder: string;
  hint?: string;
  /** The rows. */
  children: ReactNode;
  /** Footer content: what sits left of the buttons, then the buttons. */
  footer: ReactNode;
};

/**
 * STAND-IN chrome shared by the HPO and MONDO browsers (COMPONENT-TODO: tree browser), so the two
 * read as one component: DS Dialog, a subtitle saying what the browser does, a search, a fixed-
 * height list, a footer. Esc, ✕ and the backdrop cancel.
 */
function BrowserShell({
  open,
  onCancel,
  title,
  description,
  query,
  onQuery,
  placeholder,
  hint,
  children,
  footer,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={o => !o && onCancel()}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex flex-col gap-1.5">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-2 pb-2">
          <Input
            autoFocus
            startIcon={SearchIcon}
            value={query}
            onChange={e => onQuery(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
          />
          {hint && <p className="text-muted-foreground text-xs italic">{hint}</p>}
          <div className="border-border h-[52vh] overflow-auto rounded-md border p-1.5">{children}</div>
        </DialogBody>
        <DialogFooter className="items-center">{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BrowserShell;
