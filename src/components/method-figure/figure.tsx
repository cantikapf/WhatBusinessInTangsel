import React from 'react';
import { figureBody } from './geometry';
import { STATES } from './model';
import MethodFigureLive from './live';

/** Finished inner markup per case — 7 kecamatan x 3 sektor — built at build time. */
const PLATES: string[] = STATES.map((state) => figureBody(state.values, state.score));

export function MethodFigure() {
  return React.createElement(MethodFigureLive, { plates: PLATES });
}

export default MethodFigure;
