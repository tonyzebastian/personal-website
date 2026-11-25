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
      "At Postman, I worked on an API platform with a large developer audience and an established design team. I joined through a friend's referral, wanting to learn from more designers and understand how to design at that scale.",
      "That scale changed how I thought about everyday decisions. A small change to some text or the placement of a dropdown could affect workflows people already depended on. I learned to work through those implications with product managers, engineers, and other designers, and to get people aligned around a change.",
      "My work included API observability and Live Collections, exploring how collections could stay connected to what was happening in running services. I spent some time in the design system team too, working on consistency and contributing a few PRs as I began learning to code. Later, in Growth, I worked on trial experiences: helping teams discover premium features, understand what they were using, and decide whether a paid plan made sense for them.",
      "Being part of a larger design team gave me more ways of looking at a problem. We shared explorations and taught each other things beyond our immediate projects. I ran sessions on video editing, visual design, and photography, and made good friends along the way. The company trip to Barcelona for Postman's tenth anniversary is another memory I keep from that time.",
    ],
    items: [
      {
        title: "New Trial Experiences",
        description: "Designed new trial experiences that improved user awareness by 27% and conversion by 5%.",
        images: ["/images/projects/trial_01.png", "/images/projects/trial_02.mp4"],
        link: "/project/newtrialexp",
      },
      {
        title: "Live Collections",
        description: "A 0 to 1 project that brought API observability into Postman, letting users monitor their collections in real time.",
        images: ["/images/projects/live_collections_1.png", "/images/projects/live_collections_2.png"],
        link: "/project/api-observability",
      },
      {
        title: "Mini Projects",
        description: "Smaller but impactful improvements: environment management, secret fields and app loading interactions.",
        images: ["/images/projects/mini_project_02.mp4", "/images/projects/mini_proj_01.png"],
        link: "/project/miniprojects",
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
      "Hypersonix was where I moved into a full product design role. It was a data analytics company working mainly with retail businesses, helping people explore their business data and get useful answers from it. I joined a small design team and worked closely with product managers and engineers.",
      "Much of the work was about making complex data easier to work with. I redesigned parts of Documents, where people created and compared analytical reports. That included bringing card controls together and making it easier to organize reports. I also worked on onboarding, where a preview showed people how their choices would shape the insights they received.",
      "There was room to explore new ideas too. I worked on voice interactions for the analytics assistant and a no-code App Studio concept that let customers customize analytical applications through connected modules. Alongside that, I helped build Sonic, our first design system, so the team could work with more consistent components and guidelines.",
      "I began taking on more responsibility for the team. I hired two designers, mentored them, and helped them grow in their roles. The work was fluid enough that conversations could move from a product flow to what we should explain on the website or how we should market it.",
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
    link: 'https://www.linkedin.com/company/advanced-voice-research-labs/',
    image: '/icons/avrl.webp',
    period: "Jan'19 - Oct'20",
    description: "My first job as a designer. In late 2018 I made the switch from business analysis to design and joined AVRL (Advanced Voice Research Labs) as a Visual Designer. The role was fully remote, so I moved back to my hometown, Thodupuzha, and worked from there.",
    // Overview shown on the company page (from the 2026-11-03 drafts in the wiki).
    overview: [
      "AVRL was where I changed careers, moving from consulting into visual design. It felt like a big bet. Design wasn't what I had studied in college, and I was taking on work I had been teaching myself to do. Freelance projects helped me build a portfolio, and a contract with AVRL became my way into the profession.",
      "AVRL was a small US-based company, and I worked remotely from India. My early work included presentation decks and storyboards explaining the product. I also made one of my first explainer videos in After Effects. I enjoyed having different things to make and figuring out how to explain what the company was building.",
      { youtube: 'u88Qmw-XpeI', title: 'AVRL explainer video' },
      "The product started as a voice assistant for inventory management. Someone checking stock could say what was left, and the system would update it. I designed interfaces for that experience and later worked on the company's move towards fleet management. Alongside AVRL, I continued taking on other freelance projects.",
      "Working on those interfaces helped me understand what UX and product designers did. I became more interested in how a product behaved and the workflows behind it. I wanted to learn more about users and work more closely with the people building the product.",
      "One memory I still carry from AVRL is our company trip to Bali. It was my first international trip.",
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
      "My first job started at Infosys, and the Mysore campus felt a lot like going back to college. I had studied marketing and systems, and joined the team responsible for the company's internal applications.",
      "I worked on asset management, in a role that was closer to a product owner. The system tracked everything from laptops and software to vehicles and buildings. Behind something as ordinary as assigning a laptop were purchase records, approvals, and several departments that needed the same information. I worked with the team on bringing three separate systems into a more connected asset management platform.",
      "It was my first experience of working on a product with that many moving parts. Understanding the workflows meant understanding the people and departments behind them, including where the software had stopped matching how they actually worked.",
      "I was also interested in design. I knew Photoshop, liked visual work, and had imagined doing something around branding or marketing. Towards the end of my time at Infosys, I started learning Figma and taking on freelance design work to see where it could go.",
    ],
    related: [{ title: 'Reviving a legacy system at Infosys', href: '/musings/infosys_legacy' }],
    timeline: false,
    items: [],
  },
];

