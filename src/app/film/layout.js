import { Gasoek_One } from "next/font/google";

const gasoekOne = Gasoek_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gasoek-one",
  display: "swap",
});

export default function FilmLayout({ children }) {
  return <div className={gasoekOne.variable}>{children}</div>;
}
