type AppIconProps = {
  className?: string;
};

/** Zelfde motief als public/icon.svg — IV-zak, druppel, verdeling over lumens. */
export function AppIcon({ className = "w-6 h-6" }: AppIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M10 2.5h4v1H10v-1zm2 1v1.2h-1V3.5h1z" />
      <rect x="7.5" y="5" width="9" height="6.5" rx="1.25" />
      <rect x="8.75" y="6.25" width="6.5" height="3.5" rx="0.6" opacity="0.35" />
      <rect x="8.75" y="10" width="6.5" height="1.25" rx="0.3" />
      <rect x="11.1" y="11.75" width="1.8" height="3.5" rx="0.55" />
      <circle cx="12" cy="16.25" r="1.35" />
      <rect x="11.35" y="17.35" width="1.3" height="1.1" rx="0.4" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        d="M12 18.45v.85M12 19.3L7.5 20.85M12 19.3v1.55M12 19.3l4.5 1.55"
      />
      <circle cx="7.5" cy="21.35" r="1.05" />
      <circle cx="12" cy="21.35" r="1.05" />
      <circle cx="16.5" cy="21.35" r="1.05" />
    </svg>
  );
}
