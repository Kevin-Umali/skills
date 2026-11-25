// Measured diff between two same-origin preview documents rendering the same state.
// It reads rendered geometry and computed styles, so it needs no screenshots and cannot drift from the render.
import {
  BOX_PROPERTIES,
  CATEGORY_BY_PROPERTY,
  CATEGORY_ORDER,
  CONTROL_TAGS,
  FILL_PARENT_TOLERANCE_PX,
  INHERITED_PROPERTIES,
  SIDE_PROPERTY_GROUPS,
  SKIPPED_TAGS,
  STYLE_PROPERTIES,
  TEXT_PROPERTY,
  TRANSPARENT_COLOR,
} from './constants.js';
import { createMeasureCache, describeElement, measureElement } from './measure.js';

const SIDE_SUFFIX_PATTERN = /-(top|right|bottom|left|inline|block)$/;

// Elements are paired by id, then by position among same-tag siblings. Keys are built in one pass over a document:
// elements come in document order, so a parent's key exists before its children need it and each parent counts its children once.
const buildElementKeys = (body, elements) => {
  const keys = new Map([[body, 'body']]);
  const tagCountsByParent = new WeakMap();
  elements.forEach((element) => {
    const parent = element.parentElement;
    if (!tagCountsByParent.has(parent)) tagCountsByParent.set(parent, new Map());
    const tagCounts = tagCountsByParent.get(parent);
    const tagName = element.tagName.toLowerCase();
    const position = tagCounts.get(tagName) ?? 0;
    tagCounts.set(tagName, position + 1);
    keys.set(element, element.id ? `#${element.id}` : `${keys.get(parent) ?? ''}>${tagName}:${position}`);
  });
  return keys;
};

const hasOwnText = (element) => [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());

const isPainted = (element, values) =>
  CONTROL_TAGS.has(element.tagName.toLowerCase()) ||
  hasOwnText(element) ||
  Boolean(values['background-color'] && values['background-color'] !== TRANSPARENT_COLOR) ||
  Boolean(values['border-top-width'] && values['border-top-width'] !== '0px') ||
  Boolean(values['box-shadow'] && values['box-shadow'] !== 'none');

const fillsParentWidth = (element, cache) => {
  const parent = element.parentElement;
  if (!parent) return false;
  const parentValues = measureElement(parent, cache).values;
  const parentContentWidth = parent.clientWidth - parseFloat(parentValues['padding-left']) - parseFloat(parentValues['padding-right']);
  return Math.abs(measureElement(element, cache).box.width - parentContentWidth) < FILL_PARENT_TOLERANCE_PX;
};

// padding-top/right/bottom/left that changed the same way read as one change.
const mergeSideChanges = (changes) => {
  let merged = changes;
  SIDE_PROPERTY_GROUPS.forEach((group) => {
    const findSide = (side) => merged.find((change) => change.property === `${group}-${side}`);
    const [top, right, bottom, left] = ['top', 'right', 'bottom', 'left'].map(findSide);
    const changedAlike = (first, second) => first && second && first.from === second.from && first.to === second.to;
    const removeChanges = (...removed) => { merged = merged.filter((change) => !removed.includes(change)); };
    if (changedAlike(top, right) && changedAlike(right, bottom) && changedAlike(bottom, left)) {
      removeChanges(top, right, bottom, left);
      merged = [...merged, { property: group, from: top.from, to: top.to }];
      return;
    }
    if (changedAlike(left, right)) {
      removeChanges(left, right);
      merged = [...merged, { property: `${group}-inline`, from: left.from, to: left.to }];
    }
    if (changedAlike(top, bottom)) {
      removeChanges(top, bottom);
      merged = [...merged, { property: `${group}-block`, from: top.from, to: top.to }];
    }
  });
  return merged;
};

const isNoise = ({ property, from, to, afterElement, beforeElement, afterValues, beforeValues, parentValues, cache }) => {
  const tagName = afterElement.tagName.toLowerCase();
  const inheritedFromParent = INHERITED_PROPERTIES.includes(property) && parentValues.before[property] === from && parentValues.after[property] === to;
  const noBorderDrawn = property === 'border-top-color' && (beforeValues['border-top-width'] === '0px' || afterValues['border-top-width'] === '0px');
  const followsParentWidth = property === 'width' && fillsParentWidth(afterElement, cache) && fillsParentWidth(beforeElement, cache);
  const isSizeProperty = BOX_PROPERTIES.includes(property);
  const unpaintedWrapper = isSizeProperty && !isPainted(afterElement, afterValues) && !CONTROL_TAGS.has(tagName);
  const followsChildren = property === 'height' && afterElement.children.length > 0 && !CONTROL_TAGS.has(tagName);
  return inheritedFromParent || noBorderDrawn || followsParentWidth || unpaintedWrapper || followsChildren;
};

