export const metadata = {
  title: 'Tony Sebastian ✦ designer',
  description: 'A visual product designer | Love to code | always tinkering with a side project',
  keywords: 'design, art, cinematography, photography, travel',
  twitter: {
    card: 'summary_large_image',
    site: '@tonyzebastian',
    creator: '@tonyzebastian',
    title: 'Tony Sebastian ✦ designer',
    description: 'A visual product designer | Love to code | always tinkering with a side project',
    image: 'https://www.tonyzeb.com/preview.png',
  },
  og: {
    title: 'Tony Sebastian ✦ designer',
    description: 'A visual product designer | Love to code | always tinkering with a side project',
    url: 'https://www.tonyzeb.com/',
    image: 'https://www.tonyzeb.com/preview.png',
    locale: 'en_EN',
  },
};

export const experience = [
  {
    name: 'Sundial',
    slug: 'sundial',
    role: 'Lead Designer',
    link: 'https://sundial.so/',
    image: '/icons/sundial.webp',
    period: "Oct'25 - Oct'26",
    description: "A Sequoia-backed AI analytics startup founded by Meta executives, including Julie Zhuo, Meta's former VP of Design. I lead design across the product.",
    // Overview shown on the company page (from the 2026-11-03 drafts in the wiki).
    overview: [
      "I joined Sundial, an AI analytics company, wanting more responsibility and a wider range of work. I was excited about the people I would work with and keen to move further into design engineering. The role gave me room to do all of that.",
      "I worked on the Context Engine, where people explored the data and context behind the analytics product. My contributions included search, multi-tab navigation, and a split-pane workspace for inspecting assets without losing your place. I also built working prototypes for agent experiences, exploring how people could review changes and stay in control of what an agent did.",
      "Over time, more of my design work happened directly in code. I contributed production frontend changes and led the design and implementation of Gnomon's first foundation, working closely with engineering. The work extended beyond the application too. I rebuilt the website in code, worked on the documentation platform, and made product videos and other material to explain what we were building.",
      "I loved that breadth. The team encouraged us to use AI, try things, and show working ideas. I learned a lot from the people around me and grew into a design engineering role, taking on more responsibility for building what I designed.",
      "Sundial also helped me understand the kind of team I work best in. I like knowing the people I am building with, being able to talk through an idea directly, and having room to contribute wherever my skills are useful. I want to keep that range in whatever I do next.",
    ],
    items: [],
  },
  {
    name: 'Postman',
    slug: 'postman',
    role: 'Senior Product Designer',
    link: 'https://www.postman.com/',
    image: '/icons/postman.webp',
    period: "Jun'22 - Jun'25",
    description: "The API platform used by millions of developers. I designed trial experiences, API observability with Live Collections, and everyday workflow improvements.",
    // Overview shown on the company page (from the 2026-11-03 drafts in the wiki).
    overview: [
      "At Postman I designed for millions of developers who used the product every day. I joined to learn from a bigger design team and see how design works at that scale.",
      "At that scale, even rewording a label or moving a dropdown could break a workflow people relied on. I learned to think those changes through with PMs, engineers and other designers.",
      {
        media: ['/images/projects/miniprojects/mini_pin_02.mp4'],
        alt: 'Pinning environments to a collection in Postman',
        caption: 'Pinned environments: a collection carries its own, so people rarely pick one by hand.',
      },
      "I started on API observability, a 0 to 1 project, designing Live Collections, which kept a collection in sync with a running service.",
      {
        media: ['/images/experience/postman-live-collections-launch.webp'],
        alt: "Postman's blog post introducing Live Collections for automated documentation",
        caption: 'Live Collections, announced on the Postman blog.',
      },
      "Later I spent time on the design system, where I started coding and sent my first PRs, and then in Growth, where I designed a new trial experience for teams.",
      {
        media: ['/images/projects/trial_02.mp4'],
        alt: 'A team inviting its fourth member, which starts a Postman trial',
        caption: 'When a team adds its fourth member, its trial begins.',
      },
      "I also ran sessions on video editing, visual design and photography for the design team, and made good friends there. The trip to Barcelona for Postman's tenth anniversary is still a favourite memory.",
      {
        media: ['/images/experience/postman-barcelona-trip.webp'],
        alt: 'A group of Postman designers in white outfits at an evening beach party in Barcelona',
        caption: "With most of the design team in Barcelona, for Postman's tenth anniversary.",
      },
    ],
    items: [
      {
        title: "New Trial Experiences",
        description: "Designed new trial experiences that improved user awareness by 27% and conversion by 5%.",
        images: ["/images/projects/trial_01.png", "/images/projects/trial_02.mp4"],
        link: "/postman/new-trial-experiences",
        meta: "Growth · Experiments",
      },
      {
        title: "Live Collections",
        description: "A 0 to 1 project that brought API observability into Postman, letting users monitor their collections in real time.",
        images: ["/images/projects/live_collections_1.png", "/images/projects/live_collections_2.png"],
        link: "/postman/live-collections",
        summary: "Postman's first observability feature: collections kept in sync with live traffic.",
        meta: "API Observability · 0 to 1",
      },
      {
        title: "Pinned Environments",
        description: "Letting a collection carry its own environments, so people rarely have to pick one before sending a request.",
        images: ["/images/projects/mini_project_02.mp4", "/images/projects/mini_proj_01.png"],
        link: "/postman/pinned-environments",
        summary: "Collections that carry their own environments, cutting unresolved variable errors in forks by 28%.",
        meta: "Core workflows · Usability",
      },
    ]
  },
  { 
    name: 'Hypersonix', 
    slug: 'hypersonix',
    role: 'Lead Product Designer', 
    link: 'https://hypersonix.ai/',
    image: '/icons/hypersonix.webp',
    period: "Nov'20 - May'22",
    description: "An AI analytics platform for e-commerce and retail teams. As Lead Product Designer, I drove 0 to 1 explorations, scaled the design system and improved core product experiences.",
    // Overview shown on the company page (from the 2026-11-03 drafts in the wiki).
    overview: [
      "Hypersonix was my first full product design role, at a US analytics company that helped retail businesses get answers from their data. The job was fully remote: I worked from India with a small design team, close to product and engineering, and I've never met any of them in person.",
      "Much of the work was making complex data easier to work with. I redesigned Documents, where people built and compared reports, and worked on onboarding.",
      {
        media: ['/images/projects/hypersonix/hx_doc_03.mp4'],
        alt: 'Documents in Hypersonix',
        caption: 'Documents, with the new card layout.',
      },
      "There was room to try new ideas too: voice for the analytics assistant, App Studio, a no-code concept we tested with customers as a prototype, and Hawkeye, which surfaced insights in small pieces people could act on.",
      {
        media: ['/images/projects/hx_hawk.mp4'],
        alt: 'Hawkeye, an insights platform concept',
        caption: 'Hawkeye, an early concept.',
      },
      "I also helped build Sonic, our first design system, working with engineers and product managers so everyone used the same pieces.",
      {
        media: ['/images/projects/hypersonix/hx_sonic_03.webp'],
        alt: 'A card component in the Sonic design system, with its spacing and states',
        caption: 'A component from Sonic, our first design system.',
      },
      "Over time I took on more of the team. I hired two designers, mentored them, and helped them grow into their roles. The work was fluid enough that a conversation could start with a product flow and end up on what we should say on the website or how to market it.",
    ],
    caseStudy: {
      link: "/hypersonix",
      images: ["/images/projects/hx_onboarding.mp4", "/images/projects/hx_hawk.mp4"],
    },
    items: []
  },
  // Earlier roles: rows on the home page only, not on the /experience timeline.
  {
    name: 'AVRL',
    slug: 'avrl',
    role: 'Visual Designer',
    link: 'https://www.avrl.io/',
    image: '/icons/avrl.webp',
    period: "Jan'19 - Oct'20",
    description: "My first job as a designer. In late 2018 I made the switch from business analysis to design and joined AVRL (Advanced Voice Research Labs) as a Visual Designer. The role was fully remote, so I moved back to my hometown in Kerala and worked from there.",
    // Overview shown on the company page (from the 2026-11-03 drafts in the wiki).
    overview: [
      "AVRL was where I switched careers. Leaving a steady consulting job for visual design felt like a big bet. I hadn't studied design, and most of what I knew, I'd taught myself. A few freelance projects gave me a portfolio, and a contract with AVRL became my way in.",
      "It was a small US team of about fifteen, fully remote, so I moved back to my hometown in Kerala and worked from there. I made decks, storyboards and one of my first explainer videos in After Effects.",
      { youtube: "u88Qmw-XpeI", title: "AVRL explainer video", poster: "/images/experience/avrl-explainer.webp", caption: "The explainer I made in After Effects." },
      "The product began as a voice assistant for inventory: you said what stock was left and the system updated it. I designed the interfaces around that, and later for the company's move into fleet management. Doing that work showed me what product design really was. I wanted to do more than make screens, and design for how people actually use and understand them.",
      "One memory I still carry from AVRL is our company trip to Bali. It was my first time travelling abroad.",
      { media: ["/images/experience/avrl-bali-trip.webp"], alt: "The AVRL team on the deck of a boat off the coast of Bali", caption: "Out on the water with the AVRL team in Bali." },
    ],
    related: [{ title: '15 Months of remote work: A Recap', href: '/musings/remote_work' }],
    timeline: false,
    items: [],
  },
  {
    name: 'Infosys',
    slug: 'infosys',
    role: 'Senior Associate Consultant',
    link: 'https://www.infosys.com/',
    image: '/icons/infosys.webp',
    period: "Apr'16 - Dec'18",
    description: "Where my career started. After a master's in marketing, I joined Infosys as a business analyst and grew into a Senior Associate Consultant. Working close to how products get built made me curious about design, which I went on to teach myself. I also wrote about how the asset management team revived its legacy system.",
    // Overview shown on the company page (from the 2026-11-03 drafts in the wiki).
    overview: [
      "Infosys was my first job, and it began on the Mysore campus, which felt a lot like going back to college. I had just finished a master's in marketing and systems, and I joined the team that built and ran the company's own internal tools: payroll, HR, learning, and the one I ended up on, asset management.",
      { media: ["/images/experience/infosys-mysore-campus.webp"], alt: "Tony cycling along a road on the Infosys Mysore campus", caption: "Cycling around the Mysore campus." },
      "My role was closer to a product owner than anything else. The system kept track of everything Infosys owned, from laptops and software to vehicles and buildings. Handing someone a laptop sounds simple, but behind it were asset IDs, purchase records in SAP, approvals, and several departments that all needed the same information. Our team worked on bringing three separate systems together into one asset management platform.",
      "It was the first time I'd worked on a product with that many moving parts. To understand the workflows, I had to understand the people behind them, and I kept finding places where the software no longer matched how they actually worked.",
      "Design had been on my mind for a while. I knew Photoshop, I liked visual work, and I'd pictured myself doing something in branding or marketing. The consulting work didn't feel like enough, so towards the end of my time there I started learning Figma and taking on freelance projects to see where it might lead.",
    ],
    related: [{ title: 'Reviving a legacy system at Infosys', href: '/musings/infosys_legacy' }],
    timeline: false,
    items: [],
  },
];

