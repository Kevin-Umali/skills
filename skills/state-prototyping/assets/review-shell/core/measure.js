// Reads what an element actually renders: its layout box and computed styles.
import { STYLE_PROPERTIES, TEXT_PROPERTY } from './constants.js';

const RGB_PATTERN = /^rgb\((\d+), (\d+), (\d+)\)$/;
const LABEL_TEXT_MAX_LENGTH = 24;

export const shortenText = (text, maxLength = 64) => (text.length > maxLength ? `${text.slice(0, maxLength)}…` : text);

const formatColor = (value) => {
  const match = RGB_PATTERN.exec(value);
  if (!match) return value;
  const hexDigits = match.slice(1).map((channel) => Number(channel).toString(16).padStart(2, '0'));
  return `#${hexDigits.join('')}`;
};

const roundToTenth = (value) => Math.round(value * 10) / 10;

// One cache per diff run. A run only reads, so an element's measurement cannot go stale while it is in use.
export const createMeasureCache = () => new WeakMap();

const readElement = (element) => {
  const computedStyle = element.ownerDocument.defaultView.getComputedStyle(element);
  const box = element.getBoundingClientRect();
  const values = {
    width: `${roundToTenth(box.width)}px`,
    height: `${roundToTenth(box.height)}px`,
  };
  STYLE_PROPERTIES.forEach((property) => {
    values[property] = formatColor(computedStyle.getPropertyValue(property).trim());
  });
  const hasOwnText = !element.children.length && element.textContent.trim();
  if (hasOwnText) values[TEXT_PROPERTY] = element.textContent.trim();
  const isRendered = (box.width > 0 || box.height > 0) && computedStyle.visibility !== 'hidden';
  return { values, isRendered, box: { width: box.width, height: box.height } };
};

export const readRenderedValue = (element, property) => {
  if (property === 'width' || property === 'height') return `${roundToTenth(element.getBoundingClientRect()[property])}px`;
  return formatColor(element.ownerDocument.defaultView.getComputedStyle(element).getPropertyValue(property).trim());
};

export const normalizeColor = (value) => formatColor(String(value).trim());

export const measureElement = (element, cache) => {
  if (!cache) return readElement(element);
  if (!cache.has(element)) cache.set(element, readElement(element));
  return cache.get(element);
};

export const describeElement = (element) => {
  const tagName = element.tagName.toLowerCase();
  const firstClassName = typeof element.className === 'string' && element.className ? `.${element.className.split(/\s+/)[0]}` : '';
  const hasOwnText = !element.children.length && element.textContent.trim();
  const textSuffix = hasOwnText ? ` “${shortenText(element.textContent.trim(), LABEL_TEXT_MAX_LENGTH)}”` : '';
  const identity = element.id ? ` #${element.id}` : firstClassName ? ` ${firstClassName}` : '';
  return `${tagName}${identity}${textSuffix}`;
};
