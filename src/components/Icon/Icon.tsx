const ICON_PATHS = {
  play: 'M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  search:
    'M10.5 4a6.5 6.5 0 1 0 4.03 11.6l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z',
  upload:
    'M12 3 6.5 8.5l1.41 1.41L11 6.83V16h2V6.83l3.09 3.08 1.41-1.41L12 3ZM5 18v2h14v-2H5Z',
  video:
    'M4 6h11a1 1 0 0 1 1 1v2.4l4-2.4v10l-4-2.4V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z',
  music:
    'M19 3v12.5a3 3 0 1 1-2-2.83V7.4l-8 1.6v8.5a3 3 0 1 1-2-2.83V5.4L19 3Z',
  tap: 'M12 2a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1ZM5.64 4.22 7.05 5.64a1 1 0 0 1-1.41 1.41L4.22 5.64a1 1 0 0 1 1.42-1.42Zm12.72 0a1 1 0 0 1 1.42 1.42l-1.42 1.41a1 1 0 1 1-1.41-1.41l1.41-1.42ZM10 9.5a1.5 1.5 0 0 1 3 0v4.2l3.6.9a2 2 0 0 1 1.5 2.27l-.6 3.8a2 2 0 0 1-2 1.33H11a2 2 0 0 1-1.6-.8l-3.1-4.1a1.4 1.4 0 0 1 2.1-1.8L10 16.8V9.5Z',
  history:
    'M13 3a9 9 0 0 0-8.95 8H1l4 4 4-4H6.05A7 7 0 1 1 13 20a6.96 6.96 0 0 1-4.95-2.05l-1.41 1.41A9 9 0 1 0 13 3Zm-1 5v5.41l4.29 4.3 1.42-1.42L14 12.59V8h-2Z',
} as const;

export type IconName = keyof typeof ICON_PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

/** Decorative icon; pair it with visible text or an `aria-label` on the control. */
export const Icon = ({ name, size = 20, className }: IconProps) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d={ICON_PATHS[name]} />
  </svg>
);
