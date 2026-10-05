import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/base/shadcn/button';
import { Checkbox } from '@/components/base/shadcn/checkbox';
import { cn } from '@/components/lib/utils';

import { useCaseCreationT } from '../i18n';
import { byLabel, fold, HPO_BY_ID, HPO_LIST, type Lang, termLabel, TREE_ROOT } from '../mock/hpo';

import BrowserShell from './browser-shell';
import Highlight from './highlight';

export type BrowserTarget = 'observed' | 'notObserved';

type Props = {
  /** Which list the browser fills; null = closed. */
  target: BrowserTarget | null;
  lang: Lang;
  /** That list's terms: they open ticked. */
  picked: string[];
  /** The other list's terms: shown, but can't be ticked — a term is never both. */
  locked: string[];
  onApply: (picked: string[]) => void;
  onCancel: () => void;
};

const SEARCH_MIN = 3;
const SEARCH_CAP = 300;
const MAX_DEPTH = 25;

/**
 * STAND-IN for a tree browser with checkboxes (COMPONENT-TODO: needs design). The whole HPO
 * ontology, as a DAG: a term can sit under several parents, and its tick stays in sync wherever it
 * appears. Lazy: only expanded branches render. A search of 3+ characters shows each match with
 * the path down to it, all open. Ticks are a draft until « Appliquer »; Esc, ✕ and the backdrop
 * discard them.
 */
function HpoBrowser({ target, lang, picked, locked, onApply, onCancel }: Props) {
  const { t } = useCaseCreationT();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  // Every opening starts from the list as it stands, folded and unsearched.
  useEffect(() => {
    if (!target) return;
    setSel(new Set(picked));
    setOpen(new Set());
    setQuery('');
  }, [target]);

  const sort = byLabel(lang);
  const rootKids = useMemo(() => [...(HPO_BY_ID[TREE_ROOT]?.kids ?? [])].sort(sort), [lang]);

  // Search: the matches, plus every ancestor so each match keeps its path.
  const q = fold(query.trim());
  const search = useMemo(() => {
    if (q.length < SEARCH_MIN) return null;
    const matched = new Set<string>();
    for (const term of HPO_LIST) {
      if (term.hay[lang].includes(q)) matched.add(term.id);
      if (matched.size > SEARCH_CAP) return { tooMany: true as const };
    }
    const inTree = new Set(matched);
    const stack = [...matched];
    while (stack.length) {
      for (const p of HPO_BY_ID[stack.pop()!]?.parents ?? []) {
        if (!inTree.has(p)) {
          inTree.add(p);
          stack.push(p);
        }
      }
    }
    return { matched, inTree };
  }, [q, lang]);

  let hint = '';
  if (search && 'tooMany' in search) hint = t('hpo_browser.too_many');
  else if (search && !search.matched.size) hint = t('hpo_browser.no_results');
  else if (q.length > 0 && q.length < SEARCH_MIN) hint = t('hpo_browser.search_min');
  const searching = !!search && !('tooMany' in search) && search.matched.size > 0;

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  const rows: ReactNode[] = [];
  const walk = (id: string, depth: number, path: string) => {
    const term = HPO_BY_ID[id];
    if (!term || depth > MAX_DEPTH) return;
    if (searching && !search.inTree.has(id)) return;
    const kids = searching ? term.kids.filter(k => search.inTree.has(k)) : term.kids;
    const expanded = searching || open.has(id);
    const isLocked = locked.includes(id);
    const key = `${path}/${id}`;
    rows.push(
      <div
        key={key}
        className={cn('hover:bg-accent/60 flex items-start gap-1 rounded-md py-0.5 pr-2', isLocked && 'opacity-45')}
        style={{ paddingLeft: depth * 16 }}
        title={isLocked ? t('hpo_browser.in_other_list') : undefined}
      >
        {kids.length > 0 && !searching ? (
          <Button
            variant="ghost"
            size="2xs"
            iconOnly
            className="text-muted-foreground shrink-0"
            aria-label={t(expanded ? 'hpo_browser.collapse' : 'hpo_browser.expand')}
            aria-expanded={expanded}
            onClick={() => setOpen(o => toggle(o, id))}
          >
            {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </Button>
        ) : (
          // Leaves, and every row while searching (all open), keep the caret's width.
          <span className="size-6 shrink-0" />
        )}
        <label className={cn('flex min-w-0 flex-1 items-start gap-2 py-0.5', !isLocked && 'cursor-pointer')}>
          <Checkbox
            className="mt-0.5"
            checked={sel.has(id)}
            disabled={isLocked}
            onCheckedChange={() => setSel(s => toggle(s, id))}
          />
          <span className="min-w-0 flex-1 text-sm">
            <span className="mr-1.5">
              <Highlight text={termLabel(id, lang)} query={searching ? q : undefined} />
            </span>
            <span className="text-muted-foreground font-mono text-xs">{id}</span>
          </span>
        </label>
      </div>,
    );
    if (expanded) [...kids].sort(sort).forEach(k => walk(k, depth + 1, key));
  };
  if (!(search && 'tooMany' in search) && !(search && !search.matched.size)) {
    rootKids.forEach(id => walk(id, 0, ''));
  }

  return (
    <BrowserShell
      open={!!target}
      onCancel={onCancel}
      title={t('hpo_browser.title')}
      description={t(target === 'notObserved' ? 'hpo_browser.target_not_observed' : 'hpo_browser.target_observed')}
      query={query}
      onQuery={setQuery}
      placeholder={t('signs.search_placeholder')}
      hint={hint}
      footer={
        <>
          <span className="text-muted-foreground mr-auto text-xs">
            {t('hpo_browser.selected', { count: sel.size })}
          </span>
          <Button variant="outline" onClick={onCancel}>
            {t('hpo_browser.cancel')}
          </Button>
          <Button onClick={() => onApply([...sel])}>{t('hpo_browser.apply')}</Button>
        </>
      }
    >
      {rows}
    </BrowserShell>
  );
}

export default HpoBrowser;
