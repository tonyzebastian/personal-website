export const postminidata = {
  // Page-level configuration
  page: {
    title: "Mini Projects",
    description: "A collection of mini projects I worked on during my time at Postman that made a huge impact.",
    role: "Lead Product Designer",
    company: "Postman",
    logo: "/icons/postman.webp",
  },

  // Projects data
  projects: [
    {
      title: "Improving Environment usage experience",
      sections: [
        {
          description: "Environments are critical for making collections usable, but the current experience often caused confusion, errors, and delays. This project focused on simplifying that experience and making environments more seamlessly connected to collections."
        },
        {
          heading: "Previous experience",
          description: "Environments are a core part of Postman, used daily by millions of developers and teams. They're often the first step in making a collection usable for others, acting as the bridge between setup and successful execution. There were some obvious gaps in the current experience.",
          images: ["/images/projects/miniprojects/mini_pin_env_01.png"],
          cards: [
            {
              title: "Which environment to choose?",
              description: "Consumers were often unsure which environment to use with a collection. Producers left clues in docs, but they were easily missed, delaying the first successful request."
            },
            {
              title: "Forking gaps", 
              description: "When forking public collections or those from another workspace, the associated environment wasn't automatically suggested or included. Users had to backtrack, read docs, wasting time."
            },
            {
              title: "Downstream breaks",
              description: "Flows like creating mock servers, monitors or moving collections to a different workspace often failed because environments weren't correctly linked."
            },
            {
              title: "Other usability issues",
              description: "Environment dropdown was the main place users interact with environment. There was no option create environment from there, which is a lost opportunity."
            }
          ]
        },
        {
          heading: "Solution",
          subsections: [
            {
              title: "Pinned environments",
              description: "Producers can now pin one or more environments to a collection and set a default, so consumers rarely need to select one before sending requests.",
              images: ["/images/projects/miniprojects/mini_pin_02.mp4"]
            },
            {
              title: "Integrated dropdown",
              description: "Producers and consumers can quickly create search and open the full view of environments",
              images: ["/images/projects/miniprojects/mini_pin_03.mp4"]
            },
            {
              title: "Tighter downstream integration",
              description: "Pinned environments now flow seamlessly into forking, mocks, and other related actions.",
              images: ["/images/projects/miniprojects/mini_pin_04.mp4"]
            }
          ]
        },
        {
          heading: "Impact (3 months)",
          bulletPoints: [
            "28% reduction in unresolved variable errors for forks of public collections.",
            "56k Pinned Environments.",
            "2.4% faster time to first successful request."
          ]
        }
      ]
    }
  ]
}