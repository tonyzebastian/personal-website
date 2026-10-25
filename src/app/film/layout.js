import { Gasoek_One } from "next/font/google";

const gasoekOne = Gasoek_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gasoek-one",
  display: "swap",
});

export default function FilmLayout({ children }) {
  // data-no-grain turns off the site-wide grain overlay for the film pages.
  return <div className={gasoekOne.variable} data-no-grain>{children}</div>;
}
