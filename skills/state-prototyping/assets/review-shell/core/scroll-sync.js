// Keeps two preview frames scrolled to the same place (Slider mode). Framework-free.
// A frame that was just moved by the sync fires its own scroll event; that echo is recognised and ignored,
// so two frames of different heights do not drag each other back.

/**
 * @param {object} options
 * @param {() => HTMLIFrameElement[]} options.getFrames every frame that takes part
 * @param {() => boolean} options.isActive false when scrolling should not be mirrored
 */
export const createScrollSync = ({ getFrames, isActive }) => {
  const echoPositions = new Map();

  return (sourceFrame) => {
    const sourceWindow = sourceFrame.contentWindow;
    const echoPosition = echoPositions.get(sourceFrame);
    if (echoPosition && echoPosition.x === sourceWindow.scrollX && echoPosition.y === sourceWindow.scrollY) {
      echoPositions.delete(sourceFrame);
      return;
    }
    if (!isActive()) return;
    getFrames().filter((frame) => frame !== sourceFrame && frame.contentWindow).forEach((targetFrame) => {
      const targetWindow = targetFrame.contentWindow;
      const { scrollX: previousX, scrollY: previousY } = targetWindow;
      targetWindow.scrollTo(sourceWindow.scrollX, sourceWindow.scrollY);
      if (targetWindow.scrollX !== previousX || targetWindow.scrollY !== previousY) {
        echoPositions.set(targetFrame, { x: targetWindow.scrollX, y: targetWindow.scrollY });
      }
    });
  };
};
