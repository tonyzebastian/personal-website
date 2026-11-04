// Frees a WebGL context once its canvas has left the page. Browsers allow
// only a few live contexts (about 16) and drop the oldest past that, so
// pieces that mount and unmount as they scroll in and out would otherwise
// pile them up until garbage collection.
//
// It waits a tick and checks the canvas is gone: React's development double
// run tears a piece down and sets it up again on the same canvas, and
// getContext would then hand back the lost context and draw nothing.
export function releaseContext(gl) {
  const canvas = gl?.canvas;
  if (!canvas) return;
  setTimeout(() => {
    if (!canvas.isConnected) gl.getExtension('WEBGL_lose_context')?.loseContext();
  }, 0);
}
