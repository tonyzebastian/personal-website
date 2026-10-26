import MasonryGrid from "@/components/ui/MasonryGrid";

// Static craft items data - moved outside component for better performance
const CRAFT_ITEMS = [
  {
    src: '../images/Craft/slate_config.mp4',
    alt: 'A car configuration',
    description: 'A sophisticated search and command interface design showcasing seamless user interaction and real-time feedback.',
    projectLink: 'https://www.uiglow.click/experiences/slate_cars',
  },
  {
    src: '../images/Craft/fish.gif',
    alt: 'A School of fish',
    description: 'An interactive school of fish with realistic movements.',
    projectLink: 'https://www.uiglow.click/experiences/fish',
  },
  {
    src: '../images/Craft/powerpass.mp4',
    alt: 'Power Pass',
    description: 'Innovative animation for a power user feature, demonstrating smooth transitions and intuitive user feedback.',
    projectLink: null
  },
  {
    src: '../images/Craft/comet.mp4',
    alt: 'Comet Browser Dowload Animation',
    description: 'Custom loading animation designed for Postman, balancing functionality with brand identity.',
    projectLink: 'https://www.uiglow.click/svg-animations/comethero',
  },
  {
    src: '../images/Craft/6.gif',
    alt: 'Postman Loading',
    description: 'Custom loading animation designed for Postman, balancing functionality with brand identity.',
    projectLink: 'https://www.tonyzeb.com/musings/perceived_wait'
  },
  {
    src: '../images/Craft/image_sphere.mp4',
    alt: 'Image Stack',
    description: 'A React Typescript component that displays images arranged in a 3D sphere layout. Images are distributed using Fibonacci sphere distribution for optimal coverage. Supports drag to rotate, momentum physics, auto-rotation, and modal image viewing',
    projectLink: 'https://21st.dev/community/components/tonyzebastian/image-sphere/default',
    specialStyling: true
  },
  {
    src: '../images/Craft/image_stack.mp4',
    alt: 'Image Stack',
    description: 'An Interactive image stack component that displays images in a fanned out card layout with smooth drag-to-cycle functionality. Built with React, Motion, and Next.js image optimisation',
    projectLink: 'https://21st.dev/community/components/tonyzebastian/image-stack/default',
    specialStyling: true
  },
  {
    src: '../images/Craft/chart_timeline.mp4',
    alt: 'Graph Interaction',
    description: 'Dynamic data visualization showing interactive graph manipulation with smooth animations and state transitions.',
    projectLink: null
  },
  {
    src: '../images/Craft/Runner.mp4',
    alt: 'Runner Onboarding',
    description: 'Engaging onboarding experience animation that guides users through features while maintaining visual interest.',
    projectLink: null,
    specialStyling: true
  }
];

export default function Crafts() {

  return (
    <div className="mb-24">
      <MasonryGrid items={CRAFT_ITEMS} />
    </div>
  );
}