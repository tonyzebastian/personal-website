'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { ArrowCounterClockwise, ArrowsOutSimple, X } from '@phosphor-icons/react';
import Stage from './Stage';
import AutoVideo from '@/components/ui/AutoVideo';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PIECES } from './pieces';

// One item on a Playground page, in one of three forms:
//   piece   a live piece with a line below it: its name, then "| hint"
//           (fainter) and outline buttons on the right: Replay (pieces that
//           animate as they arrive) and Expand, which opens it on its own in
//           a lightbox under a top bar with its title and description, with
//           its controls where it has them. The hint and buttons show on
//           hover or keyboard focus (always on touch screens).
//   bare    a piece with no line (`bare` in the registry, the single-piece
//           pages): the panel's own header names it and its expand button
//           opens it full size. `fill` lets it fill the side panel.
//   clip    a looping video (`video`, In Motion) with its name and hint.
export default function GroupItem({ id, video, title, hint, description, fill = false }) {
  if (video) return <Clip video={video} title={title} hint={hint} />;
  if (PIECES[id]?.bare) {
    return (
      <section aria-label={title} className={`flex flex-col ${fill ? 'min-h-0 flex-1' : ''}`}>
        <Stage id={id} {...shapeOf(id, fill)} />
      </section>
    );
  }
  return <Piece id={id} title={title} hint={hint} description={description} />;
}

const REVEAL =
  'opacity-0 transition-opacity duration-150 ease-snappy group-hover/item:opacity-100 group-focus-within/item:opacity-100 [@media(hover:none)]:opacity-100';
// `fill`: wherever it fills (side panel or a filling full page, both
// data-fills), the stage drops its shape and takes the whole space.
const FILL =
  'in-data-fills:aspect-auto! in-data-fills:min-h-0 in-data-fills:flex-1 in-data-fills:rounded-none in-data-fills:bg-transparent';
// cn, not buttonVariants' own className, so these win over the base
// border-transparent and the outline variant's paper fill.
const ACTION = cn(
  buttonVariants({ variant: 'outline', size: 'sm' }),
  'border-body/15 bg-transparent text-body/80 hover:border-body/30 hover:bg-transparent hover:text-ink aria-expanded:bg-transparent',
);

// The stage's shape: a responsive one (classes) wins over the fixed ratio.
function shapeOf(id, fill) {
  const piece = PIECES[id];
  const base = `rounded-xl bg-body/[0.03] ${fill ? FILL : ''}`;
  return piece?.aspectClass
    ? { className: `${base} ${piece.aspectClass}` }
    : { className: base, style: { aspectRatio: piece?.aspect ?? '16 / 10' } };
}

// The name, then the hint after a pipe; the hint is cut short on narrow pages.
function Caption({ headingId, title, hint }) {
  return (
    <div className="min-w-0 flex-1 truncate @2xl:overflow-visible @2xl:whitespace-normal">
      <h2 id={headingId} className="inline font-sans text-base font-medium tracking-normal">
        {title}
      </h2>
      {hint && (
        <span className={`text-body/70 ${REVEAL}`}>
          <span aria-hidden className="px-2.5 text-body/25">
            |
          </span>
          {hint}
        </span>
      )}
    </div>
  );
}

function Clip({ video, title, hint }) {
  const headingId = `clip-${video.split('/').pop().replace(/\W/g, '-')}`;
  return (
    <section aria-labelledby={headingId} className="group/item flex flex-col gap-2">
      <div className="overflow-hidden rounded-xl bg-body/[0.03]" style={{ aspectRatio: '4 / 3' }}>
        <AutoVideo src={video} aria-label={title} className="size-full object-cover" />
      </div>
      <div className="flex min-h-8 items-center">
        <Caption headingId={headingId} title={title} hint={hint} />
      </div>
    </section>
  );
}

function Piece({ id, title, hint, description }) {
  const [open, setOpen] = useState(false);
  // True from opening until the lightbox has fully closed, so the panel copy
  // stays paused through the close animation and the piece never runs twice.
  const [lightboxShown, setLightboxShown] = useState(false);
  const [run, setRun] = useState(0);
  const headingId = `piece-${id}`;

  const replay = PIECES[id]?.replay && (
    <button type="button" aria-label={`Replay ${title}`} onClick={() => setRun((n) => n + 1)} className={ACTION}>
      <ArrowCounterClockwise weight="bold" data-icon="inline-start" aria-hidden />
      Replay
    </button>
  );

  // Esc closes the lightbox only; marking it handled keeps the panel open.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  const onOpenChange = (next) => {
    setOpen(next);
    if (next) setLightboxShown(true);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} onOpenChangeComplete={setLightboxShown}>
      <section aria-labelledby={headingId} className="group/item flex flex-col gap-2">
        <Stage id={id} active={!open && !lightboxShown} run={run} {...shapeOf(id, false)} />
        <div className="flex min-h-8 items-center justify-between gap-4">
          <Caption headingId={headingId} title={title} hint={hint} />
          <div className={`flex shrink-0 items-center gap-1.5 ${REVEAL}`}>
            {replay}
            <Dialog.Trigger aria-label={`Expand ${title}`} className={ACTION}>
              <ArrowsOutSimple weight="bold" data-icon="inline-start" aria-hidden />
              Expand
            </Dialog.Trigger>
          </div>
        </div>
      </section>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 ease-snappy data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-3 z-[70] flex flex-col overflow-hidden rounded-xl bg-paper shadow-2xl outline-none transition-[opacity,scale] duration-200 ease-snappy data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 md:inset-8">
          {/* Top bar, like the panel's: "Title | description", then the
              actions and close on the right. */}
          <div className="flex shrink-0 items-center justify-between gap-6 border-b border-border p-3 pl-5 md:pl-6">
            <p className="min-w-0 text-lg font-medium text-ink">
              <Dialog.Title render={<span />}>{title}</Dialog.Title>
              {(description || hint) && (
                <>
                  <span aria-hidden className="px-2.5 font-normal text-body/25">
                    |
                  </span>
                  <Dialog.Description render={<span />} className="font-normal text-body/70">
                    {description || hint}
                  </Dialog.Description>
                </>
              )}
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              {replay}
              <Dialog.Close
                aria-label="Close"
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink/5 text-body/80 transition-colors outline-none hover:bg-ink/10 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <X weight="bold" aria-hidden className="size-4" />
              </Dialog.Close>
            </div>
          </div>
          <Stage id={id} mode="lightbox" run={run} className="min-h-0 flex-1 bg-body/[0.03]" />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
