import {
  faArrowLeft, faArrowUpRightFromSquare, faBullseye, faCalendarDays, faCapsules, faChartSimple, faCheck, faChevronRight,
  faEllipsis, faFileLines, faFlag, faHandHoldingHeart, faHandshake, faHouse, faImage, faMoon, faNoteSticky, faPhone,
  faPlus, faUpload, faUser, faUserPlus, faVideo, faXmark,
} from '@fortawesome/free-solid-svg-icons';

// Font Awesome Free solid icons (icons CC BY 4.0, code MIT: https://fontawesome.com/license/free),
// drawn inline in currentColor so each takes its type's color from CSS. The seizure mark is EVIE's own.
const ICONS = {
  med: faCapsules,
  sleep: faMoon,
  behavior: faHandHoldingHeart,
  goal: faBullseye,
  note: faNoteSticky,
  handoff: faHandshake,
  users: faUserPlus,
  clip: faVideo,
  photo: faImage,
  doc: faFileLines,
  summary: faChartSimple,
  calendar: faCalendarDays,
  phone: faPhone,
  flag: faFlag,
  home: faHouse,
  more: faEllipsis,
  upload: faUpload,
  plus: faPlus,
  chevron: faChevronRight,
  x: faXmark,
  check: faCheck,
  back: faArrowLeft,
  external: faArrowUpRightFromSquare,
  person: faUser,
};

// Filled brain with a lightning bolt cut out (even-odd fill), the recognisable seizure symbol, on a 24px grid.
const SEIZURE = 'M3.2 12.8C1.9 11.9 1.6 10 2.6 8.8C2.4 7 3.6 5.4 5.4 5.2C6.1 3.6 8 2.8 9.7 3.4C11 2.3 13.2 2.3 14.5 3.3C16.3 2.9 18.2 3.8 18.9 5.4C20.7 5.8 21.9 7.5 21.6 9.3C22.6 10.6 22.4 12.6 21.1 13.6C20.9 15.4 19.2 16.5 17.5 16.1C17.2 16.5 16.9 16.8 16.5 17C16.5 18.4 16.4 20 15.8 21.3C15.6 21.7 15.1 21.7 14.9 21.3C14.3 20.1 13.6 18.8 12.7 17.6C11.8 17.7 10.8 17.4 10.1 16.7C8.7 17.3 7 16.9 6.2 15.8C4.6 15.8 3.3 14.5 3.2 12.8ZM13.2 4.6L8.3 12H11.5L10.6 15.8L15.8 9H12.4Z';

// name: one of EVIE's icons above. icon: any Font Awesome icon definition instead (the circle icons).
// A wide icon is centered in the square, so every icon lines up at the same size.
export default function Icon({ name, icon, size = 20, className = '' }) {
  const svg = { className: `icon ${className}`, width: size, height: size, fill: 'currentColor', 'aria-hidden': true, focusable: false };
  if (name === 'seizure') {
    return <svg {...svg} viewBox="0 0 24 24"><path fillRule="evenodd" d={SEIZURE} /></svg>;
  }
  const [width, height, , , path] = (icon || ICONS[name] || ICONS.note).icon;
  return <svg {...svg} viewBox={`0 0 ${width} ${height}`}><path d={path} /></svg>;
}
