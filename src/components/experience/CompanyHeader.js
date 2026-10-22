import Image from 'next/image';
import Link from 'next/link';
import MediaGrid from './MediaGrid';
import { TimelineTail } from './TimelineDecor';
import ViewLine from './ViewLine';

// Logo sits on the timeline line, followed by the company name and a short
// description. With `href` the whole block (name, description and images) is
// one link to the case study, with the same hover affordance as an item.
export default function CompanyHeader({ name, description, image, tail = false, href, images = [], alt }) {
  const content = (
    <>
      <div className="flex min-h-6 items-center gap-3">
        <h4
          className={`!font-semibold ${href ? 'shrink-0 transition-all group-hover:!font-extrabold group-focus-visible:!font-extrabold' : ''}`}
        >
          {name}
        </h4>
        {href && <ViewLine />}
      </div>
      {description && <p className="mt-1 text-xs text-slate-600">{description}</p>}
      {href && images.length > 0 && (
        <div className="mt-4">
          <MediaGrid items={images} alt={alt} />
        </div>
      )}
    </>
  );

  return (
    <div className="relative min-h-6 pl-8">
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
      {href ? (
        <Link href={`${href}?dialog=true`} className="group relative z-10 block bg-white">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
