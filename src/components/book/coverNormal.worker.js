import { buildCoverNormal } from './coverNormal';

// Keeps the cover's heaviest sum off the main thread while the page loads.
self.onmessage = ({ data }) => {
  const pixels = buildCoverNormal(data);
  self.postMessage(pixels, [pixels.buffer]);
};
