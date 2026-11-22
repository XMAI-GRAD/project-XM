export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="6.5"
        cy="6.5"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="m10.5 10.5 4 4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
