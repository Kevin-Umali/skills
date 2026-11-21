// Types for the review shell. The data shapes match the notes and registry modules the vanilla starter reads.
import type { Dispatch } from 'react';

export type FrameSide = 'before' | 'after';
export type CompareMode = 'before' | 'after' | 'side';

export interface Area {
  id: string;
  label: string;
}

export interface PrototypeState {
  id: string;
  area: string;
  label: string;
  description: string;
  // Optional: the fixture details show a dash for any left out, and check-prototype warns about them.
  owner?: string;
  boundary?: string;
  limits?: string;
  fixture?: unknown;
}

export interface Notes {
  lockedAreas: string[];
  shared: string[];
  areas: Record<string, string[]>;
  states: Record<string, string[]>;
}

export interface Reason {
  selector: string;
  props?: string[];
  why: string;
}

export interface PropertyChange {
  property: string;
  from: string;
  to: string;
  category: string;
}

export interface DiffEntry {
  key: string;
  label: string;
  afterElement: Element;
  beforeElement: Element;
  changes: PropertyChange[];
  categories: string[];
  reasons: string[];
}

export interface Diff {
  entries: DiffEntry[];
  added: { label: string; afterElement: Element }[];
  removed: { label: string; beforeElement: Element }[];
}

export interface ReviewState {
  stateId: string;
  theme: 'light' | 'dark';
  width: string;
  compare: CompareMode;
  highlight: boolean;
  isSidebarOpen: boolean;
  query: string;
  collapsedAreaIds: string[];
  resetCount: number;
  diff: Diff | null;
  isMeasuring: boolean;
  measureError: string | null;
  selectedChange: number | null;
  hoveredChange: number | null;
  categoryFilter: string;
  isInspecting: boolean;
  isInspectorOpen: boolean;
  popover: 'details' | 'copy-link' | null;
}

export interface ReviewAction {
  type: string;
  [key: string]: unknown;
}

export interface ReviewContextValue {
  areas: Area[];
  states: PrototypeState[];
  notes: Notes;
  reasons: Reason[];
  state: ReviewState;
  dispatch: Dispatch<ReviewAction>;
}

export interface FrameRefs {
  before: HTMLIFrameElement | null;
  after: HTMLIFrameElement | null;
  probe: HTMLIFrameElement | null;
}
