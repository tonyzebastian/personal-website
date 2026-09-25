'use client'

import Image from 'next/image';
import { useState, useCallback, useEffect, memo, useMemo, Suspense } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import MediaItem, { isVideo } from '@/components/ui/MediaItem';

const MediaOverlay = memo(({ selectedItem, onClose }) => {
  if (!selectedItem) return null;

  return (
    <div
      className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl p-4 max-w-fit max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 p-2 hover:bg-slate-400 bg-slate-300 rounded-full transition-colors z-10"
          onClick={onClose}
        >
          <X size={20} className="text-slate-900" />
        </button>

        <div className="flex justify-center items-center">
          {isVideo(selectedItem.src) ? (
            <video
              src={selectedItem.src}
              className="rounded-xl max-w-[80vw] max-h-[70vh] w-auto h-auto"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={selectedItem.src}
              alt={selectedItem.alt}
              className="rounded-xl max-w-[80vw] max-h-[80vh] w-auto h-auto object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
});
MediaOverlay.displayName = 'MediaOverlay';

// ============================================================================
// DIALOG WRAPPER
// ============================================================================

const DialogWrapper = memo(({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      const handleEsc = (e) => {
        if (e.key === 'Escape') onClose();
      };

      window.addEventListener('keydown', handleEsc);

      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
        >
          <X size={20} className="text-slate-900" />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
});
DialogWrapper.displayName = 'DialogWrapper';

// ============================================================================
// HEADER COMPONENTS
// ============================================================================

const ProjectDetails = memo(({ pageData }) => {
  if (!(pageData.role || pageData.duration || pageData.company)) {
    return null;
  }

  return (
    <div className="text-sm text-slate-800 font-medium tracking-wider flex items-center gap-3">
      {pageData.company && (
        <>
          <div className="flex items-center gap-2">
            {pageData.logo && (
              <Image
                src={pageData.logo}
                alt={pageData.company}
                width={18}
                height={18}
                className="object-contain"
              />
            )}
            <span>{pageData.company}</span>
          </div>
          {(pageData.role || pageData.duration) && <span>|</span>}
        </>
      )}
      {pageData.role && (
        <>
          <span>{pageData.role}</span>
          {pageData.duration && <span>|</span>}
        </>
      )}
      {pageData.duration && <span>{pageData.duration}</span>}
    </div>
  );
});
ProjectDetails.displayName = 'ProjectDetails';

const PageHeader = memo(({ pageData }) => (
  <header className="mb-8">
    <div className="mb-6">
      <h1 className="text-4xl font-serif font-medium text-slate-900 mb-3">
        {pageData.title}
      </h1>
      <ProjectDetails pageData={pageData} />
    </div>
  </header>
));
PageHeader.displayName = 'PageHeader';

const PageDescription = memo(({ description }) => {
  if (!description) return null;

  return (
    <section className="mb-12">
      <p className="text-slate-900 text-sm leading-relaxed">
        {description}
      </p>
    </section>
  );
});
PageDescription.displayName = 'PageDescription';

// ============================================================================
// PROJECT SECTION COMPONENTS
// ============================================================================

const BulletPoints = memo(({ items }) => (
  <ul className="text-slate-900 mb-8 text-sm leading-relaxed space-y-2">
    {items.map((item, index) => (
      <li key={index} className="flex items-start">
        <span className="w-1 h-1 bg-slate-500 rounded-full mt-3 mr-2 flex-shrink-0" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
));
BulletPoints.displayName = 'BulletPoints';

const ImageGrid = memo(({ images, onImageClick, altPrefix }) => {
  const isMultipleImages = images.length > 1;
  const gridClass = useMemo(
    () => isMultipleImages ? 'grid-cols-1 md:grid-cols-2 gap-4' : 'grid-cols-1',
    [isMultipleImages]
  );

  return (
    <div className="mb-8">
      <div className={`grid ${gridClass}`}>
        {images.map((image, index) => (
          <div
            key={index}
            className="relative rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => onImageClick(image, `${altPrefix} illustration ${index + 1}`)}
          >
            <MediaItem
              src={image}
              alt={`${altPrefix} illustration ${index + 1}`}
              width={isMultipleImages ? 400 : 800}
              height={isMultipleImages ? 300 : 400}
            />
          </div>
        ))}
      </div>
    </div>
  );
});
ImageGrid.displayName = 'ImageGrid';

const CardGrid = memo(({ cards }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {cards.map((card, index) => (
      <div key={index} className="bg-slate-50 p-6 rounded-xl">
        <h4 className="font-medium text-slate-900 mb-3">{card.title}</h4>
        <p className="text-slate-700 text-sm leading-relaxed">{card.description}</p>
      </div>
    ))}
  </div>
));
CardGrid.displayName = 'CardGrid';

const SubsectionsList = memo(({ subsections, onImageClick }) => (
  <div className="space-y-12">
    {subsections.map((subsection, index) => {
      const mediaItems = subsection.images || (subsection.media ? [subsection.media] : []);

      return (
        <div key={index} className="mb-12">
          <h4 className="font-medium text-slate-900 text-base">{subsection.title}</h4>
          <p className="text-slate-700 leading-relaxed mb-4">{subsection.description}</p>

          {mediaItems.length > 0 && (
            <ImageGrid
              images={mediaItems}
              onImageClick={onImageClick}
              altPrefix={subsection.title}
            />
          )}
        </div>
      );
    })}
  </div>
));
SubsectionsList.displayName = 'SubsectionsList';

const SectionLayout = ({ section }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  const openLightbox = useCallback((src, alt) => {
    setSelectedItem({ src, alt });
  }, []);

  const closeLightbox = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const {
    heading,
    description,
    bulletPoints,
    images,
    cards,
    subsections
  } = section;

  return (
    <section>
      {heading && (
        <h4 className="text-lg font-medium text-slate-900 mb-2">
          {heading}
        </h4>
      )}

      {description && (
        <p className="text-slate-900 leading-relaxed mb-4">
          {description}
        </p>
      )}

      {bulletPoints?.length > 0 && (
        <BulletPoints items={bulletPoints} />
      )}

      {images?.length > 0 && (
        <ImageGrid
          images={images}
          onImageClick={openLightbox}
          altPrefix={heading || 'Section'}
        />
      )}

      {cards?.length > 0 && (
        <CardGrid cards={cards} />
      )}

      {subsections?.length > 0 && (
        <SubsectionsList
          subsections={subsections}
          onImageClick={openLightbox}
        />
      )}

      <MediaOverlay
        selectedItem={selectedItem}
        onClose={closeLightbox}
      />
    </section>
  );
};

const ProjectSection = ({ project, index, isLast, showProjectTag }) => (
  <article className={`mb-20 ${!isLast ? 'border-b border-slate-300 border-dashed pb-16' : ''}`}>
    {showProjectTag && (
      <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
        Project {index + 1}
      </h2>
    )}

    <div className="mb-4 flex items-center justify-between gap-4">
      <h3 className="text-xl font-sans font-bold text-slate-900">
        {project.title}
      </h3>
      {project.link && (
        <a
          href={project.link}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 hover:border-slate-400 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
        >
          View Details
          <ArrowRight size={14} />
        </a>
      )}
    </div>

    <div className="space-y-12">
      {project.sections.map((section, sectionIndex) => (
        <SectionLayout
          key={sectionIndex}
          section={section}
        />
      ))}
    </div>
  </article>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// Separate component for search params logic
function CaseStudyContent({ pageData, projects }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDialog = searchParams.get('dialog') === 'true';

  const handleClose = () => {
    router.back();
  };

  const content = (
    <div className="mx-auto max-w-4xl px-8 py-16">
      <PageHeader pageData={pageData} />
      <PageDescription description={pageData.description} />

      <main>
        {projects.map((project, index) => (
          <ProjectSection
            key={project.title || index}
            project={project}
            index={index}
            isLast={index === projects.length - 1}
            showProjectTag={projects.length > 1}
          />
        ))}
      </main>
    </div>
  );

  if (isDialog) {
    return (
      <DialogWrapper isOpen={true} onClose={handleClose}>
        {content}
      </DialogWrapper>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {content}
    </div>
  );
}

// Wrap in Suspense to fix Next.js build error
export function CaseStudyPage({ pageData, projects }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <CaseStudyContent pageData={pageData} projects={projects} />
    </Suspense>
  );
}

export { SectionLayout };