const getPropertyCategory = (property) => CATEGORY_BY_PROPERTY[property] ?? 'shape';

const collectChanges = (beforeElement, afterElement, cache) => {
  const before = measureElement(beforeElement, cache);
  const after = measureElement(afterElement, cache);
  const parentValues = {
    before: beforeElement.parentElement ? measureElement(beforeElement.parentElement, cache).values : {},
    after: afterElement.parentElement ? measureElement(afterElement.parentElement, cache).values : {},
  };
  const properties = [...BOX_PROPERTIES, ...STYLE_PROPERTIES, TEXT_PROPERTY];
  const changes = properties
    .map((property) => ({ property, from: before.values[property] ?? '', to: after.values[property] ?? '' }))
    .filter(({ from, to }) => from !== to)
    .filter((change) => !isNoise({ ...change, afterElement, beforeElement, afterValues: after.values, beforeValues: before.values, parentValues, cache }));
  return mergeSideChanges(changes);
};

const isTinyBox = ({ box }) => box.width <= 1 && box.height <= 1;

const toEntry = (key, beforeElement, afterElement, changes) => {
  const categorizedChanges = changes.map((change) => ({ ...change, category: getPropertyCategory(change.property) }));
  const categories = CATEGORY_ORDER.filter((category) => categorizedChanges.some((change) => change.category === category));
  return { key, label: describeElement(afterElement), afterElement, beforeElement, changes: categorizedChanges, categories, reasons: [] };
};

export const computeDiff = (beforeDocument, afterDocument) => {
  const cache = createMeasureCache();
  const beforeElements = [...beforeDocument.body.querySelectorAll('*')];
  const afterElements = [...afterDocument.body.querySelectorAll('*')];
  const beforeKeys = buildElementKeys(beforeDocument.body, beforeElements);
  const afterKeys = buildElementKeys(afterDocument.body, afterElements);
  const beforeByKey = new Map(beforeElements.map((element) => [beforeKeys.get(element), element]));
  const seenKeys = new Set();
  const entries = [];
  const added = [];

  afterElements
    .filter((element) => !element.closest(SKIPPED_TAGS))
    .forEach((afterElement) => {
      const key = afterKeys.get(afterElement);
      seenKeys.add(key);
      const beforeElement = beforeByKey.get(key);
      const afterMeasure = measureElement(afterElement, cache);
      if (!beforeElement) {
        if (afterMeasure.isRendered) added.push({ label: describeElement(afterElement), afterElement });
        return;
      }
      const beforeMeasure = measureElement(beforeElement, cache);
      if (!afterMeasure.isRendered && !beforeMeasure.isRendered) return;
      if (isTinyBox(beforeMeasure) && isTinyBox(afterMeasure)) return; // visually hidden helpers
      const changes = collectChanges(beforeElement, afterElement, cache);
      if (changes.length) entries.push(toEntry(key, beforeElement, afterElement, changes));
    });

  const removed = [...beforeByKey]
    .filter(([key, element]) => !seenKeys.has(key) && !element.closest(SKIPPED_TAGS) && measureElement(element, cache).isRendered)
    .map(([, element]) => ({ label: describeElement(element), beforeElement: element }));
  return { entries, added, removed };
};

export const toBaseProperty = (property) => property.replace(SIDE_SUFFIX_PATTERN, '');

// Agent-written reasons are matched by selector and, optionally, by property.
export const findReasons = (entry, reasons) => {
  const matched = reasons
    .filter((reason) => entry.afterElement.matches(reason.selector))
    .filter((reason) => !reason.props || entry.changes.some((change) => reason.props.some((property) => toBaseProperty(property) === toBaseProperty(change.property))))
    .map((reason) => reason.why);
  return [...new Set(matched)];
};

export const attachReasons = (diff, reasons) => ({
  ...diff,
  entries: diff.entries.map((entry) => ({ ...entry, reasons: findReasons(entry, reasons) })),
});

export const countChangedProperties = (entries) => entries.reduce((total, entry) => total + entry.changes.length, 0);

export const countEntriesByCategory = (entries) =>
  CATEGORY_ORDER.map((category) => ({ category, count: entries.filter((entry) => entry.categories.includes(category)).length })).filter(({ count }) => count > 0);
