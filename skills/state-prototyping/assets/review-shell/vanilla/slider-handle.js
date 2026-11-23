// The Before and After divider: a keyboard- and pointer-operable slider. The split lives in the store;
// this module turns input into `set-split` actions and keeps the ARIA value in step.
import { DEFAULT_SPLIT } from '../core/constants.js';
import { buildIconSvg } from '../core/icons.js';
import { getSplitFromKey, getSplitFromPointer, getSplitValueText } from '../core/slider.js';
import { byId } from './dom.js';

export const createSliderHandle = ({ boundsElement, dispatch, getState }) => {
  const handle = byId('rs-divider');
  byId('rs-grip').innerHTML = buildIconSvg('grip');

  const setSplit = (value) => dispatch({ type: 'set-split', value });

  // Pointer capture stays on the handle only, so a drag over a preview iframe keeps working.
  handle.addEventListener('pointerdown', (event) => {
    handle.setPointerCapture(event.pointerId);
    handle.focus();
    event.preventDefault();
  });
  handle.addEventListener('pointermove', (event) => {
    if (!handle.hasPointerCapture(event.pointerId)) return;
    setSplit(getSplitFromPointer(event.clientX, boundsElement.getBoundingClientRect()));
  });
  handle.addEventListener('keydown', (event) => {
    const nextSplit = getSplitFromKey(event, getState().split);
    if (nextSplit === null) return;
    event.preventDefault();
    setSplit(nextSplit);
  });
  handle.addEventListener('dblclick', () => setSplit(DEFAULT_SPLIT));

  const render = ({ split }) => {
    handle.setAttribute('aria-valuenow', String(split));
    handle.setAttribute('aria-valuetext', getSplitValueText(split));
  };

  return { render };
};
