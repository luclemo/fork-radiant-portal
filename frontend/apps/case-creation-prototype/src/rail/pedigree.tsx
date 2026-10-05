import type { ComponentType } from 'react';

import PedigreeFemaleAffectedIcon from '@/components/base/icons/pedigree-female-affected-icon';
import PedigreeFemaleNotAffectedIcon from '@/components/base/icons/pedigree-female-not-affected-icon';
import PedigreeMaleAffectedIcon from '@/components/base/icons/pedigree-male-affected-icon';
import PedigreeMaleNotAffectedIcon from '@/components/base/icons/pedigree-male-not-affected-icon';
import PedigreeUnknownAffectedIcon from '@/components/base/icons/pedigree-unknown-affected-icon';
import PedigreeUnknownNotAffectedIcon from '@/components/base/icons/pedigree-unknown-not-affected-icon';
import type { IconType } from '@/components/base/icons/types';

import type { AffectedCode, FamilyMember, RelationCode } from '../form-state';
import { useCaseCreationT } from '../i18n';
import type { SexCode } from '../mock/patients';
import PedigreeProbandSymbol from '../stand-ins/pedigree-proband-symbol';

/**
 * Standard notation, drawn from the design system's pedigree symbols: ■ male · ● female · ◆ unknown
 * sex · filled = affected · « ? » = status unknown · arrow = proband · slash = deceased. The symbols
 * exist as icons; the lines and the layout are new (COMPONENT-TODO).
 *
 * It draws the FAMILY, not the sequencing batch: every card with a relation, in the analysis or not.
 * There is no sequenced ring in the notation. Half-siblings and « Autre » can't be auto-placed, so
 * they are listed under the drawing instead.
 */
const ICONS: Record<SexCode, Record<'affected' | 'not_affected', ComponentType<IconType>>> = {
  M: { affected: PedigreeMaleAffectedIcon, not_affected: PedigreeMaleNotAffectedIcon },
  F: { affected: PedigreeFemaleAffectedIcon, not_affected: PedigreeFemaleNotAffectedIcon },
  U: { affected: PedigreeUnknownAffectedIcon, not_affected: PedigreeUnknownNotAffectedIcon },
};

type Node = {
  sex: SexCode;
  status: AffectedCode;
  relation?: RelationCode;
  proband?: boolean;
  deceased?: boolean;
  /** The unnamed partner drawn when there are children: dimmed, no label. */
  partner?: boolean;
  x: number;
  y: number;
};

type Props = {
  members: FamilyMember[];
  /** Fetal sex in a prenatal case — §2's Sexe is then the mother's, and reading it drew her twice. */
  probandSex: SexCode;
  /** Only prenatal records a death (« Fœtus décédé »); standard notation slashes a stillbirth. */
  probandDeceased: boolean;
  consanguinity: boolean;
};

const H = 15; // half a symbol
const ICON = 36; // the DS icons draw a 20/24 shape, so 36 px gives a 30 px symbol
const GX = 62; // horizontal step
const PAD = 26;
const LBL = 16;