// Home list of musings. `readTime` matches the one on the musing's own page;
// it and `summary` (two lines at most) show on the musing's card at the end
// of a job page. `excerpt` is the opening of each piece, shown as the
// page on its carousel card (it fades out, so a couple of paragraphs is plenty).
export const musings = [
  {
    name: 'Reduce perceived wait times through visual delight',
    date: 'May 2024',
    link: '/musings/perceived_wait',
    readTime: '4 min read',
    excerpt: [
      "Staring at a blank screen as an app slowly loads is a surefire way to lose user attention. Whether it's loading a webpage or launching an app, users expect speed and efficiency.",
      'This is where visual delight comes into play. It is not just about aesthetics; it is about creating a memorable, engaging experience that captivates attention, reduces perceived wait times and leaves a lasting impression.',
    ],
  },
  {
    name: 'Mnemonic Signages',
    date: 'Jan 2024',
    link: '/musings/mnemonic_signages',
    readTime: '2 min read',
    excerpt: [
      'I used to have difficulty remembering where I parked my car in large parking lots. To solve this, I began taking pictures of the pillar near where I parked.',
      'Recently, while photographing a pillar, I noticed an interesting pattern where illustrations are displayed next to the alphabet. These are known as mnemonic signages.',
    ],
  },
  {
    name: '365 days of drawing - Some learnings',
    date: 'Jun 2021',
    link: '/musings/days_drawing',
    readTime: '3 min read',
    excerpt: [
      'On 2nd May 2020, I decided to start a new project: draw something every day for a year. 365 days later, I completed it, and these are some of my learnings and realizations.',
      "As expected, my drawing skills levelled up. Compared with last year's drawings, there is a massive improvement in colour usage and overall line quality.",
    ],
  },
  {
    name: '15 Months of remote work: A Recap',
    date: 'Nov 2020',
    link: '/musings/remote_work',
    summary: "What fifteen months of working remotely taught me.",
    readTime: '7 min read',
    excerpt: [
      "It wasn't a deliberate choice to go remote. Back in late 2018, I was looking to switch from being a senior business analyst at Infosys to trying my luck in the design field.",
      'A friend had been working remotely for about a year and seemed to be thriving, working from their hometown with occasional travel. That inspired me to explore remote jobs.',
    ],
  },
  {
    name: 'Reviving a legacy system at Infosys',
    date: 'Nov 2018',
    link: '/musings/infosys_legacy',
    summary: "How the asset team merged three old systems into one platform.",
    readTime: '7 min read',
    excerpt: [
      'As companies grow, asset management becomes crucial for smooth operations. Smaller firms manage with spreadsheets, but multinationals need dedicated systems.',
      "This case study outlines how Infosys' asset management team revamped their legacy system to boost efficiency, cut costs, and enhance control and accountability.",
    ],
  },
];



