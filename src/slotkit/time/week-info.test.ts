import { getFirstDayOfWeek, resolveFirstDayOfWeek } from './week-info';

describe('first day of the week', () => {
  it('follows the locale: Sunday in the US, Monday in the UK and Germany, Saturday in Egypt', () => {
    expect(getFirstDayOfWeek('en-US')).toBe(7);
    expect(getFirstDayOfWeek('en-GB')).toBe(1);
    expect(getFirstDayOfWeek('de-DE')).toBe(1);
    expect(getFirstDayOfWeek('ar-EG')).toBe(6);
    expect(getFirstDayOfWeek('ja-JP')).toBe(7);
  });

  it('honours an explicit -u-fw- extension', () => {
    expect(getFirstDayOfWeek('en-US-u-fw-mon')).toBe(1);
  });

  it('falls back to Monday for an invalid locale instead of throwing', () => {
    expect(resolveFirstDayOfWeek('not a locale!')).toEqual({ firstDay: 1, source: 'default' });
  });

  describe('when the engine has no Intl week info', () => {
    const proto = Intl.Locale.prototype as unknown as Record<string, unknown>;
    const saved = {
      getWeekInfo: Object.getOwnPropertyDescriptor(proto, 'getWeekInfo'),
      weekInfo: Object.getOwnPropertyDescriptor(proto, 'weekInfo'),
    };

    beforeEach(() => {
      Object.defineProperty(proto, 'getWeekInfo', { value: undefined, configurable: true });
      Object.defineProperty(proto, 'weekInfo', { get: () => undefined, configurable: true });
    });

    afterEach(() => {
      for (const [key, desc] of Object.entries(saved)) {
        if (desc) Object.defineProperty(proto, key, desc);
        else delete proto[key];
      }
    });

    it('uses the CLDR region table', () => {
      expect(resolveFirstDayOfWeek('en-US')).toEqual({ firstDay: 7, source: 'cldr-table' });
      expect(resolveFirstDayOfWeek('ar-EG')).toEqual({ firstDay: 6, source: 'cldr-table' });
      expect(resolveFirstDayOfWeek('dv-MV')).toEqual({ firstDay: 5, source: 'cldr-table' });
      expect(resolveFirstDayOfWeek('fr-FR')).toEqual({ firstDay: 1, source: 'cldr-table' });
    });

    it('infers the region from the language when none is given', () => {
      // "ja" maximizes to ja-Jpan-JP.
      expect(resolveFirstDayOfWeek('ja')).toEqual({ firstDay: 7, source: 'cldr-table' });
    });

    it('still honours -u-fw-', () => {
      expect(resolveFirstDayOfWeek('en-US-u-fw-sat').firstDay).toBe(6);
    });
  });

  it('prefers getWeekInfo() when the engine has it', () => {
    const proto = Intl.Locale.prototype as unknown as Record<string, unknown>;
    const saved = Object.getOwnPropertyDescriptor(proto, 'getWeekInfo');
    Object.defineProperty(proto, 'getWeekInfo', {
      value: () => ({ firstDay: 3 }),
      configurable: true,
    });
    try {
      expect(resolveFirstDayOfWeek('en-US')).toEqual({ firstDay: 3, source: 'getWeekInfo' });
    } finally {
      if (saved) Object.defineProperty(proto, 'getWeekInfo', saved);
      else delete proto.getWeekInfo;
    }
  });
});
