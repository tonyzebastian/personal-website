export const newTrialData = {
  // Page-level configuration
  page: {
    title: "New Trial Experiences",
    description: "As part of Postman's Growth team, I led the redesign of trial experiences to make them more timely, contextual, and value-driven. Teams previously discovered trials too late, onboarding felt disruptive, and communication didn't clearly show value or next steps. I worked on reimagining the first-time experience with earlier trial triggers and a cleaner introduction, while also improving in-app and end-state communication to connect usage with ROI and guide teams toward the right plan.",
    role: "Lead Product Designer", 
    duration: "3 months",
    company: "Postman",
    logo: "/icons/postman.png",
  },

  // Projects data
  projects: [
    {
      title: "Power Pass FTUX & Trial Triggers",
      sections: [
        {
          description: "Power Pass is Postman's all-access trial, giving teams unlimited access to premium collaboration features like team growth, team workspaces, unlimited collections etc. This project focused on how the trial is introduced and triggered, ensuring that users encounter it at the right moments in their journey."
        },
        {
          heading: "Previous experience",
          description: "Previously, trial entry points were limited, users could only start a trial from the members page when inviting a fourth person, or directly from the invite modal. This meant there were very few touch points where teams naturally discovered trials. Once a trial began, the introduction was generic, offering little clarity about what premium features were included or what would happen once the trial ended.",
          images: [
            "/images/projects/newtrials/trial_pj1_01.png",
            "/images/projects/newtrials/trial_pj1_02.png"
          ],
          cards: [
            {
              title: "Late exposure",
              description: "Most teams were entering trials >1 year after creation, too late to change free-plan habits."
            },
            {
              title: "Unclear value", 
              description: "The generic onboarding didn't highlight collaboration benefits like unlimited invites or team workspaces."
            },
            {
              title: "No end clarity",
              description: "Users were often confused about what would happen when the trial expired, leading to hesitation in upgrading."
            },
            {
              title: "Admin-only access",
              description: "Only team admins could start a trial, blocking other motivated members from trying premium features."
            }
          ]
        },
        {
          heading: "Solution",
          subsections: [
            {
              title: "New Trial triggers",
              description: "Auto trial trigger when a free team expands from 3 to 4 members. Opt-in trigger when a team size is more than 2 (Multi user team) . Signup-based triggers for new teams and trial triggers at pricing page.",
              images: ["/images/projects/newtrials/trial_pj1_03.png"]
            },
            {
              title: "FTUX with delight",
              description: "Introduced a delightful, memorable FTUX that captured users attention, highlighted the value of what they were getting, and helped them retain this information clearly.",
              images: [
                "/images/Craft/powerpass.mp4",
                "/images/projects/newtrials/trial_pj1_05.png"
              ]
            }
          ]
        },
        {
          heading: "Impact (3 months)",
          bulletPoints: [
            "71% completion of Power Pass FTUX modals vs. 44% in Basic trial.",
            "+6% larger average team size within one month of introducing the new trial experience.",
            "Awareness doubled: Post-launch surveys showed PPP awareness rising from 22% to 42%."
          ]
        },
      ]
    },

    {
      title: "In-App & Trial End-State Communication",
      sections: [
        {
          description: "This project focused on strengthening in-app and end-state communication for trials, making them more visual, contextual, and tied to actual usage so teams clearly understood the value of their trial and were guided toward the right plan with confidence."
        },
        {
          heading: "Previous experience",
          description: "Previously, trial entry points were limited, users could only start a trial from the members page when inviting a fourth person, or directly from the invite modal. This meant there were very few touch points where teams naturally discovered trials. Once a trial began, the introduction was generic, offering little clarity about what premium features were included or what would happen once the trial ended.",
          images: [
            "/images/projects/newtrials/trial_pj2_01.png", 
            "/images/projects/newtrials/trial_pj2_02.png"
          ],
          cards: [
            {
              title: "Unclear end state",
              description: "Users didn't know what would happen when the trial expired."
            },
            {
              title: "No usage feedback", 
              description: "Teams weren't shown what features they had actually used, making it hard to connect trial experience to ROI."
            },
            {
              title: "Missing value communication",
              description: "Trial value was communicated mostly through text-heavy banners or emails, lacking engaging, product-driven storytelling"
            },
            {
              title: "Weak urgency",
              description: "With no clear trial end-state or countdown, users delayed upgrade decisions and sales conversations"
            }
          ]
        },
        {
          heading: "Solution",
          subsections: [
            {
              title: "Richer in-app communication",
              description: "Designed trial communication to highlight key premium features used by the team with more visual cues.",
              images: ["/images/projects/newtrials/trial_pj2_03.png"]
            },
            {
              title: "Focused end state",
              description: "End-state modal now surface what the team has used so far what they will loose and recommend the right plan tier accordingly.",
              images: ["/images/projects/newtrials/trial_pj2_04.png"]
            },
            {
              title: "Structured countdown flow",
              description: "Introduced banners, nav countdowns, and timed emails to create urgency as the trial nears its end (blue info → yellow warning → access blocked until downgrade/upgrade)",
              images: ["/images/projects/newtrials/trial_pj2_05.png"]
            }
          ]
        },
        {
          heading: "Impact (3 months)",
          bulletPoints: [
            "+10% increase in users moving from end-state modal to the pricing page within a month.",
            "+1.5% lift in trial-to-paid conversions.",
            "Estimated $2M in additional conversion potential over the next few quarters."
          ]
        },
      ]
    }
  ]
}