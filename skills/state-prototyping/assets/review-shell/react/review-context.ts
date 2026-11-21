import { createContext, useContext } from 'react';
import type { ReviewContextValue } from './types';

export const ReviewContext = createContext<ReviewContextValue | null>(null);

export const useReview = (): ReviewContextValue => {
  const value = useContext(ReviewContext);
  if (!value) throw new Error('useReview must be used inside <ReviewShell>.');
  return value;
};
