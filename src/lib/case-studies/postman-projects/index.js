import { posttrialdata } from './new-trial-experiences';
import { postobvdata } from './live-collections';
import { postpinneddata } from './pinned-environments';

// Postman's case studies, each on its own page at /postman/<slug> (the
// (site)/[company]/[project] route), in the order the job page lists them.
// Each has `page` (title, intro, role, duration) and `projects`, rendered
// by CaseStudy.
export const postmanProjects = [
  { slug: 'new-trial-experiences', ...posttrialdata },
  { slug: 'live-collections', ...postobvdata },
  { slug: 'pinned-environments', ...postpinneddata },
];
