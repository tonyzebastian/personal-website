// Loaded on demand by <LazyMotion>, so Motion's animation code stays out of
// the first page load. The side panel only needs animations; the sheet on
// small screens adds drag (domMax) in its own lazily loaded chunk.
import { domAnimation } from 'motion/react';

export default domAnimation;
