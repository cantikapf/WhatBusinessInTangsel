import * as k from '../../lib/iso/iso-kit';
import { INDICATORS, WEIGHTS } from './model';

/**
 * A one-pan precision balance on a bed plate.
 *
 * The figure is the formula written as an object:
 *   - each block on the pan is one indicator, its height = w_i x S_i,
 *   - the stack height is their sum = score / 10,
 *   - the poise on the graduated arm stands at that same score,
 * so the two readings have to agree. Nothing is hand-typed: the caller passes
 * the six normalised values and the engine's score.
 */

export const WIDTH = 620;
export const HEIGHT = 400;

const PLATE = { x: -122, y: -58, w: 244, d: 116, r: 12 };
const PLATE_H = 14;
const FOOT_H = 6;

const PILLAR_X = 0;
const PILLAR_Y = -34;
const PILLAR_TOP = 96;
const BRACKET_TOP = 116;
const BEAM_Z = 128;
const BEAM_T = 5;
const BEAM_D = 10;
const BEAM_HALF = 104;
const BEAM_TOP = BEAM_Z;
const BEAM_BOTTOM = BEAM_Z - BEAM_T;

const PAN_X = -86;
const PAN_R = 26;
const PAN_Z = 26;
const PAN_T = 2.2;
/**
 * Contribution -> world units of block height. Scaled so the tallest case in the
 * dataset (sum 0,915) still clears the beam underside at z=123.
 */
const STACK_SCALE = 94;
const STACK_W = 34;
const STACK_D = 28;

export const RIDER_FROM = -6;
export const RIDER_TO = 98;
export const riderX = (points: number) =>
  RIDER_FROM + (Math.min(10, Math.max(0, points)) / 10) * (RIDER_TO - RIDER_FROM);

export const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    [PAN_X - PAN_R, 0, PAN_Z + 66],
    [BEAM_HALF, 0, BEAM_TOP + 8],
    [-BEAM_HALF, 0, BEAM_TOP + 8],
  ],
  WIDTH,
  HEIGHT,
  { pad: 30, azimuth: 40 },
);

const at = (point: k.Point3) => k.iso(point, P);
const S = (paths: k.SolidPaths, style: k.SolidStyle = {}) => k.solidSvg(paths, style);
const L = (d: string, style: k.LineStyle = {}) => k.lineSvg(d, style);
const D = (points: k.Point3[], style: { size?: number; tone?: k.Tone } = {}) => k.dotsSvg(points, style);
const depthSort = (points: k.Plane[]) =>
  [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

export function bed() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of depthSort(k.corners(PLATE, 22))) {
    out.push(S(k.cylinder(x, y, 8, -PLATE_H - FOOT_H, 2.4, P, 24), { tone: 'lo' }));
    out.push(S(k.cylinder(x, y, 6, -PLATE_H - FOOT_H + 2.4, FOOT_H - 2.4, P, 24), { tone: 'mid' }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 10, 1.4), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 6), 0, P, 10), { tone: 'lo' }));
  const screws = k.corners(PLATE, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(''), { tone: 'lo' }));
  out.push(D(screws.map(([x, y]) => [x, y, 0] as k.Point3), { size: 0.5 }));

  // Plumb datum under the knife edge: the bed's own reference line.
  out.push(S(k.slabOf({ x: -1, y: -4, w: 2, d: 44, r: 0.8 }, 0, 0.6, P, 3), { tone: 'lo', crease: 'none' }));
  out.push(L(k.lineOnTop([-6, 40], [6, 40], 0.6, P), { tone: 'lo' }));

  // Blank maker's inlay at the front of the bed: no wording inside the drawing.
  const inlay = { x: -30, y: PLATE.y + PLATE.d - 19, w: 60, d: 10, r: 2 };
  out.push(S(k.slabOf(inlay, 0, 1.2, P, 4, 0.4), { tone: 'lo', crease: 'faint' }));
  out.push(L(k.planOutline(k.insetPlan(inlay, 2.2), 1.2, P, 4), { tone: 'faint' }));
  return out.join('');
}

