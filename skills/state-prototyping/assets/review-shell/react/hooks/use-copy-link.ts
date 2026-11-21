import { useState } from 'react';
import type { Dispatch } from 'react';
import { COPY_NOTICE_MS } from '../../core/constants.js';
import type { ReviewAction } from '../types';

// Copies the review link. If the clipboard is refused, the navigator shows the link to copy by hand.
export const useCopyLink = (dispatch: Dispatch<ReviewAction>) => {
  const [notice, setNotice] = useState('');

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      dispatch({ type: 'set-popover', popover: null });
      setNotice('Link copied.');
      setTimeout(() => setNotice(''), COPY_NOTICE_MS);
    } catch {
      dispatch({ type: 'set-popover', popover: 'copy-link' });
    }
  };

  return { copyLink, notice };
};
