import type { IsoWeekday } from './calendar-date';

/**
 * Which day a locale's week starts on.
 *
 * `Intl.Locale` exposes this, but support is uneven: newer engines have `getWeekInfo()`,
 * some older ones only the `weekInfo` getter, and some have neither. So the lookup is
 * layered, and the last layer is CLDR data rather than a guess.
 */

/**
 * First day of the week by region, from CLDR `supplemental/weekData.json` (cldr-core 48.2.0).
 * CLDR's world default ("001") is Monday, so only the exceptions are listed.
 */
const CLDR_FIRST_DAY: Record<string, IsoWeekday> = {
  ...regions(
    7,
    'AG AS BD BR BS BT BW BZ CA CO DM DO ET GT GU HK HN ID IL IN IS JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW',
  ),
  ...regions(6, 'AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY'),
  ...regions(5, 'MV'),
};

function regions(firstDay: IsoWeekday, list: string): Record<string, IsoWeekday> {
  return Object.fromEntries(list.split(' ').map((r) => [r, firstDay]));
}

type WeekInfo = { firstDay: number };
type LocaleWithWeekInfo = Intl.Locale & {
  getWeekInfo?: () => WeekInfo;
  weekInfo?: WeekInfo;
};

function isIsoWeekday(n: unknown): n is IsoWeekday {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 7;
}

export type WeekStartSource = 'getWeekInfo' | 'weekInfo' | 'cldr-table' | 'default';

/** Returns the first day of the week and which layer answered (useful in tests and docs). */
export function resolveFirstDayOfWeek(locale: string): {
  firstDay: IsoWeekday;
  source: WeekStartSource;
} {
  let loc: LocaleWithWeekInfo;
  try {
    loc = new Intl.Locale(locale) as LocaleWithWeekInfo;
  } catch {
    return { firstDay: 1, source: 'default' };
  }

  // An explicit `-u-fw-` extension (for example en-US-u-fw-mon) is honoured by the
  // Intl layers below. The CLDR table cannot see it, so read it here for that path.
  const fw = locale
    .match(/-u(?:-[a-z0-9]{2,8})*?-fw-(mon|tue|wed|thu|fri|sat|sun)\b/i)?.[1]
    ?.toLowerCase();

  try {
    const fromMethod = loc.getWeekInfo?.().firstDay;
    if (isIsoWeekday(fromMethod)) return { firstDay: fromMethod, source: 'getWeekInfo' };
  } catch {
    // Fall through to the next layer.
  }

  const fromGetter = loc.weekInfo?.firstDay;
  if (isIsoWeekday(fromGetter)) return { firstDay: fromGetter, source: 'weekInfo' };

  if (fw) {
    const map = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 } as const;
    return { firstDay: map[fw as keyof typeof map], source: 'cldr-table' };
  }

  const region = loc.region ?? safeMaximize(loc)?.region;
  if (region && CLDR_FIRST_DAY[region])
    return { firstDay: CLDR_FIRST_DAY[region], source: 'cldr-table' };
  if (region) return { firstDay: 1, source: 'cldr-table' };

  return { firstDay: 1, source: 'default' };
}

function safeMaximize(loc: Intl.Locale): Intl.Locale | undefined {
  try {
    return loc.maximize();
  } catch {
    return undefined;
  }
}

export function getFirstDayOfWeek(locale: string): IsoWeekday {
  return resolveFirstDayOfWeek(locale).firstDay;
}
