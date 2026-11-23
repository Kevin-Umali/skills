// Types for the review shell. The data shapes match the notes and registry modules the vanilla starter reads.
export type FrameSide = 'before' | 'after';
export type CompareMode = 'before' | 'after' | 'split' | 'slider';
// The parts core/render-scopes.js names.
export type RenderPart = 'toolbar' | 'sidebar' | 'stage' | 'highlights' | 'inspector' | 'data' | 'announcer';
export type PopoverName = 'details' | 'share' | 'legend' | 'copy-link';

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

// What core/review-reducer.js and core/view-state.js produce.
export interface ReviewState {
  stateId: string;
  theme: 'light' | 'dark';
  width: string;
  compare: CompareMode;
  compareChosen: boolean;
  split: number;
  highlight: boolean;
  isSidebarOpen: boolean;
  sidebarChosen: boolean;
  isInspectorOpen: boolean;
  selectedChange: number | null;
  query: string;
  resetCount: number;
  diff: Diff | null;
  isMeasuring: boolean;
  measureError: string | null;
  hoveredChange: number | null;
  linkedChanges: number[];
  categoryFilter: string;
  isInspecting: boolean;
  popover: PopoverName | null;
}

export interface ReviewAction {
  type: string;
  [key: string]: unknown;
}

export interface FrameRefs {
  before: HTMLIFrameElement | null;
  after: HTMLIFrameElement | null;
  probe: HTMLIFrameElement | null;
}
