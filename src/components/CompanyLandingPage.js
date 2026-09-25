'use client'

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MediaItem from '@/components/ui/MediaItem';

export default function CompanyLandingPage({ data }) {
  const { page, projects } = data;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-8 py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-10">
          <ArrowLeft size={14} />
          Back
        </Link>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            {page.logo && (
              <Image
                src={page.logo}
                alt={page.company}
                width={28}
                height={28}
                className="object-contain"
              />
            )}
            <h1 className="text-2xl font-serif font-medium text-slate-900">
              {page.company}
            </h1>
          </div>
          {page.description && (
            <p className="text-slate-600 text-sm leading-relaxed">
              {page.description}
            </p>
          )}
        </header>

        <main className="relative pt-6 pb-10">
          <div className="absolute left-3 top-0 w-px bg-slate-200 h-full"></div>

          <div className="ml-6 space-y-8">
            {projects.map((project, index) => {
              const hasLink = !!project.link;

              const card = (
                <article className={`pl-2 pb-2 -mb-2 pt-2 -mt-3 pr-2 -mr-2 rounded ${hasLink ? 'cursor-pointer group hover:bg-slate-50 border border-transparent hover:border-slate-100' : ''}`}>
                  <h2 className="text-sm font-sans font-semibold text-slate-900 transition-all mb-1">
                    {project.title}
                  </h2>

                  <div className="space-y-3">
                    {project.sections
                      ?.filter(section => section.heading !== 'Impact')
                      .map((section, sectionIndex) => (
                        <section key={sectionIndex}>
                          {section.description && (
                            <p className="text-slate-600 text-xs leading-relaxed mb-4">
                              {section.description}
                            </p>
                          )}

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
              );

              return (
                <div key={project.title || index} className="relative">
                  <div className="absolute -left-3 top-2.5">
                    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 12.5C11.4241 12.5 9.8637 12.1896 8.4078 11.5866C6.95189 10.9835 5.62902 10.0996 4.51472 8.98528C3.40041 7.87098 2.5165 6.54811 1.91344 5.0922C1.31039 3.63629 0.999999 2.07586 1 0.5" stroke="#E2E8F0" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {hasLink ? (
                    <Link href={`${project.link}?dialog=true`} className="block">
                      {card}
                    </Link>
                  ) : card}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
