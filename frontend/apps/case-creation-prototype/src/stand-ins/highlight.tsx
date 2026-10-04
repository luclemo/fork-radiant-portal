import { fold } from '../mock/hpo';

/**
 * Marks the run a search matched, in bold — as the app's own term autocomplete does (the backend
 * wraps the match in <strong>). The query is already folded (accents and case dropped), so the
 * text is folded one character at a time, keeping a map back to the original positions — « gén »
 * highlights in « Génétique » when the user typed « gen ».
 */
function Highlight({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>;
  let folded = '';
  const origin: number[] = [];
  [...text].forEach((ch, i) => {
    for (const f of fold(ch)) {
      folded += f;
      origin.push(i);
    }
  });
  const at = folded.indexOf(query);
  if (at < 0) return <>{text}</>;
  const chars = [...text];
  const start = origin[at];
  const end = origin[at + query.length - 1] + 1;
  return (
    <>
      {chars.slice(0, start).join('')}
      <strong className="font-semibold">{chars.slice(start, end).join('')}</strong>
      {chars.slice(end).join('')}
    </>
  );
}

export default Highlight;
