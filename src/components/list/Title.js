import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react/ssr';

// Icon, name and an arrow that slides in while the parent row is hovered
// (the parent needs the `group` class).
const Title = ({ image, title, isExternal }) => {
  const Arrow = isExternal ? ArrowUpRight : ArrowRight;

  return (
    <div className="flex items-center">
      {image && (
        <img
          src={image}
          alt=""
          width={24}
          height={24}
          className="mr-2 size-6 shrink-0 object-contain drop-shadow-md"
        />
      )}
      <h4>{title}</h4>
      <span className="ml-0 w-0 overflow-hidden transition-all duration-200 ease-in-out md:group-hover:ml-2 md:group-hover:w-6">
        <Arrow size={16} weight="bold" className="text-ink/55" aria-hidden />
      </span>
    </div>
  );
};

export default Title;