export const bio = {
  intro: "I like to build things. I'm into design, art and cinematography. I believe in consistency, side projects and letting life shape my craft.",
  email: "tonyzeb.design@gmail.com",
  social: {
    x: "https://x.com/tonyzebastian",
    linkedin: "https://www.linkedin.com/in/tonyzebastian/",
    github: "https://github.com/tonyzebastian"
  }
};



export const now = [
  {
    description: [
      "I spend a lot of time thinking about motion - how things move, feel, respond and build those interactions through code. Currently learning through ",
      {
        text: "Animation on the web",
        href: "https://animations.dev/"
      },
      " and ",
      {
        text: "Interactive svg animations",
        href: "https://www.svg-animations.how/"
      },
      "."
    ]
  },
  {description: "As a creative, I love experimenting with tools like Midjourney, Veo, Kling and more to explore ideas faster and push them further."},
  {description: "Developing a systems mindset and stronger product sense to better connect insights to design decisions."},
  {description: "Writing more code, and trying to write it better. As AI becomes integral to design, I'm learning how systems work and how to guide them through better prompts."}
];


export const aboutBio = [
  {
    text: "Hey, I'm Tony, a designer who loves bringing ideas to life through thoughtful design, a bit of code, and a touch of motion.",
  },
  {
    text: " My path into design wasn't linear. I started with a master's in marketing, got curious about how products are built, and eventually taught myself design. I went from being a Business Analyst at Infosys to freelancing, then to building digital products at Hypersonix, and now designing at Postman.",
  },
  {
    text: "I've spent the past 7 years exploring the intersection of craft, systems thinking, and technology, creating experiences that not only look good but feel right. I'm currently based in Bangalore, though I still carry a bit of my hometown, Thodupuzha, Kerala, wherever I go.",
  },
];