export function stand() {
  const out = [];
  const pillar = { x: PILLAR_X - 11, y: PILLAR_Y - 13, w: 22, d: 26, r: 3 };
  out.push(S(k.slabOf(pillar, 0, PILLAR_TOP, P, 6, 0.7), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(pillar, 3), PILLAR_TOP, P, 6), { tone: 'faint' }));
  out.push(L(k.sideSeam(pillar, 26, P, 6), { tone: 'faint' }));
  out.push(L(k.sideSeam(pillar, 74, P, 6), { tone: 'faint' }));
  out.push(
    D(
      [
        [PILLAR_X - 6, PILLAR_Y - 9, PILLAR_TOP],
        [PILLAR_X + 6, PILLAR_Y - 9, PILLAR_TOP],
        [PILLAR_X - 6, PILLAR_Y + 9, PILLAR_TOP],
        [PILLAR_X + 6, PILLAR_Y + 9, PILLAR_TOP],
      ],
      { size: 0.5 },
    ),
  );

  // Clamp screws holding the pillar to the bed.
  for (const dy of [-10, 10]) {
    out.push(S(k.cylinder(PILLAR_X, PILLAR_Y + dy, 3.1, 0, 4.2, P, 18), { tone: 'mid' }));
    out.push(L(k.sideArc(PILLAR_X, PILLAR_Y + dy, 3.1, 2.1, P, 12), { tone: 'lo' }));
  }

  // Arm out to the knife edge, with a gusset under it.
  const arm = { x: PILLAR_X - 7, y: PILLAR_Y + 13, w: 14, d: 24, r: 3 };
  out.push(S(k.slabOf(arm, BRACKET_TOP - 7, 7, P, 6, 0.6), { tone: 'mid' }));
  out.push(L(k.planOutline(k.insetPlan(arm, 3), BRACKET_TOP, P, 6), { tone: 'faint' }));
  out.push(D([[PILLAR_X - 4, PILLAR_Y + 30, BRACKET_TOP], [PILLAR_X + 4, PILLAR_Y + 30, BRACKET_TOP]], { size: 0.5 }));
  out.push(S(k.slabOf({ x: PILLAR_X - 5, y: PILLAR_Y + 12, w: 10, d: 14, r: 1.5 }, BRACKET_TOP - 24, 17, P, 4), { tone: 'mid' }));

  // Knife edge: a narrow blade standing in the bracket, tip touching the beam.
  out.push(
    S(k.slabOf({ x: -1.4, y: -6, w: 2.8, d: 12, r: 0.6 }, BRACKET_TOP, BEAM_BOTTOM - BRACKET_TOP + 0.4, P, 3), {
      tone: 'hi',
    }),
  );
  out.push(L(k.lineOnTop([-1.4, 0], [1.4, 0], BEAM_BOTTOM + 0.4, P), { tone: 'mid' }));
  return out.join('');
}

export function beam() {
  const out = [];
  const plan = { x: -BEAM_HALF, y: -BEAM_D / 2, w: BEAM_HALF * 2, d: BEAM_D, r: 2.5 };
  out.push(S(k.slabOf(plan, BEAM_BOTTOM, BEAM_T, P, 6, 0.7), { tone: 'hi', crease: 'lo' }));
  out.push(L(k.planOutline(k.insetPlan(plan, 1.7), BEAM_TOP, P, 6), { tone: 'faint' }));
  out.push(L(k.sideSeam(plan, BEAM_Z - 1.5, P, 6), { tone: 'lo' }));

  // Boss around the knife edge.
  out.push(S(k.cylinder(0, 0, 6.6, BEAM_BOTTOM - 1.2, BEAM_T + 2.4, P, 32), { tone: 'hi', crease: 'lo' }));
  out.push(L(k.ring(0, 0, 4.2, BEAM_TOP + 1.2, P, 28), { tone: 'mid' }));

  // Graduated arm: the poise reads 0 at the boss and 10 at the end.
  const ticks = k.topTicks(RIDER_FROM, RIDER_TO, (RIDER_TO - RIDER_FROM) / 20, 2, 2.4, BEAM_TOP, [2.4, 5], P);
  out.push(L(ticks.minor, { tone: 'lo' }), L(ticks.major, { tone: 'mid' }));
  out.push(L(k.lineOnTop([RIDER_FROM, 7.4], [RIDER_TO, 7.4], BEAM_TOP, P), { tone: 'faint' }));
  out.push(L(k.lineOnTop([RIDER_FROM, -7.4], [RIDER_TO, -7.4], BEAM_TOP, P), { tone: 'faint' }));

  // Pan yoke at the end of the left arm.
  out.push(S(k.cylinder(PAN_X, 0, 4.2, BEAM_BOTTOM - 3.4, 3.4, P, 22), { tone: 'mid' }));
  out.push(L(k.ring(PAN_X, 0, 2.6, BEAM_BOTTOM, P, 18), { tone: 'lo' }));
  out.push(L(k.ring(PAN_X, 0, 4.2, BEAM_TOP, P, 22), { tone: 'faint' }));
  return out.join('');
}

