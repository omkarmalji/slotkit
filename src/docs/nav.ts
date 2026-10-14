export type NavItem = { href: string; label: string };
export type NavGroup = { label: string; items: NavItem[] };

/** Only pages that exist are listed. */
export const NAV: NavGroup[] = [
  {
    label: 'Components',
    items: [
      { href: '/components/date-picker', label: 'Calendar and DatePicker' },
      { href: '/components/time-slot-list', label: 'TimeSlotList' },
    ],
  },
  {
    label: 'Foundations',
    items: [{ href: '/components/foundations', label: 'Tokens and themes' }],
  },
];

export const GITHUB_URL = 'https://github.com/omkarmalji/slotkit';