export const aboutFunThings = [
  {
    text: "I'm an illustrator at heart—completed a 365-day drawing challenge in 2022.",
    links: [
      {
        text: "drawing challenge",
        href: "https://pin.it/3PKGQjN2Y"
      }
    ]
  },
  {
    text: "I dream of becoming a cinematographer someday.",
    links: [
      {
        text: "cinematographer",
        href: "https://www.youtube.com/@tonyzebastian"
      }
    ]
  },
  {
    text: "Running is a hobby I picked up 2025. Planning to do a half marathon in 2026.",
  }
];

export const aboutPrinciples = [
  "Consistency and effort always beat talent.",
  "It's never too late to pick up a new hobby.",
  "Let life's events shape and inspire your creative journey.",
  "Side projects are like oxygen—they keep your passion alive."
];

export const junymade = [
  {
    text: "Juny Made is an art studio I run with my partner, specializing in creating personalized, handmade embroidered gifts and unique creative projects. Follow us on Instagram. ",
    links: [
      {
        text: "Instagram.",
        href: "https://pin.it/3PKGQjN2Y"
      }
    ]
  },
];

// The Dalal Prints page under Side projects (/dalal-prints):
// what the series is, then the finished posters on a drag wall (PosterWall,
// from src/lib/dalal-prints.json). `x` is its account, linked in the details line.
export const dalalPrintsPage = {
  paragraphs: [
    "Dalal Prints is a series of art posters for Indian companies' earnings calls, made every results season. Each one starts with what the company actually makes or does, an inhaler for Cipla or a Splendor for Hero, and turns it into a single image, with the type kept quiet so the artwork carries the poster.",
    "It's where I explore visual ideas, one company at a time. Each poster goes up on X a day or two before the call.",
  ],
  x: 'https://x.com/dalalprints',
};

