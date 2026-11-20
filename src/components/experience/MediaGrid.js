import AutoVideo from '@/components/ui/AutoVideo';

const isVideo = (src) => /\.(mp4|mov|webm|ogg|avi)$/i.test(src);

// Media share the row equally and keep their aspect ratio, so a single image
// fills the full width and its height scales with it.
export default function MediaGrid({ items = [], alt }) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-1.5">
      {items.map((src) =>
        isVideo(src) ? (
          <AutoVideo key={src} src={src} className="h-auto w-full rounded" />
        ) : (
          <img key={src} src={src} alt={alt} loading="lazy" className="h-auto w-full rounded" />
        )
      )}
    </div>
  );
}
