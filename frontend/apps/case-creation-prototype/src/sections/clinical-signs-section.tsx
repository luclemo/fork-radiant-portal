import { useRef, useState } from 'react';
import { ListTreeIcon, PlusIcon, SearchIcon, XIcon } from 'lucide-react';

import { Badge } from '@/components/base/shadcn/badge';
import { Button } from '@/components/base/shadcn/button';
import { Checkbox } from '@/components/base/shadcn/checkbox';
import { Input } from '@/components/base/shadcn/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/base/shadcn/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/base/shadcn/tooltip';
import { cn } from '@/components/lib/utils';

import { applyBrowser, type FormState, removeNotObserved, setOnset, toggleObserved } from '../form-state';
import { useCaseCreationT } from '../i18n';
import { byLabel, fold, HPO_LIST, type Lang, type OnsetCode, ONSETS, suggestionsFor, termLabel } from '../mock/hpo';
import Required from '../required';
import Highlight from '../stand-ins/highlight';
import HpoBrowser, { type BrowserTarget } from '../stand-ins/hpo-browser';

type Props = {
  state: FormState;
  update: (fn: (s: FormState) => FormState) => void;
};

const SEARCH_MIN = 2;
const SEARCH_CAP = 10;
const SUGGESTIONS_SHOWN = 5;

/**
 * The one way an observed phenotype is drawn — picked, suggested or found. Selection is the row's
 * own tick: no ✓/✗ marker, no row ✕. Ticked, it shows its onset menu, and the name ellipsizes so
 * the menu keeps its place (full term in the tooltip); unticked, a long name wraps.
 */
