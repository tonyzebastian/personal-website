// Placeholder shown the moment a panel link is clicked, until the page
// arrives. Shaped like PanelPage so the swap is calm.
export default function PanelSkeleton() {
  const bar = 'rounded-md bg-ink/[0.06] animate-pulse';

  return (
    <div aria-busy="true" aria-label="Loading" className="mx-auto w-full max-w-2xl px-6 pb-20 md:px-10">
      <div className="mb-10 flex flex-col gap-3">
        <div className={`size-10 rounded-full ${bar}`} />
        <div className={`h-10 w-2/3 ${bar}`} />
        <div className={`h-4 w-1/3 ${bar}`} />
      </div>
      <div className="flex flex-col gap-3">
        <div className={`h-4 w-full ${bar}`} />
        <div className={`h-4 w-11/12 ${bar}`} />
        <div className={`h-4 w-4/5 ${bar}`} />
        <div className={`mt-4 aspect-video w-full ${bar}`} />
      </div>
    </div>
  );
}
