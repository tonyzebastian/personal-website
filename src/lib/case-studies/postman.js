export const postmanData = {
  // Page-level configuration
  page: {
    title: "Summary of my experience at Postman",
    description: "At Postman, I worked as a Senior Product Designer focusing on improving trial experiences, building new observability features, and enhancing core product interactions.",
    role: "Senior Product Designer",
    duration: "Jun'22 - Jun'25",
    company: "Postman",
    logo: "/icons/postman.png",
  },

  projects: [
    {
      title: "New Trial Experiences",
      link: "/project/newtrialexp",
      sections: [
        {
          description: "Designed and implemented new trial experiences that significantly improved user awareness and conversion rates.",
          images: ["/images/projects/trial_01.png", "/images/projects/trial_02.mp4"]
        },
        {
          heading: "Impact",
          bulletPoints: [
            "Increased awareness by 27%.",
            "Improved conversion rate by 5%."
          ]
        }
      ]
    },
    {
      title: "Live Collections",
      link: "/project/api-observability",
      sections: [
        {
          description: "A 0 to 1 project that introduced observability capabilities in Postman, enabling users to monitor and track their API collections in real-time.",
          images: ["/images/projects/live_collections_1.png", "/images/projects/live_collections_2.png"]
        }
      ]
    },
    {
      title: "Mini Projects",
      link: "/project/miniprojects",
      sections: [
        {
          description: "A collection of smaller but impactful projects that enhanced the user experience across different parts of the product.",
          images: ["/images/projects/mini_project_02.mp4", "/images/projects/mini_proj_01.png"]
        },
        {
          heading: "Key Features",
          bulletPoints: [
            "Environment Experience - Improved environment management workflow.",
            "Secret Field - Enhanced security for sensitive data.",
            "App Loading Interaction - Created delightful loading states."
          ]
        }
      ]
    }
  ]
}
