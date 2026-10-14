import { createDate } from '../time/calendar-date';
import {
  createDaySlots,
  findTypeaheadMatch,
  formatSlotLabels,
  type TimeSlot,
  typeaheadKey,
} from './slots';

const iso = (s: TimeSlot) => s.value.replace('.000', '');

describe('createDaySlots', () => {
  it('steps by wall-clock time in the business zone', () => {
    const slots = createDaySlots({
      date: createDate(2026, 3, 9),
      timeZone: 'Asia/Kolkata',
      from: { hour: 9, minute: 0 },
      to: { hour: 10, minute: 30 },
      stepMinutes: 30,
    });
    expect(slots.map(iso)).toEqual([
      '2026-03-09T03:30:00Z',
      '2026-03-09T04:00:00Z',
      '2026-03-09T04:30:00Z',
    ]);
    expect(slots.every((s) => s.status === 'available')).toBe(true);
  });

  it('skips wall times that do not exist on a spring-forward day', () => {
    const slots = createDaySlots({
      date: createDate(2026, 3, 8),
      timeZone: 'America/New_York',
      from: { hour: 1, minute: 0 },
      to: { hour: 4, minute: 0 },
      stepMinutes: 30,
    });
    // 02:00 and 02:30 never happen in New York on 8 March 2026.
    expect(slots.map(iso)).toEqual([
      '2026-03-08T06:00:00Z', // 01:00 EST
      '2026-03-08T06:30:00Z', // 01:30 EST
      '2026-03-08T07:00:00Z', // 03:00 EDT
      '2026-03-08T07:30:00Z', // 03:30 EDT
    ]);
  });

  it('gives a repeated wall time one slot, at its first occurrence, on a fall-back day', () => {
    const slots = createDaySlots({
      date: createDate(2026, 11, 1),
      timeZone: 'America/New_York',
      from: { hour: 1, minute: 0 },
      to: { hour: 2, minute: 0 },
      stepMinutes: 30,
    });
    expect(slots.map(iso)).toEqual(['2026-11-01T05:00:00Z', '2026-11-01T05:30:00Z']);
  });

  it('marks booked slots', () => {
    const booked = Date.parse('2026-03-09T04:00:00Z');
    const slots = createDaySlots({
      date: createDate(2026, 3, 9),
      timeZone: 'Asia/Kolkata',
      from: { hour: 9, minute: 0 },
      to: { hour: 10, minute: 0 },
      stepMinutes: 30,
      isBooked: (start) => start === booked,
    });
    expect(slots.map((s) => s.status)).toEqual(['available', 'booked']);
  });
});

describe('formatSlotLabels', () => {
  const kolkata: TimeSlot[] = [
    { value: 'a', start: Date.parse('2026-03-09T03:30:00Z') },
    { value: 'b', start: Date.parse('2026-03-09T08:30:00Z') },
  ];

  it('formats in the viewer zone and hour cycle', () => {
    expect(formatSlotLabels(kolkata, 'en-US', 'Asia/Kolkata', 'h23')).toEqual(['09:00', '14:00']);
    expect(
      formatSlotLabels(kolkata, 'en-US', 'Asia/Kolkata', 'h12').map((l) => l.replace(/\s/g, ' ')),
    ).toEqual(['9:00 AM', '2:00 PM']);
    // The same instants seen from London: 03:30 and 08:30.
    expect(formatSlotLabels(kolkata, 'en-GB', 'Europe/London', 'h23')).toEqual(['03:30', '08:30']);
  });

  it('adds the zone abbreviation only when two slots would look the same', () => {
    // Server-provided instants an hour apart, both shown as 1:30 in New York on 1 November.
    const repeated: TimeSlot[] = [
      { value: 'edt', start: Date.parse('2026-11-01T05:30:00Z') },
      { value: 'est', start: Date.parse('2026-11-01T06:30:00Z') },
      { value: 'later', start: Date.parse('2026-11-01T08:00:00Z') },
    ];
    const labels = formatSlotLabels(repeated, 'en-US', 'America/New_York', 'h12').map((l) =>
      l.replace(/\s/g, ' '),
    );
    expect(labels).toEqual(['1:30 AM EDT', '1:30 AM EST', '3:00 AM']);
  });
});

describe('typeahead', () => {
  const labels = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '1:00 PM', '1:30 PM', '2:00 PM'];
  const all = () => true;

  it('normalizes labels to letters and digits', () => {
    expect(typeaheadKey('9:30 AM')).toBe('930am');
    expect(typeaheadKey('14:00')).toBe('1400');
  });

  it('matches the start of a label, searching after the current item', () => {
    expect(findTypeaheadMatch(labels, '2', 0, all)).toBe(6);
    expect(findTypeaheadMatch(labels, '9', 0, all)).toBe(1);
  });

  it('refines with longer queries', () => {
    expect(findTypeaheadMatch(labels, '1', 1, all)).toBe(2); // 10:00
    expect(findTypeaheadMatch(labels, '13', 2, all)).toBe(5); // 1:30 PM
    expect(findTypeaheadMatch(labels, '103', 2, all)).toBe(3); // 10:30
  });

  it('cycles through matches when one character is repeated', () => {
    expect(findTypeaheadMatch(labels, '11', 2, all)).toBe(3);
    expect(findTypeaheadMatch(labels, '111', 5, all)).toBe(2); // wraps
  });

  it('skips disabled items and returns -1 with no match', () => {
    expect(findTypeaheadMatch(labels, '2', 0, (i) => i !== 6)).toBe(-1);
    expect(findTypeaheadMatch(labels, '9', 0, (i) => i !== 1)).toBe(0);
    expect(findTypeaheadMatch(labels, '7', 0, all)).toBe(-1);
  });
});
