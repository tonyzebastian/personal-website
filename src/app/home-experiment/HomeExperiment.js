"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

import ListItem from "@/components/list/ListItem";
import Title from "@/components/list/Title";
import BoidsIntroCanvas from "@/components/home-experiment/BoidsIntroCanvas";
import CopyEmailLink from "@/components/ui/CopyEmailLink";
import ExperienceWithProjects from "@/components/ui/ExperienceWithProjects";
import HighlightLink from "@/components/ui/HighlightLink";
import {
  bio,
  designAreas,
  experience,
  musings,
  now,
  projects,
} from "@/lib/content";

function Introduction({ visible = true }) {
  return (
    <div
      className={`flex w-full max-w-[612px] flex-col items-center gap-2 px-8 transition-all duration-700 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <h1 className="text-center font-serif text-2xl text-slate-900 2xl:text-3xl">
        Hello! I am Tony, a software designer.
      </h1>
      <p className="text-center font-sans text-sm leading-relaxed text-slate-700 2xl:text-base">
        {bio.intro}
      </p>
    </div>
  );
}

function HomeContent() {
  return (
    <div className="relative z-10 min-h-screen rounded-t-3xl bg-white pt-4 shadow">
      <div className="mx-auto h-1.5 w-32 rounded-full bg-slate-200/75" />

      <div className="mx-auto max-w-2xl px-8 pb-24">
        <div className="flex flex-col gap-6 pt-8">
          <section className="my-6">
            <h2 className="mb-2">Pet Projects</h2>
            <div className="space-y-1">
              {projects.map((project) => (
                <ListItem
                  key={project.link}
                  image={project.image}
                  title={project.name}
                  isExternal={true}
                  primaryText={project.date}
                  secondaryText={project.secondaryText}
                  href={project.link}
                />
              ))}
            </div>
          </section>

          <section className="my-6">
            <h2 className="mb-4">Experience</h2>
            <div>
              {experience.map((item) => (
                <ExperienceWithProjects
                  key={item.link}
                  name={item.name}
                  date={item.date}
                  link={item.link}
                  image={item.image}
                  secondaryText={item.secondaryText}
                  projects={item.projects || []}
                />
              ))}

              <div className="flex flex-col items-start gap-6 pt-2 transition-all md:flex-row md:items-center">
                {designAreas.map((area) => (
                  <a
                    key={area.title}
                    href={area.link}
                    target={area.isExternal ? "_blank" : "_self"}
                    rel={area.isExternal ? "noopener noreferrer" : ""}
                    className="no-underline"
                  >
                    <Title
                      title={area.title}
                      image={area.image}
                      isExternal={area.isExternal}
                    />
                  </a>
                ))}
                <span className="font-sans text-sm text-slate-500 md:-ml-2">
                  and more.
                </span>
              </div>
            </div>
          </section>

          <section className="my-6">
            <h2 className="mb-2">Musings</h2>
            <div className="space-y-1">
              {musings.map((musing) => (
                <ListItem
                  key={musing.link}
                  title={musing.name}
                  isExternal={false}
                  primaryText={musing.date}
                  secondaryText={musing.secondaryText}
                  href={musing.link}
                />
              ))}
            </div>
          </section>

          <section className="my-6">
            <h2 className="mb-2">Now</h2>
            <div className="space-y-4">
              {now.map((item, index) => (
                <p key={index} className="text-slate-700">
                  {Array.isArray(item.description)
                    ? item.description.map((part, partIndex) =>
                        typeof part === "string" ? (
                          part
                        ) : (
                          <HighlightLink key={partIndex} href={part.href}>
                            {part.text}
                          </HighlightLink>
                        ),
                      )
                    : item.description}
                </p>
              ))}
            </div>
          </section>

          <section className="mb-8 mt-6">
            <h2 className="mb-2">Contact</h2>
            <div className="font-sans text-sm text-slate-700">
              Reach me on{" "}
              <HighlightLink href="https://x.com/tonyzeb_design">
                twitter
              </HighlightLink>{" "}
              or <CopyEmailLink />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function HomeExperiment() {
  const [runId, setRunId] = useState(0);
  const [introMounted, setIntroMounted] = useState(true);
  const [headingVisible, setHeadingVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!introMounted) return;

    const timer = window.setTimeout(() => {
      setHeadingVisible(true);
    }, 850);

    return () => window.clearTimeout(timer);
  }, [introMounted, runId]);

  useEffect(() => {
    if (!isFading) return;

    const timer = window.setTimeout(() => {
      setIntroMounted(false);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [isFading]);

  const handleIntroComplete = useCallback(() => {
    setHeadingVisible(true);
    setIsFading(true);
  }, []);

  const replayIntro = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setHeadingVisible(false);
    setIsFading(false);
    setIntroMounted(true);
    setRunId((current) => current + 1);
  };

  return (
    <div className="relative bg-white">
      <button
        type="button"
        onClick={replayIntro}
        className="fixed right-4 top-4 z-[70] flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-sans text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 md:right-6 md:top-6"
        aria-label="Replay fish intro"
      >
        <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
        Replay
      </button>

      <section className="flex min-h-[100svh] items-center justify-center bg-white">
        <Introduction />
      </section>

      <HomeContent />

      {introMounted && (
        <div
          className={`fixed inset-0 z-[60] bg-white transition-opacity duration-700 ${
            isFading ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <BoidsIntroCanvas
            runId={runId}
            onComplete={handleIntroComplete}
          />
          <div className="relative z-10 flex h-full items-center justify-center pointer-events-none">
            <Introduction visible={headingVisible} />
          </div>
        </div>
      )}
    </div>
  );
}
