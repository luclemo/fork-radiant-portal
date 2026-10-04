/**
 * Gestational age — stored as a date, derived as an age. These are CLIN's formulas
 * (`clin-portal-ui`, src/utils/age.ts) so the products agree: an age is only true on the day it is
 * computed, so the date is the value and the age is always a view. Dates are compared as UTC
 * midnights so a DST boundary cannot shift a day. Gate, field and rail all read `gestState`.
 */
import type { GestBasis } from './form-state';

const DAY = 864e5;
const TERM = 280; // 40 weeks, as CLIN uses

function dayNumUTC(str: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null;
}

function todayUTC(): number {
  const n = new Date();
  return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
}

function dayStrUTC(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * The bounds the arithmetic implies — deliberately asymmetric. A last menstrual period is in the
 * past, so today is the ceiling. A due date is usually ahead, but an overdue pregnancy has one
 * behind, so there is no floor; beyond 40 weeks out the age would be negative, hence the ceiling.
 */
export function gestMax(basis: 'lmp' | 'edd'): string {
  return dayStrUTC(basis === 'lmp' ? todayUTC() : todayUTC() + TERM * DAY);
}

/** Today, for the date of birth's ceiling. */
export function todayStr(): string {
  return dayStrUTC(todayUTC());
}

export type GestState =
  | null // nothing picked
  | { basis: 'demise' }
  | { basis: 'lmp' | 'edd'; date: string; weeks?: number; outOfRange?: boolean };

export function gestState(basis: GestBasis | null, lmpDate: string, eddDate: string): GestState {
  if (!basis) return null;
  if (basis === 'demise') return { basis };
  const date = basis === 'lmp' ? lmpDate : eddDate;
  const d = dayNumUTC(date);
  if (d === null) return { basis, date: '' };
  const weeks =
    basis === 'lmp' ? Math.round((todayUTC() - d) / DAY / 7) : Math.round((TERM - (d - todayUTC()) / DAY) / 7);
  // A typed date can still land outside the bounds the picker enforces: no age, never a silent block.
  if (date > gestMax(basis) || weeks < 0) return { basis, date, outOfRange: true };
  return { basis, date, weeks };
}

/** A basis with no date is not an answer, and neither is an impossible one. */
export function gestAnswered(g: GestState): boolean {
  return !!g && (g.basis === 'demise' || (!!g.date && !g.outOfRange));
}
