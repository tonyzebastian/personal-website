import { RevealField } from "./RevealField";

// Vision Reveal (from the playground repo), sized to fill its stage. The text
// scales with the stage through container queries.
export default function VisionReveal() {
  return (
    <section aria-label="Vision" className="@container absolute inset-0 overflow-hidden bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 opacity-[0.05]"
        style={{
          backgroundImage: "url(/playground/vision-reveal/noise.png)",
          backgroundSize: "220px",
          backgroundRepeat: "repeat",
        }}
      />
      <RevealField className="h-full">
        <div className="px-6">
          <h2 className="whitespace-nowrap font-serif text-2xl font-bold tracking-tight text-[#4b1f3f] @lg:text-3xl @3xl:text-5xl">
            The Sundial difference
          </h2>
          <p className="mx-auto mt-4 max-w-[480px] text-base text-slate-800/80 @lg:text-lg">
            An agentic analytics platform built for both trust and speed. It works with your existing stack and LLM tools, and we set it up for you so you can focus on what matters.
          </p>
        </div>
      </RevealField>
    </section>
  );
}

export { VisionReveal as Piece };
