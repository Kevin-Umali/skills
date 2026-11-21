// Small DOM helpers so the components read as intent, not as createElement noise.
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

// Re-rendering replaces buttons. Keep keyboard focus on the equivalent button afterwards.
export const renderKeepingFocus = (container, renderContent) => {
  const focusKey = container.contains(document.activeElement) ? document.activeElement.dataset.focusKey : null;
  renderContent();
  if (!focusKey) return;
  container.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus();
};

export const createList = (items) => createElement('ul', {}, items.map((text) => createElement('li', { text })));