// Home list of musings. `excerpt` is the opening of each piece, shown as the
// page on its carousel card (it fades out, so a couple of paragraphs is plenty).
export const musings = [
  {
    name: 'Reduce perceived wait times through visual delight',
    date: 'May 2024',
    link: '/musings/perceived_wait',
    excerpt: [
      "Staring at a blank screen as an app slowly loads is a surefire way to lose user attention. Whether it's loading a webpage or launching an app, users expect speed and efficiency.",
      'This is where visual delight comes into play. It is not just about aesthetics; it is about creating a memorable, engaging experience that captivates attention, reduces perceived wait times and leaves a lasting impression.',
    ],
  },
  {
    name: 'Mnemonic Signages',
    date: 'Jan 2024',
    link: '/musings/mnemonic_signages',
    excerpt: [
      'I used to have difficulty remembering where I parked my car in large parking lots. To solve this, I began taking pictures of the pillar near where I parked.',
      'Recently, while photographing a pillar, I noticed an interesting pattern where illustrations are displayed next to the alphabet. These are known as mnemonic signages.',
    ],
  },
  {
    name: '365 days of drawing - Some learnings',
    date: 'Jun 2021',
    link: '/musings/days_drawing',
    excerpt: [
      'On 2nd May 2020, I decided to start a new project: draw something every day for a year. 365 days later, I completed it, and these are some of my learnings and realizations.',
      "As expected, my drawing skills levelled up. Compared with last year's drawings, there is a massive improvement in colour usage and overall line quality.",
    ],
  },
  {
    name: '15 Months of remote work: A Recap',
    date: 'Nov 2020',
    link: '/musings/remote_work',
    excerpt: [
      "It wasn't a deliberate choice to go remote. Back in late 2018, I was looking to switch from being a senior business analyst at Infosys to trying my luck in the design field.",
      'A friend had been working remotely for about a year and seemed to be thriving, working from their hometown with occasional travel. That inspired me to explore remote jobs.',
    ],
  },
  {
    name: 'Reviving a legacy system at Infosys',
    date: 'Nov 2018',
    link: '/musings/infosys_legacy',
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
    ' (acq. by Meta), where more and more of my work happened directly in code. Before that I spent three years designing for developers at ',
    { label: 'Postman', href: '/postman' },
    '.',
  ],
  [
    'I started at ',
    { label: 'Infosys', href: '/infosys' },
    " after a master's in marketing, taught myself design, then worked at ",
    { label: 'AVRL', href: '/avrl' },
    ' and ',
    { label: 'Hypersonix', href: '/hypersonix' },
    '. Outside work I draw, film and keep a side project or two going.',
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
      id: 'illustrator',
      kicker: 'The',
      word: 'Illustrator',
      title: 'The Illustrator',
      body: 'An illustrator at heart. In 2022 I drew something every single day for 365 days.',
      motif: 'illustrator',
      paper: '#f5d9c6',
      ink: '#5a3322',
      accent: '#e6a17c',
    },
    {
      id: 'cinematographer',
      kicker: 'The',
      word: 'Lens',
      title: 'Behind the Lens',
      body: 'Chasing light in nature, movement and abstract forms. Someday, a cinematographer.',
      motif: 'cinematographer',
      paper: '#26323f',
      ink: '#f3ead9',
      accent: '#e7b75f',
    },
    {
      id: 'maker',
      kicker: 'The',
      word: 'Maker',
      title: 'The Maker',
      body: 'Juny Made is the art studio I run with my partner: handmade, embroidered gifts, one stitch at a time.',
      motif: 'maker',
      paper: '#f2d5da',
      ink: '#5b2734',
      accent: '#d98a9a',
    },
    {
      id: 'runner',
      kicker: 'The',
      word: 'Runner',
      title: 'The Runner',
      body: 'Picked up running in 2025. A half marathon is next, because it is never too late to start something new.',
      motif: 'runner',
      paper: '#f3e3b3',
      ink: '#4d3d14',
      accent: '#d9b44a',
    },
  ],
  end: {
    word: 'To be continued',
    body: 'Consistency beats talent, and side projects keep the passion alive.',
    intro: bio.intro,
    link: { label: 'More about me', href: '/about' },
  },
};
