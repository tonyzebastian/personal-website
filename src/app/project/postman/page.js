'use client'

import { postmanData } from './content';
import Image from 'next/image';

const isVideo = (src) => /\.(mp4|mov|webm|ogg|avi)$/i.test(src);
const isGif = (src) => src.endsWith('.gif');

const MediaItem = ({ src, alt, width, height }) => {
  const baseClasses = "w-full h-auto rounded-xl border border-slate-100";

  if (isVideo(src)) {
    return (
      <video
        src={src}
        className={baseClasses}
        autoPlay
        muted
        loop
        playsInline
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={baseClasses}
      unoptimized={isGif(src)}
    />
  );
};

export default function PostmanPage() {
  const { projects } = postmanData;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-8 py-16">
        {/* Main Heading */}
        <header className="mb-12">
          <h1 className="text-3xl font-serif font-medium text-slate-900">
            Postman Projects
          </h1>
          <p className="text-slate-600 mt-1">
          Key projects I designed and shipped during my time at Postman.
          </p>
        </header>

        {/* Projects */}
        <main className="space-y-8">
          {projects.map((project, index) => (
            <article
              key={project.title || index}
              className="cursor-pointer group p-4 -m-4 rounded-xl hover:bg-slate-50 transition-colors"
              onClick={() => project.link && window.open(`${project.link}?dialog=true`, '_self')}
            >
              {/* Project Title */}
              <h2 className="text-base font-sans font-semibold text-slate-900 mb-2">
                {project.title}
              </h2>

              {/* Project Sections (excluding Impact) */}
              <div className="space-y-3">
                {project.sections
                  .filter(section => section.heading !== 'Impact')
                  .map((section, sectionIndex) => (
                    <section key={sectionIndex}>
                      {/* Description */}
                      {section.description && (
                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                          {section.description}
                        </p>
                      )}

                      {/* Images */}
                      {section.images?.length > 0 && (
                        <div className="mb-3">
                          <div className={`grid ${section.images.length > 1 ? 'grid-cols-2 gap-3' : 'grid-cols-1'}`}>
                            {section.images.map((image, imgIdx) => (
                              <div key={imgIdx} className="relative rounded-lg overflow-hidden bg-slate-50">
                                <MediaItem
                                  src={image}
                                  alt={`${project.title} illustration ${imgIdx + 1}`}
                                  width={section.images.length > 1 ? 300 : 600}
                                  height={section.images.length > 1 ? 200 : 300}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  ))}
              </div>
            </article>
          ))}
        </main>
      </div>
    </div>
  );
}