function Pedigree({ members, probandSex, probandDeceased, consanguinity }: Props) {
  const { t } = useCaseCreationT();

  const parents: Node[] = [];
  const sibs: Node[] = [];
  const kids: Node[] = [];
  const other: Node[] = [];
  for (const m of members) {
    if (!m.relation) continue;
    const node: Node = { relation: m.relation, sex: m.sex || 'U', status: m.status, x: 0, y: 0 };
    if (m.relation === 'mother' || m.relation === 'father') parents.push(node);
    else if (m.relation === 'sister' || m.relation === 'brother') sibs.push(node);
    else if (m.relation === 'daughter' || m.relation === 'son') kids.push(node);
    else other.push(node);
  }
  if (parents.length + sibs.length + kids.length === 0) return null;

  // The proband is hardcoded affected: the case exists because of them.
  const proband: Node = {
    relation: undefined,
    sex: probandSex,
    status: 'affected',
    proband: true,
    deceased: probandDeceased,
    x: 0,
    y: 0,
  };

  const hasParents = parents.length > 0;
  const hasKids = kids.length > 0;
  const yTop = 40;
  const yMid = hasParents ? 118 : 40;
  const yBot = yMid + 86;

  const midRow = [...sibs, proband];
  const partner: Node | null = hasKids ? { sex: 'U', status: 'unknown', partner: true, x: 0, y: 0 } : null;
  if (partner) midRow.push(partner);
  midRow.forEach((n, i) => {
    n.x = PAD + H + i * GX;
    n.y = yMid;
  });

  const sibGroup = [...sibs, proband];
  const sibMinX = sibGroup[0].x;
  const sibMaxX = sibGroup[sibGroup.length - 1].x;
  const sibMidX = (sibMinX + sibMaxX) / 2;
  const sibLineY = yMid - 24;

  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  /** `double` is the consanguineous mating line. */
  const line = (x1: number, y1: number, x2: number, y2: number, double = false) => {
    lines.push({ x1, y1, x2, y2 });
    if (double) lines.push({ x1, y1: y1 + 3, x2, y2: y2 + 3 });
  };

  if (hasParents) {
    if (parents.length === 2) {
      const father = parents.find(p => p.relation === 'father') ?? parents[0];
      const mother = parents.find(p => p.relation === 'mother') ?? parents[1];
      father.x = sibMidX - GX / 2;
      mother.x = sibMidX + GX / 2;
      father.y = mother.y = yTop;
      line(father.x + H, yTop, mother.x - H, yTop, consanguinity);
      line(sibMidX, yTop, sibMidX, sibLineY);
    } else {
      parents[0].x = sibMidX;
      parents[0].y = yTop;
      line(sibMidX, yTop + H, sibMidX, sibLineY);
    }
  }
  if (sibGroup.length > 1 || hasParents) {
    line(sibMinX, sibLineY, sibMaxX, sibLineY);
    sibGroup.forEach(n => line(n.x, sibLineY, n.x, n.y - H));
  }
  if (partner) {
    const mateMidX = (proband.x + partner.x) / 2;
    line(proband.x + H, yMid, partner.x - H, yMid);
    kids.forEach(n => (n.y = yBot));
    const kidsWidth = (kids.length - 1) * GX;
    const kidsStart = mateMidX - kidsWidth / 2;
    kids.forEach((n, i) => (n.x = kidsStart + i * GX));
    const kidsLineY = yBot - 24;
    line(mateMidX, yMid, mateMidX, kidsLineY);
    if (kids.length > 1) line(kids[0].x, kidsLineY, kids[kids.length - 1].x, kidsLineY);
    kids.forEach(n => line(n.x, kidsLineY, n.x, n.y - H));
  }

  const all = [...parents, ...midRow, ...kids];
  const xs = all.map(n => n.x);
  const margin = 20;
  const vbX = Math.min(...xs) - H - margin;
  const vbY = (hasParents ? yTop : yMid) - H - 6;
  const vbW = Math.max(...xs) + H + margin - vbX;
  const vbH = (hasKids ? yBot : yMid) + H + LBL + 6 - vbY;

  return (
    <div className="border-border mt-3 border-t pt-3 text-center">
      <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-wide">
        {t('rail.pedigree')}
      </p>
      {/* Natural size, centred: a small tree is never magnified, a very wide one only shrinks. */}
      <svg
        className="mx-auto block h-auto max-w-full"
        width={Math.round(vbW)}
        height={Math.round(vbH)}
        viewBox={`${Math.round(vbX)} ${Math.round(vbY)} ${Math.round(vbW)} ${Math.round(vbH)}`}
        role="img"
        aria-label={t('rail.pedigree_aria')}
      >
        <g className="stroke-muted-foreground" strokeWidth={1.2} fill="none">
          {lines.map((l, i) => (
            <line key={i} {...l} />
          ))}
        </g>
        {all.map((n, i) => {
          const Icon = ICONS[n.sex][n.status === 'affected' ? 'affected' : 'not_affected'];
          return (
            <g key={i}>
              {/* The proband is the Figma kit's symbol, arrow included; relatives use the DS icons. */}
              {n.proband ? (
                <PedigreeProbandSymbol sex={n.sex} cx={n.x} cy={n.y} scale={ICON / 24} className="text-foreground" />
              ) : (
                <Icon
                  size={ICON}
                  x={n.x - ICON / 2}
                  y={n.y - ICON / 2}
                  className={n.partner ? 'text-muted-foreground/50' : 'text-foreground'}
                />
              )}
              {n.status === 'unknown' && !n.partner && (
                <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={14} className="fill-muted-foreground">
                  ?
                </text>
              )}
              {/* White on the filled symbol, as the proband is always affected. */}
              {n.deceased && (
                <line
                  x1={n.x - H - 5}
                  y1={n.y + H + 5}
                  x2={n.x + H + 5}
                  y2={n.y - H - 5}
                  className="stroke-background"
                  strokeWidth={1.6}
                />
              )}
              {(n.relation || n.proband) && (
                <text x={n.x} y={n.y + H + LBL} textAnchor="middle" fontSize={10} className="fill-muted-foreground">
                  {n.proband ? t('rail.pedigree_proband') : t(`family.relations.${n.relation}`)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {other.length > 0 && (
        <p className="text-muted-foreground mt-2 text-left text-[11px] leading-snug">
          {t('rail.pedigree_other', {
            count: other.length,
            list: other.map(o => t(`family.relations.${o.relation}`).toLowerCase()).join(', '),
          })}
        </p>
      )}
    </div>
  );
}

export default Pedigree;