export function pan() {
  const out = [];
  // Three wires from the beam end to the pan rim, so nothing crosses the load.
  const top: k.Point3 = [PAN_X, 0, BEAM_BOTTOM - 1.6];
  const rimZ = PAN_Z + PAN_T;
  const rim = PAN_R - 2;
  const anchors: k.Point3[] = [-90, 30, 150].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return [PAN_X + Math.cos(rad) * rim, Math.sin(rad) * rim, rimZ] as k.Point3;
  });
  for (const anchor of anchors) {
    const [x1, y1] = at(top);
    const [x2, y2] = at(anchor);
    out.push(L(`M${x1} ${y1}L${x2} ${y2}`, { tone: 'mid' }));
    out.push(L(k.ring(anchor[0], anchor[1], 1.5, rimZ, P, 12), { tone: 'lo' }));
  }
  out.push(S(k.cylinder(PAN_X, 0, 2.6, BEAM_BOTTOM - 5, 3.6, P, 18), { tone: 'mid' }));
  out.push(S(k.cylinder(PAN_X, 0, PAN_R, PAN_Z, PAN_T, P, 48, 0.6), { tone: 'hi', crease: 'lo' }));
  out.push(L(k.ring(PAN_X, 0, PAN_R - 2.4, rimZ, P, 48), { tone: 'lo' }));
  out.push(L(k.sideArc(PAN_X, 0, PAN_R, PAN_Z + PAN_T / 2, P, 36), { tone: 'faint' }));
  return out.join('');
}

/** One block per indicator; heights are w_i x S_i, already scaled. */
export function stack(heights: number[], values: number[]) {
  const out: string[] = [];
  let z = PAN_Z + PAN_T;
  let drawn = 0;
  heights.forEach((height, index) => {
    if (height <= 0.4) return;
    // Alternating footprint, so six blocks read as six even when one is short.
    const inset = drawn % 2 === 0 ? 0 : 5;
    const plan = {
      x: PAN_X - STACK_W / 2 + inset,
      y: -STACK_D / 2 + inset,
      w: STACK_W - inset * 2,
      d: STACK_D - inset * 2,
      r: 1.6,
    };
    const code = `S${index + 1}`;
    const label = `${INDICATORS[index].name} · bobot ${Math.round(WEIGHTS[index] * 100)}% × nilai ${values[index]
      .toFixed(2)
      .replace('.', ',')} = ${(WEIGHTS[index] * values[index] * 10).toFixed(1).replace('.', ',')} poin`;
    out.push(
      `<g data-part="${code}" data-label="${label}">${[
        S(k.slabOf(plan, z, height, P, 4, 0.9), { tone: drawn % 2 === 0 ? 'mid' : 'lo' }),
        L(k.planOutline(k.insetPlan(plan, 2.4), z + height, P, 4), { tone: 'hi' }),
        L(k.sideSeam(plan, z + height * 0.5, P, 4), { tone: 'lo' }),
      ].join('')}</g>`,
    );
    z += height + 2.6;
    drawn++;
  });
  return { svg: out.join(''), top: z };
}

export function rider(points: number) {
  const x = riderX(points);
  const out = [];
  out.push(S(k.slabOf({ x: x - 5.5, y: -6.5, w: 11, d: 13, r: 2 }, BEAM_TOP, 7, P, 5, 0.6), { tone: 'hi', crease: 'lo' }));
  out.push(L(k.planOutline({ x: x - 3.4, y: -4.4, w: 6.8, d: 8.8, r: 1.4 }, BEAM_TOP + 7, P, 4), { tone: 'faint' }));
  // Pointer blade reaching forward over the graduations.
  out.push(S(k.slabOf({ x: x - 1, y: 5.4, w: 2, d: 5.4, r: 0.5 }, BEAM_TOP - 0.4, 1.4, P, 3), { tone: 'mid', crease: 'none' }));
  out.push(L(k.lineOnTop([x, 10.4], [x, 12.6], BEAM_TOP + 1, P), { tone: 'lit' }));
  out.push(S(k.cylinder(x - 9.8, 0, 2.2, BEAM_TOP, 2.6, P, 16), { tone: 'mid' }));
  return out.join('');
}

export const LABEL =
  'A one-pan precision balance on a bed plate. Six blocks stand on the pan, one per indicator, each as tall as its weight times its value; the poise on the graduated arm stands at the same reading as the top of the stack.';

export const stackTop = (values: number[]) =>
  PAN_Z + PAN_T + WEIGHTS.reduce((sum, weight, index) => sum + weight * values[index] * STACK_SCALE, 0);

/**
 * Nested SVG: figureSvg emits its own root <svg>, and it lands inside the
 * component's viewBox svg. Returns the inner markup, root stripped.
 */
export const figureBody = (values: number[], points: number) =>
  figureSvg(values, points).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

/** The whole figure. Reads at the same height whether or not the beam is level. */
export const figureSvg = (values: number[], points: number) => {
  const heights = WEIGHTS.map((weight, index) => weight * values[index] * STACK_SCALE);
  return k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: LABEL,
    body: [bed(), stand(), beam(), pan(), stack(heights, values).svg, rider(points)],
  });
};
