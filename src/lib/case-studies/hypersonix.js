export const hypersonixData = {
  // Page-level configuration
  page: {
    title: "Summary of my experience at Hypersonix AI",
    description: "At Hypersonix, I led product design alongside the Head of Design, driving 0 to 1 explorations, scaling the design system, and improving core product experiences.",
    role: "Lead Product Designer",
    duration: "Oct'20 - May'22",
    company: "Hypersonix AI",
    logo: "/icons/hypersonix.png",
  },


  projects: [
    {
      title: "Documents 2.0",
      sections: [
        {
          description: "Documents is a product that helps users to create, compare, save and share analytical reports from our core products. Reports can also be created using a search on connected data sources. the current document feature had a lot of issues."
        },
        {
          heading: "Problem",
          bulletPoints: [
            "Unoptimized screen space: Only 60% allocated to data.",
            "No card restructuring/grouping: Limited flexibility for comparison and decision-making.", 
            "Friction in adding cards: Option was hard to find, and new cards started empty."
          ]
        },
        {
          heading: "Solution",
          bulletPoints: [
            "Consolidated card controls into a single, consistent location.",
            "Introduced Outline (a table-of-contents-like view) to group, reorder, and manage cards.", 
            "Designed Quick Add for inline card creation, making it easier to add new or existing cards.",
            "Enabled structured layouts and tab groups for easier comparison of data."
          ],
          images: [
            "/images/projects/hypersonix/hx_doc_03.mp4",
            "/images/projects/hypersonix/hx_doc_04.mp4",
            "/images/projects/hypersonix/hx_doc_05_1.mp4",
            "/images/projects/hypersonix/hx_doc_08_1.mp4"
          ]
        },
        {
          heading: "Impact",
          bulletPoints: [
            "12% increase in MAU.",
            "Average time spent on documents increased by 8 minutes.",
            "Task success rate for card creation & grouping rose to 20%."
          ]
        }
      ]
    },
    {
      title: "New Onboarding Experience",
      sections: [
        {
          description: "Onboarding is the gateway to the product. It sets the tone for how users perceive, engage with, and ultimately adopt it. At Hypersonix, we needed a flow that not only welcomed users but also quickly conveyed the platform's value."
        },
        {
          heading: "Problem",
          bulletPoints: [
            "Onboarding was mechanical, tiring, and lacked a sense of progress.",
            "Poor hierarchy of inputs made the flow confusing.",
            "New users were unaware of features or how to use them effectively."
          ]
        },
        {
          heading: "Solution",
          bulletPoints: [
            "Introduced selection-based reflection as the core concept.",
            "User inputs generated a live preview at each step.", 
            "Provided instant feedback while training users on the final experience."
          ],
          images: [
            "/images/projects/hypersonix/hx_onboard_01.mp4",
            "/images/projects/hypersonix/hx_onboard_02_1.mp4"
          ]
        },
        {
          heading: "Impact",
          bulletPoints: [
            "10% increase in feature awareness, validated through in-app surveys.",
            "23% reduction in people skipping the onboarding."
          ]
        }
      ]
    },
    {
      title: "Sonic Design System",
      sections: [
        {
          description: "As Hypersonix scaled, inconsistent designs and inefficient handoffs slowed delivery. We needed a unified system to align design and engineering."
        },
        {
          heading: "Problem",
          bulletPoints: [
            "Inconsistencies between Figma and code led to redundant component builds.",
            "Developers faced rework and inefficiency without standardized, reusable components."
          ]
        },
        {
          heading: "Solution",
          bulletPoints: [
            "Built Sonic, a Figma-based single source of truth with foundations, components, tokens, and docs.",
            "Structured Figma for easy discoverability with thumbnails, statuses, and versioning.", 
            "Started code implementation to align tokens and components in the product."
          ],
          images: [
            "/images/projects/hypersonix/hx_sonic_01.jpg",
            "/images/projects/hypersonix/hx_sonic_02.jpg",
            "/images/projects/hypersonix/hx_sonic_03.jpg",
            "/images/projects/hypersonix/hx_sonic_04.jpg"
          ]
        },
        {
          heading: "Impact",
          bulletPoints: [
            "Improved consistency and efficiency across teams.",
            "Reduced duplicate work and sped up delivery.",
            "Established a scalable foundation for product growth."
          ]
        }
      ]
    },
    {
      title: "Interaction Designs",
      sections: [
        {
          description: "As a data analytics company, our challenge was to make complex data intuitive and easy to consume. This meant experimenting with new interaction patterns, visual representations, and product concepts—some of which I'm sharing here."
        },
        {
          heading: "No Code App studio",
          description: "This 0 to 1 exploration reimagined how customers could customize Hypersonix's analytical platform without heavy manual effort. Instead of relying on deployment teams for bespoke setups, we designed a self-serve studio with drag-and-drop modules and configuration options, enabling customers to adjust inputs, processes, and analysis directly. This simplified experimentation, reduced internal tech debt, and early prototypes with clients like KFC, Home Depot, and Snowflake showed strong interest.",
          images: [
            "/images/projects/hypersonix/hx_nocode_03.mp4",
            "/images/projects/hypersonix/hx_nocode_02.mp4"
          ]
        },
        {
          heading: "Hawkeye",
          description: "We envisioned a new insights platform designed to surface information in small, digestible bits that users could quickly act on. Instead of overwhelming them with dashboards full of metrics, the platform presented bite-sized insights upfront, each serving as an entry point. From there, users could drill down into details, explore causes, and uncover deeper patterns. The experience was structured into different sections, each tailored to a specific type of insight, supported by diverse visualizations that made complex data intuitive and engaging.",
          images: [
            "/images/projects/hypersonix/hx_hawk_01.mp4",
            "/images/projects/hx_hawk.mp4"
          ]
        }
      ]
    }
  ]
}