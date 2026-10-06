import { useEffect, useState } from 'react';
import { CheckIcon } from 'lucide-react';

import { Button } from '@/components/base/shadcn/button';
import { cn } from '@/components/lib/utils';

import { useCaseCreationT } from '../i18n';
import { fold, type Lang } from '../mock/hpo';
import { conditionLabel, conditionsSorted, UNDIAGNOSED } from '../mock/mondo';

import AnthologyCode from './anthology-code';
import BrowserShell from './browser-shell';
import Highlight from './highlight';

type Props = {
  open: boolean;
  lang: Lang;
  /** The current indication: shown with a check. */
  value: string;
  onPick: (id: string) => void;
  onCancel: () => void;
};

/**
 * STAND-IN, and a shell (DESIGN-NOTES: the MONDO browser is a shell). With no MONDO hierarchy on
 * disk it lists the catalog's conditions flat, and says so on screen. Same chrome as the HPO
 * browser, so a real MONDO subtree can drop in later. One indication, so a click picks it and
 * closes — no draft, no « Appliquer ».
 */
function MondoBrowser({ open, lang, value, onPick, onCancel }: Props) {
  const { t } = useCaseCreationT();
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const q = fold(query.trim());
  const shown = conditionsSorted(lang).filter(c => !q || fold(`${c[lang]} ${c.id}`).includes(q));

  return (
    <BrowserShell
      open={open}
      onCancel={onCancel}
      title={t('mondo_browser.title')}
      description={t('mondo_browser.shell_note')}
      query={query}
      onQuery={setQuery}
      placeholder={t('other.condition_placeholder')}
      hint={shown.length ? undefined : t('mondo_browser.no_results')}
      footer={
        <Button variant="outline" onClick={onCancel}>
          {t('hpo_browser.cancel')}
        </Button>
      }
    >
      {shown.map(c => (
        <button
          key={c.id}
          type="button"
          // Same row geometry as the HPO tree: a leaf keeps the caret's width.
          className={cn(
            'hover:bg-accent/60 flex w-full items-start gap-1 rounded-md py-0.5 pr-2 text-left',
            c.id === value && 'bg-accent',
          )}
          onClick={() => onPick(c.id)}
        >
          <span className="size-6 shrink-0" />
          <span className="min-w-0 flex-1 py-0.5 text-sm">
            <span className="mr-1.5">
              <Highlight text={conditionLabel(c.id, lang)} query={q || undefined} />
            </span>
            {c.id !== UNDIAGNOSED && (
              <AnthologyCode>
                <Highlight text={c.id} query={q || undefined} />
              </AnthologyCode>
            )}
          </span>
          {c.id === value && <CheckIcon className="mt-1 size-4 shrink-0" aria-label={t('mondo_browser.current')} />}
        </button>
      ))}
    </BrowserShell>
  );
}

export default MondoBrowser;
