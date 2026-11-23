// Coalesces bursts into one callback per animation frame, so scroll and resize events redraw once per frame.
export const createFrameScheduler = (callback) => {
  let frameId = 0;
  const schedule = () => {
    if (frameId) return;
    frameId = requestAnimationFrame(() => {
      frameId = 0;
      callback();
    });
  };
  const cancel = () => {
    cancelAnimationFrame(frameId);
    frameId = 0;
  };
  return { schedule, cancel };
};

// Runs a callback at once, then at most once per interval, with the last request always honoured.
// A single action updates immediately; a burst (dragging the slider) is spread out.
export const createThrottledCall = (callback, intervalMs) => {
  let lastRunAt = 0;
  let timerId = 0;
  const run = () => {
    timerId = 0;
    lastRunAt = Date.now();
    callback();
  };
  return () => {
    if (timerId) return;
    const wait = lastRunAt + intervalMs - Date.now();
    if (wait <= 0) run();
    else timerId = setTimeout(run, wait);
  };
};