function PhenotypeRow({
  id,
  lang,
  state,
  update,
  query,
  onPicked,
}: Props & { id: string; lang: Lang; query?: string; onPicked?: () => void }) {
  const { t } = useCaseCreationT();
  const picked = state.observed.find(o => o.id === id);
  // A term is observed or not observed, never both.
  const inOther = state.notObserved.includes(id);
  const name = termLabel(id, lang);

  return (
    <div
      className={cn('hover:bg-accent/60 flex items-center gap-3 rounded-md px-2 py-1.5', inOther && 'opacity-45')}
      title={inOther ? t('hpo_browser.in_other_list') : undefined}
    >
      <label className={cn('flex min-w-0 flex-1 items-start gap-2.5', !inOther && 'cursor-pointer')}>
        <Checkbox
          className="mt-0.5"
          checked={!!picked}
          disabled={inOther}
          onCheckedChange={() => {
            update(s => toggleObserved(s, id));
            onPicked?.();
          }}
        />
        {picked ? (
          <span className="flex min-w-0 flex-1 items-baseline gap-1.5 text-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate">{name}</span>
              </TooltipTrigger>
              <TooltipContent>{name}</TooltipContent>
            </Tooltip>
            <span className="text-muted-foreground shrink-0 font-mono text-xs">{id}</span>
          </span>
        ) : (
          // Name and id flow as one text, so the id trails the last line of a wrapped name.
          <span className="min-w-0 flex-1 text-sm">
            <span className="mr-1.5">
              <Highlight text={name} query={query} />
            </span>
            <span className="text-muted-foreground font-mono text-xs">
              <Highlight text={id} query={query} />
            </span>
          </span>
        )}
      </label>
      {picked && (
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-muted-foreground text-xs">{t('signs.onset')}</span>
          <Select value={picked.onset} onValueChange={v => update(s => setOnset(s, id, v as OnsetCode))}>
            <SelectTrigger size="xs" className="w-44 text-xs" aria-label={`${t('signs.onset')} — ${name}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ONSETS.map(o => (
                <SelectItem key={o.code} value={o.code}>
                  {t(`signs.onsets.${o.key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function SubHeading({ label, count }: { label: string; count?: number }) {
  return (
    <h4 className="mt-4 mb-1.5 text-sm font-medium">
      {label}
      {count !== undefined && <span className="text-muted-foreground ml-1 font-normal">({count})</span>}
    </h4>
  );
}

function ClinicalSignsSection({ state, update }: Props) {
  const { t, i18n } = useCaseCreationT();
  const lang: Lang = i18n.language.startsWith('fr') ? 'fr' : 'en';
  const sort = byLabel(lang);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [browser, setBrowser] = useState<BrowserTarget | null>(null);

  const observedIds = state.observed.map(o => o.id).sort(sort);
  // A picked suggestion rises into the list above, so it is no longer offered here.
  const offered = suggestionsFor(state.analysisCode);
  const suggestions = offered.filter(id => !observedIds.includes(id)).sort(sort);
  const shownSuggestions = expanded ? suggestions : suggestions.slice(0, SUGGESTIONS_SHOWN);

  // The search looks at the displayed language only (the HP id matches in both), and offers only
  // what isn't on screen already: nothing picked, nothing in the suggestions.
  const q = fold(query.trim());
  let results: string[] = [];
  let hint = '';
  if (q.length >= SEARCH_MIN) {
    for (const term of HPO_LIST) {
      if (observedIds.includes(term.id) || offered.includes(term.id)) continue;
      if (term.hay[lang].includes(q)) results.push(term.id);
      if (results.length > SEARCH_CAP) break; // one past the cap = there are more
    }
    if (!results.length) hint = t('signs.no_results');
    else if (results.length > SEARCH_CAP) hint = t('signs.more_results', { count: SEARCH_CAP });
    results = results.slice(0, SEARCH_CAP);
  } else if (q.length > 0) hint = t('signs.search_min');

  const notObserved = [...state.notObserved].sort(sort);

  return (
    <div>
      {/* No sub-title: the ask says it better, and carries the requirement. */}
      <p className="mb-3 text-sm font-medium">
        {t('signs.instruction')} <Required />
      </p>

      {/* The two ways in sit directly under the ask and stay put; what is picked follows. */}
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            ref={searchRef}
            startIcon={SearchIcon}
            className="pr-8"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setQuery('')}
            placeholder={t('signs.search_placeholder')}
            aria-label={t('signs.search_placeholder')}
          />
          {query && (
            <Button
              variant="ghost"
              size="xs"
              iconOnly
              className="text-muted-foreground absolute top-1/2 right-1 -translate-y-1/2"
              aria-label={t('signs.clear_search')}
              title={t('signs.clear_search')}
              onClick={() => {
                setQuery('');
                searchRef.current?.focus();
              }}
            >
              <XIcon />
            </Button>
          )}
        </div>
        <Button variant="outline" onClick={() => setBrowser('observed')}>
          <ListTreeIcon />
          {t('signs.browse')}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="mt-1.5 flex flex-col gap-0.5">
          {results.map(id => (
            <PhenotypeRow
              key={id}
              id={id}
              lang={lang}
              state={state}
              update={update}
              query={q}
              // Picking from the search answers it: empty the box, ready for the next sign.
              onPicked={() => {
                setQuery('');
                searchRef.current?.focus();
              }}
            />
          ))}
        </div>
      )}
      {hint && <p className="text-muted-foreground mt-1.5 text-xs italic">{hint}</p>}

      {observedIds.length > 0 && (
        <>
          <SubHeading label={t('signs.observed')} count={observedIds.length} />
          <div className="flex flex-col gap-0.5">
            {observedIds.map(id => (
              <PhenotypeRow key={id} id={id} lang={lang} state={state} update={update} />
            ))}
          </div>
        </>
      )}

      {suggestions.length > 0 && (
        <>
          <SubHeading label={t('signs.suggestions')} />
          <div className="flex flex-col gap-0.5">
            {shownSuggestions.map(id => (
              <PhenotypeRow key={id} id={id} lang={lang} state={state} update={update} />
            ))}
          </div>
          {suggestions.length > SUGGESTIONS_SHOWN && (
            <Button variant="link" size="xs" className="mt-1 px-2" onClick={() => setExpanded(e => !e)}>
              {expanded
                ? t('signs.show_less')
                : t('signs.show_more', { count: suggestions.length - SUGGESTIONS_SHOWN })}
            </Button>
          )}
        </>
      )}

      {/* The not-observed half is a short aside, not the list you work through: no checkbox, no
          inline search. Picks are badges — not struck through, the heading already says they were
          looked for and absent — and are dropped one at a time. */}
      <div className="border-border mt-4 border-t pt-4">
        {notObserved.length > 0 && (
          <>
            <h4 className="mb-1.5 text-sm font-medium">
              {t('signs.not_observed')}
              <span className="text-muted-foreground ml-1 font-normal">({notObserved.length})</span>
            </h4>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {notObserved.map(id => (
                <Badge
                  key={id}
                  // Neutral, not red: in this app red is pathogenic / oncogenic.
                  variant="neutral"
                  className="max-w-full"
                  title={`${termLabel(id, lang)} · ${id}`}
                  onClose={() => update(s => removeNotObserved(s, id))}
                >
                  <span className="truncate">{termLabel(id, lang)}</span>
                </Badge>
              ))}
            </div>
          </>
        )}
        <Button variant="link" size="xs" className="px-0" onClick={() => setBrowser('notObserved')}>
          <PlusIcon />
          {t('signs.add_not_observed')}
        </Button>
      </div>

      <HpoBrowser
        target={browser}
        lang={lang}
        picked={browser === 'notObserved' ? state.notObserved : state.observed.map(o => o.id)}
        // Can't be both: what is in the other list is shown but can't be ticked.
        locked={browser === 'notObserved' ? state.observed.map(o => o.id) : state.notObserved}
        onCancel={() => setBrowser(null)}
        onApply={picked => {
          if (browser) update(s => applyBrowser(s, browser, picked));
          setBrowser(null);
        }}
      />
    </div>
  );
}

export default ClinicalSignsSection;
