import FilmHero from "@/components/film/FilmHero";
import FilmName from "@/components/film/FilmName";
import FilmWorkCard from "@/components/film/FilmWorkCard";
import { filmContent } from "./content";

export const metadata = {
  title: "Film — Tony Sebastian",
  description:
    "Films and moving-image stories by Tony Sebastian — moments shaped through motion, light, and atmosphere.",
  alternates: {
    canonical: "https://www.tonyzeb.com/film",
  },
  openGraph: {
    title: "Film — Tony Sebastian",
    description:
      "Films and moving-image stories by Tony Sebastian — moments shaped through motion, light, and atmosphere.",
    url: "https://www.tonyzeb.com/film",
    siteName: "Tony Sebastian",
    images: [
      {
        url: "https://www.tonyzeb.com/images/film/hero.png",
        width: 1200,
        height: 675,
        alt: "Tony Sebastian film portfolio",
      },
    ],
    type: "website",
  },
};

export default function FilmPage() {
  return (
    <div className="min-h-screen bg-white">
      <FilmName />
      <FilmHero {...filmContent.hero} />

      <section
        aria-label="Selected films"
        className="grid grid-cols-1 bg-white px-4 md:grid-cols-2 md:gap-px md:bg-slate-200 md:px-0"
      >
        {filmContent.works.map((work, index) => (
          <FilmWorkCard key={work.id} work={work} index={index} />
        ))}
      </section>
    </div>
  );
}