// The Juny Made page under Side projects (/side-projects/juny-made): how it
// started and how we work, then one piece followed from photo to finished
// embroidery (`steps`; an `image` per step once there is one, a tinted
// placeholder until then), a 2×2 gallery of finished pieces and the
// Instagram link. The About page keeps its own short `junymade` above.
export const junyMadePage = {
  paragraphs: [
    "Juny Made is an art studio I run with my partner. We're both into art, just different kinds, and she'd been doing embroidery on hoops for a while. Then we came across someone stitching on paper and wanted to try it. We loved how it felt, orders started coming in, we started a page, and slowly it grew into a studio.",
    'Most of what we make now is hand embroidery on photos. When someone sends us a photo, I work on the design: what we could create from it and how it should look. We shape the idea together, then print it, and she takes over. She picks the stitches and brings it to life by hand. Then we pack it up and send it off.',
  ],
  steps: [
    { title: 'The photo', caption: 'Where it starts: a photo someone sends us.' },
    { title: 'The design', caption: 'What we could make from it, worked out on screen.' },
    { title: 'The stitching', caption: 'Printed, then brought to life thread by thread.' },
    { title: 'The finished piece', caption: 'Packed up and on its way.' },
  ],
  gallery: [
    { src: '/images/side-projects/juny/1.webp', alt: 'A hand-embroidered photo by Juny Made' },
    { src: '/images/side-projects/juny/2.webp', alt: 'A hand-embroidered photo by Juny Made' },
    { src: '/images/side-projects/juny/3.webp', alt: 'A hand-embroidered photo by Juny Made' },
    { src: '/images/side-projects/juny/4.webp', alt: 'A hand-embroidered photo by Juny Made' },
  ],
  instagram: 'https://pin.it/3PKGQjN2Y',
};

// Tony Make Films (/film): why I make films, then
// the films so far (the ones from the old standalone /film page), each playing in place.
export const tonyMakeFilmsPage = {
  paragraphs: [
    "Tony Make Films is where I tell stories with a camera. It began with the films I was already making on my own: travel diaries, a live gig, a short introduction. Now I want to make them with more care for the story.",
    "I think telling a story well is one of the things AI still isn't good at. It's also the best way I've found to get an idea across and reach more people.",
    "So these films are slow and intentional. Each one starts as a script I record and listen to before I plan a single shot, and each has a character, and a bit of me, in it.",
  ],
  films: [
    { title: 'Personal introduction', caption: 'An animated introduction for my design portfolio.', src: '/hero_video.mp4', poster: '/side-projects/films/introduction.webp' },
    { title: 'A day trip to Yosemite', caption: 'A solo travel film, Yosemite through my lens.', src: '/images/film/Yosemite.mp4', poster: '/side-projects/films/yosemite.webp' },
    { title: 'You, me & Kodaikanal', caption: 'A video diary from Kodaikanal, made with my partner.', src: '/images/film/kodaikanal.mp4', poster: '/side-projects/films/kodaikanal.webp' },
    { title: 'Algorythm, live in Bengaluru', caption: "Algorythm's 2025 show at Phoenix Marketcity.", src: '/images/film/algorythm.mp4', poster: '/side-projects/films/algorythm.webp' },
  ],
  instagram: 'https://www.instagram.com/tony.make.films/',
};

