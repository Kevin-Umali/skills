import { useReview } from '../review-context';
import { ChangesPanel } from './ChangesPanel';

// Right inspector: a docked column on wide windows, a drawer on narrower ones. It lists every change.
export const Inspector = () => {
  const { dispatch } = useReview();
  return (
    <aside className="rs-inspector" data-feature="changes" aria-label="Changes">
      <div className="rs-insp-head">
        <h2 className="rs-insp-title">Changes</h2>
        <button type="button" className="rs-btn" aria-label="Close changes" onClick={() => dispatch({ type: 'set-inspector', isOpen: false })}>Close</button>
      </div>
      <div className="rs-insp-body" id="rs-inspector-body">
        <ChangesPanel />
      </div>
    </aside>
  );
};
