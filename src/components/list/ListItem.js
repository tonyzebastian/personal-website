'use client'

import { useState } from 'react';
import Link from 'next/link';
import Title from './Title';
import SubText from './SubText';

const ListItem = ({
  image,
  title,
  isExternal,
  primaryText,
  secondaryText,
  href
}) => {
  // SubText measures its own width, so it needs the hover state as a prop.
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={href}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="-mx-4 flex flex-col items-start justify-between rounded px-4 py-3 md:flex-row md:items-center md:hover:bg-slate-50">
        <div className="mb-2 md:mb-0">
          <Title image={image} title={title} isExternal={isExternal} />
        </div>
        <SubText
          primaryText={primaryText}
          secondaryText={secondaryText}
          isHovered={isHovered}
        />
      </div>
    </Link>
  );
};

export default ListItem;