// Home "Side projects" section: things I run or make outside work, beyond the
// Playground. Each row opens its `path` in the panel, with its logo
// (public/side-projects/logos/<slug>.webp) and `summary` below the name; `kind`
// is the details line on the page.
export const sideProjects = [
  {
    slug: 'dalal-prints',
    path: '/dalal-prints',
    title: 'Dalal Prints',
    kind: 'Posters',
    summary: 'Art posters for Indian earnings calls',
    description: 'Posters for Indian earnings calls. One company, one call, one artwork, every results season.',
  },
  {
    slug: 'tony-make-films',
    path: '/film',
    title: 'Tony Make Films',
    kind: 'Films',
    summary: 'Slow, personal films that tell a story',
    description: 'Slow, personal films, made to tell a story well.',
  },
  {
    slug: 'juny-made',
    path: '/juny-made',
    title: 'Juny Made Art Studio',
    kind: 'Art studio',
    summary: 'Embroidered gifts, made with my partner',
    description: 'Handmade embroidered gifts and creative projects, run with my partner.',
  },
];

export const photography = [
  {
    text: "I spend a lot of time behind the lens, chasing beautiful moments in nature, capturing dynamic movement, and exploring abstract forms. Follow me on Pexels.",
    links: [
      {
        text: "Pexels.",
        href: "https://pin.it/3PKGQjN2Y"
      }
    ]
  },
];

export const aboutConversation = {
  intro: "Here's a list of ideas to start a conversation between us:",
  topics: [
    "Send me a photo or video that you took.",
    "Tell me about your camera setup.",
    "Ask me about my art journey.",
    {
      text: "Just say \"Hi\"!",
      email: "tonyzebastian@gmail.com"
    }
  ]
};

// A little more about me, under my name on the home page. A paragraph is a
// list of text and links.
export const homeAbout = [
  [
    'Most recently I led design at ',
    { label: 'Sundial', href: '/sundial' },
    ' (acq. by Meta). Before that I spent three years designing for developers at ',
    { label: 'Postman', href: '/postman' },
    ', and earlier at ',
    { label: 'Hypersonix', href: '/hypersonix' },
    ' and ',
    { label: 'AVRL', href: '/avrl' },
    ', where I got my start in design.',
  ],
  [
    "My path here wasn't a straight line. I studied marketing and worked as a consultant at ",
    { label: 'Infosys', href: '/infosys' },
    ', spending my nights and weekends drawing and designing until the side thing became the main thing.',
  ],
  [
    "These days I'm into telling stories through film and visuals, the kind that make people feel something. And I always keep a side project or two going, just for fun.",
  ],
];

