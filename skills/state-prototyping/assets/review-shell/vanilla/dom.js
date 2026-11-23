// Small DOM helpers so the components read as intent, not as createElement noise.
import { buildIconSvg } from '../core/icons.js';

export const byId = (id) => document.getElementById(id);

export const createElement = (tagName, { className, text, attributes = {}, dataset = {} } = {}, children = []) => {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  Object.entries(dataset).forEach(([name, value]) => { element.dataset[name] = value; });
  element.append(...children);
  return element;
};

export const createButton = (label, { className = 'rs-btn', ...options } = {}) =>
  createElement('button', { className, text: label, ...options, attributes: { type: 'button', ...options.attributes } });

export const createList = (items) => createElement('ul', {}, items.map((text) => createElement('li', { text })));

export const setIcon = (element, iconName) => { element.innerHTML = buildIconSvg(iconName); };

// Fills every `<span data-icon="name">` placeholder with its icon.
export const hydrateIcons = (container = document) => container.querySelectorAll('[data-icon]').forEach((slot) => setIcon(slot, slot.dataset.icon));

// Returns a function that says whether any of the values it is given differ from the previous call.
// Parts use it to skip redrawing when nothing they show has changed.
export const createChangeDetector = () => {
  let previous = [];
  return (...values) => {
    const hasChanged = values.length !== previous.length || values.some((value, index) => !Object.is(value, previous[index]));
    previous = values;
    return hasChanged;
  };
};

// Re-rendering replaces buttons. Keep keyboard focus on the equivalent button afterwards.
export const renderKeepingFocus = (container, renderContent) => {
  const focusKey = container.contains(document.activeElement) ? document.activeElement.dataset.focusKey : null;
  renderContent();
  if (!focusKey) return;
  container.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus();
};

// True when focus is somewhere the reviewer is typing, so single-key shortcuts stay out of the way.
export const isTypingTarget = (target) => Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"]'));
