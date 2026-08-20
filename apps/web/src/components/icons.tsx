type IconProps = { className?: string };

/**
 * Line icons, drawn on a 20×20 grid with `currentColor`.
 *
 * Every one is `aria-hidden`: an icon here always sits beside its own label, so
 * exposing it to assistive technology would only repeat the text.
 */
function Icon({ className = 'size-5', children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
      <path d="m3 6 7 4.5L17 6" />
    </Icon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="8.5" width="12" height="8" rx="2" />
      <path d="M7 8.5V6.5a3 3 0 0 1 6 0v2" />
    </Icon>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 8.5 10 3l6.5 5.5" />
      <path d="M5 8v8.5h10V8" />
    </Icon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4.2l2.8 1.8" />
    </Icon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 3v8m0 0L6.8 7.8M10 11l3.2-3.2" />
      <path d="M3.5 13v2.5A1.5 1.5 0 0 0 5 17h10a1.5 1.5 0 0 0 1.5-1.5V13" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 4.5v11M4.5 10h11" />
    </Icon>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 6V4.5A1.5 1.5 0 0 0 10.5 3h-5A1.5 1.5 0 0 0 4 4.5v11A1.5 1.5 0 0 0 5.5 17h5a1.5 1.5 0 0 0 1.5-1.5V14" />
      <path d="M9 10h8m0 0-2.5-2.5M17 10l-2.5 2.5" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 6h13M3.5 10h13M3.5 14h13" />
    </Icon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5.5 8 4.5 4.5L14.5 8" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4.5" width="14" height="12" rx="2" />
      <path d="M3 8h14M7 3v3m6-3v3" />
    </Icon>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="14" height="10.5" rx="2" />
      <path d="M13 10.25h2.5" />
    </Icon>
  );
}

export function TrendUpIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 13.5 8 9l3 2.8 5.5-6" />
      <path d="M12.5 5.5h4v4" />
    </Icon>
  );
}

export function PieIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 3a7 7 0 1 0 7 7h-7z" />
      <path d="M13 3.6A7 7 0 0 1 16.4 7H13z" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 9.2v4M10 6.6h.01" />
    </Icon>
  );
}
