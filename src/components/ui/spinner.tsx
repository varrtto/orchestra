export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`spinner ${className}`}
    />
  );
}

export function CenteredSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner />
    </div>
  );
}
