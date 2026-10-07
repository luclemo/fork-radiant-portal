import { useRef, useState } from 'react';
import { BookOpenTextIcon, PlusIcon, SearchIcon, XIcon } from 'lucide-react';

import { Badge } from '@/components/base/shadcn/badge';
import { Button } from '@/components/base/shadcn/button';
import { Checkbox } from '@/components/base/shadcn/checkbox';
import { Field, FieldLabel } from '@/components/base/shadcn/field';
import { Input } from '@/components/base/shadcn/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/base/shadcn/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/base/shadcn/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/base/shadcn/tooltip';
import { cn } from '@/components/lib/utils';

import { applyBrowser, type FormState, removeNotObserved, setOnset, toggleObserved } from '../form-state';
import { useCaseCreationT } from '../i18n';
import { byLabel, fold, HPO_LIST, type Lang, type OnsetCode, ONSETS, suggestionsFor, termLabel } from '../mock/hpo';
import Required from '../required';
import AnthologyCode from '../stand-ins/anthology-code';
import GroupSeparator from '../stand-ins/group-separator';
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
 * A term that is not picked yet — a suggestion or a search result. Ticking it sends it up into the
 * observed table, so a picked term never appears twice. A long name wraps, the code trailing its
 * last line.
 */
function TermRow({
  id,
  lang,
  state,
  update,
  query,
  onPicked,
}: Props & { id: string; lang: Lang; query?: string; onPicked?: () => void }) {
  const { t } = useCaseCreationT();
  // A term is observed or not observed, never both.
  const inOther = state.notObserved.includes(id);

  return (
    <label
      className={cn(
        'hover:bg-accent/60 flex items-start gap-2 rounded-md px-2 py-1.5',
        inOther ? 'opacity-45' : 'cursor-pointer',
      )}
      title={inOther ? t('hpo_browser.in_other_list') : undefined}
    >
      <Checkbox
        size="sm"
        className="mt-0.5"
        checked={false}
        disabled={inOther}
        onCheckedChange={() => {
          update(s => toggleObserved(s, id));
          onPicked?.();
        }}
      />
      <span className="min-w-0 flex-1 text-sm leading-5 font-medium">
        <Highlight text={termLabel(id, lang)} query={query} />
        <AnthologyCode className="ml-1.5 font-normal">
          <Highlight text={id} query={query} />
        </AnthologyCode>
      </span>
    </label>
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
    // Blocks 24 px apart; inside a block, 8 px under its separator (Figma « Fieldset »).
    <div className="flex flex-col gap-6">
      {/* The ask is the field's label and carries the requirement. The two ways in sit under it
          and stay put; what is picked follows. */}
      <Field>
        <FieldLabel>
          {t('signs.instruction')} <Required />
        </FieldLabel>
        <div className="flex gap-4">
          <div className="relative min-w-0 flex-1">
            <Input
              ref={searchRef}
              size="sm"
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
                size="2xs"
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
          <Button variant="outline" size="sm" className="w-56 shrink-0" onClick={() => setBrowser('observed')}>
            <BookOpenTextIcon />
            {t('signs.browse')}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {results.map(id => (
              <TermRow
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
        {hint && <p className="text-muted-foreground text-xs italic">{hint}</p>}
      </Field>

      {/* What is observed, as a table: the onset is a column, and a term leaves with its ✕. Nothing
          here until a term is picked. */}
      {observedIds.length > 0 && (
        <Table className="[&>thead>tr>th]:h-8 [&>tbody>tr>td]:h-10 [&>tbody>tr>td]:py-0">
          <TableHeader>
            <TableRow>
              <TableHead variant="ghost" className="text-xs">
                {t('signs.observed')} ({observedIds.length})
              </TableHead>
              <TableHead variant="ghost" className="w-[174px] text-xs">
                {t('signs.onset')}
              </TableHead>
              <TableHead variant="ghost" className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {observedIds.map(id => {
              const name = termLabel(id, lang);
              const picked = state.observed.find(o => o.id === id);
              return (
                <TableRow key={id}>
                  <TableCell>
                    {/* The name ellipsizes so the menu keeps its place; the full term is in the tooltip. */}
                    <div className="flex items-center gap-1.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate font-medium">{name}</span>
                        </TooltipTrigger>
                        <TooltipContent>{name}</TooltipContent>
                      </Tooltip>
                      <AnthologyCode className="shrink-0">{id}</AnthologyCode>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={picked?.onset} onValueChange={v => update(s => setOnset(s, id, v as OnsetCode))}>
                      <SelectTrigger size="xxs" className="w-35" aria-label={`${t('signs.onset')} — ${name}`}>
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
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="2xs"
                      iconOnly
                      aria-label={`${t('signs.remove')} — ${name}`}
                      onClick={() => update(s => toggleObserved(s, id))}
                    >
                      <XIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          <GroupSeparator>{t('signs.suggestions')}</GroupSeparator>
          <div className="flex flex-col gap-0.5">
            {shownSuggestions.map(id => (
              <TermRow key={id} id={id} lang={lang} state={state} update={update} />
            ))}
          </div>
          {suggestions.length > SUGGESTIONS_SHOWN && (
            <Button variant="link" size="xs" className="mt-1 self-start px-2" onClick={() => setExpanded(e => !e)}>
              {expanded
                ? t('signs.show_less')
                : t('signs.show_more', { count: suggestions.length - SUGGESTIONS_SHOWN })}
            </Button>
          )}
        </div>
      )}

      {/* The not-observed half is a short aside, not the list you work through: no checkbox, no
          inline search. Picks are badges — not struck through, the heading already says they were
          looked for and absent — and are dropped one at a time. With none picked, the group is just
          its closing line and the button. */}
      <div className="flex flex-col gap-1.5">
        <GroupSeparator>
          {notObserved.length > 0 && `${t('signs.not_observed')} (${notObserved.length})`}
        </GroupSeparator>
        {notObserved.length > 0 && (
          <div className="flex flex-wrap gap-1.5 py-2">
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
        )}
        <Button variant="link" size="xs" className="self-start px-2" onClick={() => setBrowser('notObserved')}>
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
