'use client'
import Title from "../list/Title";
import ProjectSummary from "./ProjectSummary";
import Link from 'next/link';
import { useState } from 'react';

export default function ExperienceWithProjects({
  name,
  date,
  link,
  image,
  secondaryText,
  projects = []
}) {
  const [isLinkHovered, setIsLinkHovered] = useState(false);
  const isExternal = link && !link.startsWith('/');

  return (
    <div>
      
      <Link 
        href={link}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="block"
        onMouseEnter={() => setIsLinkHovered(true)}
        onMouseLeave={() => setIsLinkHovered(false)}
      >
        <div className={`flex flex-col md:flex-row items-start md:items-center gap-4 rounded -mx-4 px-4 group ${projects.length === 0 ? 'pb-6' : ''}`}>
          <Title
            image={image}
            title={name}
            isExternal={isExternal}
            fromFontWeight={600}
            isHovered={isLinkHovered}
          />
          <p className="text-slate-600 text-xs mt-1 md:mt-0 group-hover:text-slate-900">
           {date} <span className="text-xs text-slate-400 mx-2">✦</span> {secondaryText}
          </p>
        </div>
      </Link>
      
      {projects.length > 0 && (
        <div className="relative pt-6 pb-10">
          {/* Vertical timeline line - aligned with logo center */}
          <div className="absolute left-3 top-0 w-px bg-slate-200 h-full"></div>
          
          <div className="ml-6 space-y-8">
            {projects.map((project, index) => (
              <div key={index} className="relative ">
                {/* Curved elbow line - from top to right */}
                <div className="absolute -left-3 top-2.5">
                  <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 12.5C11.4241 12.5 9.8637 12.1896 8.4078 11.5866C6.95189 10.9835 5.62902 10.0996 4.51472 8.98528C3.40041 7.87098 2.5165 6.54811 1.91344 5.0922C1.31039 3.63629 0.999999 2.07586 1 0.5" stroke="#E2E8F0" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="pl-2 hover:bg-slate-50 border border-transparent hover:border-slate-100 pb-2 -mb-2 pt-2 -mt-3 pr-2 -mr-2 rounded">
                  <ProjectSummary
                    ProjTitle={project.title}
                    ProjDesc={project.description}
                    MasonryImages={project.images || []}
                    projectLink={project.link}
                    requiresPassword={project.requiresPassword}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}