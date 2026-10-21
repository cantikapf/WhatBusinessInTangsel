'use client';

import * as React from 'react';
import { HEIGHT, WIDTH } from './geometry';
import { INDICATORS, STATES, WEIGHTS } from './model';

/**
 * All 21 plates are computed server-side and shipped as finished path strings;
 * this component only picks which one is visible. Nothing is rebuilt on the
 * client, so the drawing cannot drift from the engine's numbers.
 */
export function MethodFigureLive({ plates }: { plates: string[] }) {
  const [index, setIndex] = React.useState(0);
  const pointer = React.useRef<{ id: number; x: number; from: number } | null>(null);
  const active = STATES[index];

  const step = React.useCallback((delta: number) => {
    setIndex((current) => (current + delta + STATES.length) % STATES.length);
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Let the arrows keep their own clicks: capturing the pointer on the stage
    // retargets pointerup, and the button's click never fires.
    if ((event.target as Element).closest('button')) return;
    pointer.current = { id: event.pointerId, x: event.clientX, from: index };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const held = pointer.current;
    pointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!held || held.id !== event.pointerId) return;
    const steps = Math.trunc((event.clientX - held.x) / 40);
    if (steps) setIndex((held.from + steps + STATES.length * 4) % STATES.length);
  };

  const shown = (value: number) => value.toFixed(2).replace('.', ',');

  return (
    <figure className="method-figure">
      <div
        role="slider"
        tabIndex={0}
        aria-label="Beban pada timbangan per kecamatan dan sektor"
        aria-valuemin={1}
        aria-valuemax={STATES.length}
        aria-valuenow={index + 1}
        aria-valuetext={active.readout}
        className="iso method-figure-stage"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            step(1);
          }
          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            step(-1);
          }
        }}
      >
        <svg className="iso-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={active.readout} focusable="false">
          {plates.map((plate, plateIndex) => (
            <g
              key={plateIndex}
              dangerouslySetInnerHTML={{ __html: plate }}
              style={plateIndex === index ? undefined : { display: 'none' }}
            />
          ))}
        </svg>
        <div className="method-figure-bar">
          <span className="method-figure-readout">{active.readout}</span>
          <span className="method-figure-buttons">
            <button type="button" onClick={() => step(-1)} aria-label="Kasus sebelumnya">
              ←
            </button>
            <span aria-hidden="true" className="tabular-nums">
              {index + 1}/{STATES.length}
            </span>
            <button type="button" onClick={() => step(1)} aria-label="Kasus berikutnya">
              →
            </button>
          </span>
        </div>
      </div>
      <figcaption className="method-figure-legend">
        <ul>
          {INDICATORS.map((indicator, position) => (
            <li key={indicator.code}>
              <span className="method-figure-code">{indicator.code}</span>
              <span className="method-figure-name">{indicator.name}</span>
              <span className="method-figure-weight">{Math.round(WEIGHTS[position] * 100)}%</span>
              <span className="method-figure-value tabular-nums">{shown(active.values[position])}</span>
            </li>
          ))}
        </ul>
        <p>
          Tiap balok pada timbangan adalah satu indikator: tingginya bobot dikali nilainya. Tinggi
          tumpukan itu skornya, dan pembaca geser di lengan bertingkat berdiri di angka yang sama.
          Geser gambarnya atau pakai tombol panah untuk melihat kasus lain.
        </p>
      </figcaption>
    </figure>
  );
}

export default MethodFigureLive;
