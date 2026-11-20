export const postobvdata = {
  // Page-level configuration
  page: {
    title: "Live Collections: First observability feature in Postman",
    description: "This 0 to 1 project introduced observability in Postman through Live Collections. Instead of treating observability as a separate monitoring tool, we built it directly into Postman's most-used feature: collections. Live Collections turned static collections into living entities that stayed in sync with real API traffic, bridging the gap between design, testing, and production.",
    role: "Lead Product Designer", 
    duration: "8 months",
    company: "Postman",
    logo: "/icons/postman.webp",
  },

  // Projects data
  projects: [
    {
      sections: [
        {
          heading: "Postman's Strategy",
          description: "Postman's broader goal was to become the single platform for the entire API lifecycle, from design and testing to deployment and monitoring. Instead of creating a standalone observability product, the goal is to extended Postman's existing workflows.",
          images: [
            "/images/projects/observe/observe_01.png", 
            "/images/projects/observe/observe_00.png"
          ]
        },
        {
          heading: "Problem Space",
          description: "Once APIs were deployed, they often drifted away from the specs and collections teams originally worked with. Documentation quickly went stale, duplicate services were built unknowingly, and there was little clarity on which endpoints were in use or safe to retire.",
          cards: [
            {
              title: "Producers",
              description: "They struggled with outdated specs, duplicate builds, and no visibility into active or unused endpoints."
            },
            {
              title: "Governance Leads", 
              description: "Lacked a reliable source of truth, making compliance and lifecycle management impossible."
            }
          ]
        },
        {
          heading: "Solution",
          subsections: [
            {
              title: "MVP with New Relic integration",
              description: "Auto-imported live traffic data to generate/update specs and surface undocumented or unused endpoints.",
              images: [
                "/images/projects/observe/observe_04.png", 
                "/images/projects/observe/observe_08.mp4"
              ]
            },
            {
              title: "Live Collections (core pivot)",
              description: "Instrumenting services with Postman's SDK and linking them with collections, kept them continuously in sync with production and enriched with live traffic data.",
              images: [
                "/images/projects/live_collections_1.png", 
                "/images/projects/observe/observe_02.png", 
                "/images/projects/observe/observe_03.png", 
                "/images/projects/observe/observe_07.mp4"
              ]
            },
            {
              title: "Beta Insights",
              description: "Introduced basic dashboards for latency, error rate, and error details per endpoint.",
              images: [
                "/images/projects/observe/observe_06.png", 
                "/images/projects/observe/observe_09.png"
              ]
            }
          ]
        },
        {
          heading: "Impact (3 months)",
          bulletPoints: [
            "Detected 100% of unused and undocumented endpoints during early pilots.",
            "Achieved 65% internal adoption and 25 external Live Collections.", 
            "Early users gave strong positive feedback, validating the approach and shaping next iterations."
          ]
        }
      ]
    }
  ]
}