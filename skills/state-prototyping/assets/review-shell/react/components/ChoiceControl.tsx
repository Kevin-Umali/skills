import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { CONTROLS, getControlOptions } from '../../core/controls.js';
import { useReview } from '../review-context';

const ARROW_OFFSETS: Record<string, number> = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };

interface ChoiceControlProps {
  controlId: 'compare' | 'width';
  value: string;
  extraClassName: string;
}

// One choice from the controls table (Compare, Width), drawn two ways: a segmented radiogroup and a native select.
// CSS shows one of them depending on the toolbar's width. Both write the same `set-view` action.
export const ChoiceControl = ({ controlId, value, extraClassName }: ChoiceControlProps) => {
  const { store } = useReview();
  const definition = CONTROLS[controlId];
  const options: Array<{ value: string; label: string; title?: string }> = getControlOptions(controlId);
  const feature = controlId === 'compare' ? 'compare' : undefined;
  const radioRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const choose = (nextValue: string) => store.dispatch({ type: 'set-view', key: controlId, value: nextValue });

  // Radiogroup keys: arrows move the choice and focus together, Home and End jump to the ends.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const radios = radioRefs.current;
    const currentIndex = radios.indexOf(document.activeElement as HTMLButtonElement);
    if (currentIndex === -1) return;
    let nextIndex: number | null = null;
    if (event.key in ARROW_OFFSETS) nextIndex = (currentIndex + ARROW_OFFSETS[event.key] + radios.length) % radios.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = radios.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    radios[nextIndex]?.focus();
    choose(options[nextIndex].value);
  };

  return (
    <>
      <div className={`rs-seg ${extraClassName}-seg`} role="radiogroup" aria-label={definition.label} data-control={controlId} data-feature={feature} onKeyDown={handleKeyDown}>
        {options.map((option, index) => {
          const isChecked = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isChecked}
              title={option.title ?? option.label}
              tabIndex={isChecked ? 0 : -1}
              data-value={option.value}
              ref={(element) => { radioRefs.current[index] = element; }}
              onClick={() => choose(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <select
        className={`rs-select rs-choice-select ${extraClassName}-select`}
        aria-label={definition.label}
        data-control={`${controlId}-select`}
        data-feature={feature}
        value={value}
        onChange={(event) => choose(event.target.value)}
      >
        {options.map((option) => <option key={option.value} value={option.value} data-value={option.value}>{option.label}</option>)}
      </select>
    </>
  );
};
