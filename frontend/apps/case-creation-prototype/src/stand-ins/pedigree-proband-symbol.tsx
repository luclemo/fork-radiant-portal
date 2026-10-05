import type { ReactElement, SVGProps } from 'react';

import type { SexCode } from '../mock/patients';

/**
 * Proband, affected — the Figma kit's `Pedigree` variants (Proband=True, Affected=Affected), traced
 * from its vectors. The code's pedigree icons don't have them yet (COMPONENT-TODO): the arrow is part
 * of the symbol, with a halo that keeps it legible where it crosses the shape.
 *
 * Drawn on Figma's 27 × 27 frame; the symbol is centred on (14.83, 12). Nest it in an `<svg>`: `x` and
 * `y` place that centre at (`cx`, `cy`), and `scale` is the factor over Figma's 24 px grid.
 */
const SHAPES: Record<SexCode, ReactElement> = {
  M: <path fillRule="evenodd" clipRule="evenodd" d="M23.8284 21V3H5.82837V21H23.8284Z" />,
  F: <circle cx="14.8281" cy="12.0001" r="10" />,
  U: <path d="M26.8281 12L14.8281 24L2.82812 12L14.8281 0L26.8281 12Z" />,
};

const ARROW_HALO =
  'M16.0175 10.814L11.8335 26.4289L8.27315 22.8686L4.31335 26.8284L0 22.5151L3.9598 18.5553L0.402516 14.998L16.0175 10.814Z';
const ARROW =
  'M4.26616 16.0332L13.189 13.6423L10.7981 22.5652L8.27309 20.0401L4.31329 23.9999L2.82837 22.515L6.78817 18.5552L4.26616 16.0332Z';

type Props = { sex: SexCode; cx: number; cy: number; scale: number } & Omit<SVGProps<SVGSVGElement>, 'x' | 'y'>;

function PedigreeProbandSymbol({ sex, cx, cy, scale, ...props }: Props) {
  return (
    <svg
      x={cx - 14.8281 * scale}
      y={cy - 12 * scale}
      width={27 * scale}
      height={27 * scale}
      viewBox="0 0 27 27"
      overflow="visible"
      {...props}
    >
      <g className="fill-foreground">{SHAPES[sex]}</g>
      <path d={ARROW_HALO} className="fill-background" />
      <path d={ARROW} className="fill-foreground" />
    </svg>
  );
}

export default PedigreeProbandSymbol;
