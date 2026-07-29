import HomeExperiment from "./HomeExperiment";

import { sharedViewport } from "@/lib/metadata";

export const viewport = sharedViewport;

export const metadata = {
  title: "Tony Sebastian ✦ fish homepage experiment",
  description:
    "An experimental portfolio homepage by Tony Sebastian, featuring a generative flocking introduction.",
  robots: "noindex,nofollow",
};

export default function HomeExperimentPage() {
  return <HomeExperiment />;
}
