export type NavItem = { href: string; label: string };
export type NavGroup = { label: string; items: NavItem[] };

/** Only pages that exist are listed. Components are added as their phase ships. */
export const NAV: NavGroup[] = [
  {
    label: 'Start',
    items: [
      { href: '/', label: 'Overview' },
      { href: '/foundations', label: 'Foundations' },
    ],
  },
  {
    label: 'Components',
    items: [
      { href: '/components/date-picker', label: 'Calendar and DatePicker' },
      { href: '/components/time-slot-list', label: 'TimeSlotList' },
    ],
  },
];

export const GITHUB_URL = 'https://github.com/omkarmalji/slotkit';
