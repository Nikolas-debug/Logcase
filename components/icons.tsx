// Stroke icons (Lucide geometry, 24px grid). One weight across the app.
const paths = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  bag: "M6 7h12l1 14H5zM9 7V6a3 3 0 0 1 6 0v1",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "M5 12.5 10 17l9-10",
  close: "M6 6l12 12M18 6 6 18",
  left: "M15 18l-6-6 6-6",
  right: "M9 18l6-6-6-6",
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 18l-6-6 6-6",
  pause: "M8 5v14M16 5v14",
  play: "M7 5v14l11-7z",
  up: "M18 15l-6-6-6 6",
  down: "M6 9l6 6 6-6",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
} as const;

export function Icon({ name, className = "size-5" }: { name: keyof typeof paths; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={paths[name]} />
    </svg>
  );
}
