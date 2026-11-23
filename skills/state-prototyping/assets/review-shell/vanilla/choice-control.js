// One choice from the controls table (Compare, Width), drawn two ways: a segmented radiogroup and a native select.
// CSS shows one of them depending on the toolbar's width. Both write the same `set-view` action.
import { getControlOptions } from '../core/controls.js';
import { createElement } from './dom.js';

const ARROW_OFFSETS = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };

export const createChoiceControl = ({ definition, mount, dispatch, extraClassName = '' }) => {
  const options = getControlOptions(definition.id);
  const feature = definition.id === 'compare' ? 'compare' : undefined;

  const radios = options.map((option) => createElement('button', {
    text: option.label,
    attributes: { type: 'button', role: 'radio', 'aria-checked': 'false', title: option.title ?? option.label, tabindex: '-1' },
    dataset: { value: option.value },
  }));
  const group = createElement('div', {
    className: `rs-seg ${extraClassName}-seg`,
    attributes: { role: 'radiogroup', 'aria-label': definition.label },
    dataset: { control: definition.id, ...(feature ? { feature } : {}) },
  }, radios);

  const select = createElement('select', {
    className: `rs-select rs-choice-select ${extraClassName}-select`,
    attributes: { 'aria-label': definition.label },
    dataset: { control: `${definition.id}-select`, ...(feature ? { feature } : {}) },
  }, options.map((option) => createElement('option', { text: option.label, attributes: { value: option.value }, dataset: { value: option.value } })));

  const choose = (value) => dispatch({ type: 'set-view', key: definition.id, value });

  radios.forEach((radio) => radio.addEventListener('click', () => choose(radio.dataset.value)));
  // Radiogroup keys: arrows move the choice and focus together, Home and End jump to the ends.
  group.addEventListener('keydown', (event) => {
    const currentIndex = radios.indexOf(document.activeElement);
    if (currentIndex === -1) return;
    let nextIndex = null;
    if (event.key in ARROW_OFFSETS) nextIndex = (currentIndex + ARROW_OFFSETS[event.key] + radios.length) % radios.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = radios.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    radios[nextIndex].focus();
    choose(radios[nextIndex].dataset.value);
  });
  select.addEventListener('change', () => choose(select.value));
  mount.append(group, select);

  // Roving tabindex: only the checked option is a tab stop.
  const render = (value) => {
    radios.forEach((radio) => {
      const isChecked = radio.dataset.value === value;
      radio.setAttribute('aria-checked', String(isChecked));
      radio.tabIndex = isChecked ? 0 : -1;
    });
    select.value = value;
  };

  return { render };
};
