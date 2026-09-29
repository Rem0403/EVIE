// Line icons (Lucide-style, 24px grid) drawn in currentColor, so each takes its type's color from CSS.
const PATHS = {
  // Filled brain with a lightning bolt cut out (even-odd fill), the recognisable seizure symbol.
  seizure: (
    <path
      fill="currentColor"
      stroke="none"
      fillRule="evenodd"
      d="M3.2 12.8C1.9 11.9 1.6 10 2.6 8.8C2.4 7 3.6 5.4 5.4 5.2C6.1 3.6 8 2.8 9.7 3.4C11 2.3 13.2 2.3 14.5 3.3C16.3 2.9 18.2 3.8 18.9 5.4C20.7 5.8 21.9 7.5 21.6 9.3C22.6 10.6 22.4 12.6 21.1 13.6C20.9 15.4 19.2 16.5 17.5 16.1C17.2 16.5 16.9 16.8 16.5 17C16.5 18.4 16.4 20 15.8 21.3C15.6 21.7 15.1 21.7 14.9 21.3C14.3 20.1 13.6 18.8 12.7 17.6C11.8 17.7 10.8 17.4 10.1 16.7C8.7 17.3 7 16.9 6.2 15.8C4.6 15.8 3.3 14.5 3.2 12.8ZM13.2 4.6L8.3 12H11.5L10.6 15.8L15.8 9H12.4Z"
    />
  ),
  med: (
    <>
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </>
  ),
  sleep: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  behavior: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9h.01M15 9h.01" />
    </>
  ),
  note: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8" />
    </>
  ),
  clip: (
    <>
      <path d="m16 13 5.2 3.5a.5.5 0 0 0 .8-.4V7.9a.5.5 0 0 0-.8-.4L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </>
  ),
  photo: (
    <>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
      <circle cx="12" cy="13" r="3" />
    </>
  ),
  plus: <path d="M5 12h14M12 5v14" />,
  handoff: <path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  upload: <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />,
  doc: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </>
  ),
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  summary: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="19" cy="12" r="1.2" />
    </>
  ),
  flag: <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
};

export default function Icon({ name, size = 20, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name] || PATHS.note}
    </svg>
  );
}
