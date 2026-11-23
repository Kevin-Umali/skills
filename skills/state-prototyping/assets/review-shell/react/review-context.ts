import { createContext, useContext } from 'react';
import type { ReviewStore } from './review-store';
import { usePartOfStore } from './review-store';
import type { Area, Notes, PrototypeState, Reason, RenderPart } from './types';

export interface ReviewContextValue {
  areas: Area[];
  states: PrototypeState[];
  notes: Notes;
  reasons: Reason[];
  store: ReviewStore;
}

export const ReviewContext = createContext<ReviewContextValue | null>(null);

export const useReview = (): ReviewContextValue => {
  const value = useContext(ReviewContext);
  if (!value) throw new Error('useReview must be used inside <ReviewShell>.');
  return value;
};

// The state as of the last action that can change this part of the shell. Other actions do not re-render the caller.
export const useReviewPart = (part: RenderPart) => usePartOfStore(useReview().store, part);
