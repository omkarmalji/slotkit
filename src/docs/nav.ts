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
];

export const GITHUB_URL = 'https://github.com/omkarmalji/slotkit';
