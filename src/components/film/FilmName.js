export default function FilmName() {
  return (
    <>
      <section
        aria-labelledby="film-title"
        className="flex w-full items-center bg-white px-[0.4vw] pb-[0.3vw] pt-[0.4vw]"
      >
        <h1
          id="film-title"
          className="mb-0! w-full whitespace-nowrap text-center [font-family:var(--font-gasoek-one)]! text-[10.5vw]! font-normal! uppercase! leading-[0.76]! tracking-tight! text-slate-950!"
        >
          Tony Sebastian
        </h1>
      </section>
      <div aria-hidden="true" className="h-[1.2vw] min-h-2 bg-white" />
    </>
  );
}
