'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import Title from '@/components/list/Title';
import { TimelineTail } from './TimelineDecor';

// Logo sits on the timeline line, followed by name, role and period.
export default function CompanyHeader({ name, role, period, link, image, tail = false }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block min-h-6 pl-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {tail && <TimelineTail />}
      <div
        className="absolute left-0 top-0 z-10 h-6 w-6 rounded-full bg-white shadow-[0_0_0_4px_#fff]"
        data-exp-node
      >
        <Image
          src={image}
          alt={`${name} icon`}
          width={24}
          height={24}
          className="object-contain filter drop-shadow-md"
        />
      </div>
      <div className="flex min-h-6 flex-wrap items-center gap-x-3 gap-y-0.5">
        <Title title={name} isExternal={true} fromFontWeight={600} isHovered={isHovered} />
        <p className="text-xs text-slate-600">
          {role}
          <span className="mx-2 text-xs text-slate-400">✦</span>
          {period}
        </p>
      </div>
    </Link>
  );
}
