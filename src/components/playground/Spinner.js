// Shown while a piece's code or assets load.
export default function Spinner({ className = 'text-body/40' }) {
  return (
    <div role="status" aria-label="Loading" className={`pointer-events-none absolute inset-0 grid place-items-center ${className}`}>
      <span className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
    </div>
  );
}