// The storybook in the hero: a cover, one spread per side of me, and an end
// spread. `word` is the big lettering across the spread; `motif` picks the
// placeholder drawing in book/Motifs.js. A painted scene instead has `image`
// (a 7:4 WebP spanning both pages, in public/book/) and `paragraphs`, drawn
// on its left page.
export const storybook = {
  // The leather cover: `lines` are stamped in gold foil, one under the other.
  cover: {
    title: 'A book about Tony',
    lines: ['A book', 'about', 'Tony'],
  },
  // The first spread, as in Figma: my logo on the inside of the cover, and
  // on the right a photo of me among my plants with a handwritten line under
  // it. `photo` is the hero picture on the home page, which the book opens
  // out of: the cover closes over it on hover, and the first page only shows
  // once the book opens.
  intro: {
    photo: '/book/tony.webp',
    // The same photo, small, for the 96px button on the home page (3x).
    thumb: '/book/tony-thumb.webp',
    logo: '/book/logo.svg',
    picture: '/book/garden.webp',
    // Line breaks as in the Figma.
    caption: 'This is a short book about where\nI come from, and the small things\nthat make me happy.',
    paper: '#f6f1e8',
    label: 'My logo, and a photo of me among plants. This is a short book about where I come from, and the small things that make me happy.',
  },
  chapters: [
    {
      // Scene one, painted: the words sit on the left page over the picture,
      // placed as in Figma (a 700-wide page; see `drawSpread`).
      id: 'house',
      title: 'The house on the mountain',
      image: '/book/scene-1.webp',
      paragraphs: [
        'I grew up in an old house on the side of a mountain, with trees all around and nobody else nearby.',
        'My parents were farmers. We had hens, cows, dogs and a cat.',
        'If you climbed up behind the house, you could see the next valleys.',
      ],
      paper: '#fffaf3',
      ink: '#363636',
    },
    {
      // Scene two: the words sit top right in the open sky, each paragraph
      // stepping further in, following the edge of the roof and the trees.
      id: 'rain',
      title: 'Rain',
      image: '/book/scene-2.webp',
      paragraphs: [
        "When it rained, the power usually went out. Even when it didn't, the lights and TV stayed off.",
        { text: 'So I watched: the noise on the roof, the water running past the house.', at: { x: 950, y: 186, width: 380 } },
        { text: "I think that's where I learned to notice things.", at: { x: 1060, y: 282, width: 290 } },
      ],
      text: { x: 860, y: 56, width: 420 },
      paper: '#fff9ea',
      ink: '#363636',
    },
    {
      // Scene three: the walk home. The words sit in the sky on the right
      // page beside the thought cloud, stepping in like scene two; the last
      // line answers the cloud.
      id: 'walk',
      title: 'The walk home',
      image: '/book/scene-3.webp',
      paragraphs: [
        'The school bus stopped on the other side of a hill. Up, down, and the same again on the way home.',
        { text: "Walking back, I'd guess what my mom had made for tea. Some days I hoped for a surprise. Once I dreamed it would be a computer.", at: { x: 850, y: 180, width: 310 } },
        { text: 'It never was.', at: { x: 850, y: 376, width: 300 } },
      ],
      text: { x: 820, y: 50, width: 430 },
      paper: '#ffffff',
      ink: '#363636',
    },
    {
      // Scene four: reading. The words sit in the open sky, the first top
      // left, the second lower on the right page, just above the boy's book.
      id: 'reading',
      title: 'Not the artistic one',
      image: '/book/scene-4.webp',
      paragraphs: [
        'My brother was the artistic one. I was the kid doodling on his chappals when class got boring.',
        { text: 'What I loved was reading. When the last Harry Potter came out, I had it for one weekend, and I finished it.', at: { x: 780, y: 190, width: 360 } },
      ],
      text: { x: 110, y: 80, width: 420 },
      paper: '#ffffff',
      ink: '#363636',
    },
    {
      // Scene five: the computer at last, with a car picture mid-edit. The
      // words run down the open wall on the left: a narrow column beside the
      // doorway, then wider below it.
      id: 'computer',
      title: "The computer I didn't need",
      image: '/book/scene-5.webp',
      paragraphs: [
        "Years later, I convinced my parents I needed a computer for school. I didn't, really.",
        'Mostly I played games on it, and watched every action film I could borrow from friends.',
        { text: "Then one day in the computer lab, a friend opened Photoshop and started changing a picture of a car. I couldn't stop watching.", at: { x: 90, y: 380, width: 420 } },
        'Soon I had my own copy, and I was taking pictures apart.',
      ],
      text: { x: 90, y: 70, width: 270 },
      paper: '#ffffff',
      ink: '#363636',
    },
    {
      // Scene six: college and the empty hostel, on the college gate picture,
      // mirrored so the gate sits on the left page. The words run down the
      // open sky on the right, stepping in after the first paragraph to clear
      // the last pillar.
      id: 'hostel',
      title: 'Design kept finding me',
      image: '/book/scene-6.webp',
      paragraphs: [
        'Engineering never pulled me in, so I studied business, far from home. But design kept finding me: posters, videos, design files downloaded at computer cafés.',
        { text: 'One summer I stayed behind in an empty hostel, and out of boredom I started doodling. The doodles kept growing.', at: { x: 935, y: 202, width: 400 } },
        'That was when I really started to draw.',
      ],
      text: { x: 870, y: 50, width: 460 },
      paper: '#fffbef',
      ink: '#363636',
    },
  ],
  end: {
    word: 'To be continued',
    body: 'Consistency beats talent, and side projects keep the passion alive.',
    intro: bio.intro,
    link: { label: 'More about me', href: '/about' },
  },
};
