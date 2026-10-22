'use client'

import { useState, useEffect } from 'react';
import Title from './Title';
import SubText from './SubText';
import Link from 'next/link';

const ListItem = ({
  image,
  title,
  isExternal,
  primaryText,
  secondaryText,
  href
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);

    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Link
      href={href}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="block"
    >
      {/* The side borders are always reserved (transparent) so hovering only
          changes their colour; adding them on hover shifted the contents 1px. */}
      <div
        className="flex flex-col md:flex-row items-start md:items-center justify-between py-3 rounded -mx-4 px-[15px] border-l border-r border-transparent md:hover:bg-slate-50 md:hover:border-gray-200"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="md:group-hover:[&>*]:hover mb-2 md:mb-0">
          <Title
            image={image}
            title={title}
            isExternal={isExternal}
            isHovered={isHovered && isDesktop}
          />
        </div>
        <div className="md:group-hover:[&>*]:hover">
          <SubText
            primaryText={primaryText}
            secondaryText={secondaryText}
            isHovered={isHovered && isDesktop}
          />
        </div>
      </div>
    </Link>
  );
};

export default ListItem;