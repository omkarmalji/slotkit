import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from '@/test/axe';
import { createDate } from '../time/calendar-date';
import { createDaySlots, type TimeSlot } from './slots';
import { TimeSlotList, type TimeSlotListProps } from './time-slot-list';

// 09:00 to 12:00 in Kolkata, every 30 minutes; 10:00 and 11:30 are booked.
const SLOTS: TimeSlot[] = createDaySlots({
  date: createDate(2026, 3, 9),
  timeZone: 'Asia/Kolkata',
  from: { hour: 9, minute: 0 },
  to: { hour: 12, minute: 0 },
  stepMinutes: 30,
}).map((s, i) => (i === 2 || i === 5 ? { ...s, status: 'booked' } : s));

function renderList(props: Partial<TimeSlotListProps> = {}) {
  return render(
    <TimeSlotList
      label="Available times"
      locale="en-GB"
      timeZone="Asia/Kolkata"
      slots={SLOTS}
      {...props}
    />,
  );
}

const group = () => screen.getByRole('radiogroup', { name: 'Available times' });
const slot = (name: string | RegExp) => within(group()).getByRole('radio', { name });
const focusedName = () => document.activeElement?.textContent;

describe('TimeSlotList', () => {
  it('is a labelled radio group described by an availability summary', () => {
    renderList();
    expect(group()).toHaveAccessibleDescription('4 times available');
    expect(
      within(group())
        .getAllByRole('radio')
        .map((r) => r.textContent),
    ).toEqual(['09:00', '09:30', '10:00Booked', '10:30', '11:00', '11:30Booked']);
  });

  it('marks booked slots as disabled, with the word "Booked" in their name', () => {
    renderList();
    expect(slot('10:00, Booked')).toHaveAttribute('aria-disabled', 'true');
    expect(slot('10:00, Booked')).toHaveAttribute('data-booked');
  });

  it('shows times in the viewer zone, not the business zone', () => {
    renderList({ timeZone: 'Europe/London' });
    expect(slot(/^03:30/)).toBeInTheDocument(); // 09:00 in Kolkata
  });

  it('follows the locale hour cycle by default and can switch with the toggle', async () => {
    const user = userEvent.setup();
    const onHourCycleChange = vi.fn();
    renderList({ locale: 'en-US', onHourCycleChange });
    expect(slot(/^9:00\sAM$/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: '24h' }));
    expect(onHourCycleChange).toHaveBeenCalledWith('h23');
    expect(slot('09:00')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Clock format' })).toBeInTheDocument();
  });

  it('selects on click and reports the slot', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderList({ onValueChange });
    await user.click(slot('10:30'));
    expect(onValueChange).toHaveBeenCalledWith(SLOTS[3]!.value, SLOTS[3]);
    expect(slot('10:30')).toHaveAttribute('aria-checked', 'true');
  });

  it('cannot select a booked slot', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderList({ onValueChange });
    await user.click(slot('10:00, Booked'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  describe('keyboard', () => {
    it('is one tab stop; arrows move and select, skipping booked slots', async () => {
      const user = userEvent.setup();
      renderList();
      await user.tab(); // hour cycle toggle
      await user.tab(); // the list
      expect(focusedName()).toBe('09:00');
      await user.keyboard('{ArrowRight}{ArrowRight}');
      expect(focusedName()).toBe('10:30'); // 10:00 is booked and skipped
      expect(slot('10:30')).toHaveAttribute('aria-checked', 'true');
      await user.keyboard('{ArrowLeft}');
      expect(focusedName()).toBe('09:30');
    });

    it('Home and End jump to the first and last available slot', async () => {
      const user = userEvent.setup();
      renderList();
      slot('09:30').focus();
      await user.keyboard('{End}');
      expect(focusedName()).toBe('11:00'); // 11:30 is booked
      expect(slot('11:00')).toHaveAttribute('aria-checked', 'true');
      await user.keyboard('{Home}');
      expect(focusedName()).toBe('09:00');
    });

    it('typeahead jumps to a time by typing its digits', async () => {
      const user = userEvent.setup();
      renderList();
      slot('09:00').focus();
      await user.keyboard('11');
      expect(focusedName()).toBe('11:00');
      expect(slot('11:00')).toHaveAttribute('aria-checked', 'true');
    });

    it('typeahead in 12h refines with more digits and skips booked slots', async () => {
      const user = userEvent.setup();
      renderList({ locale: 'en-US' });
      slot(/^9:00/).focus();
      await user.keyboard('103');
      expect(focusedName()).toMatch(/^10:30/);
      await new Promise((r) => setTimeout(r, 700)); // let the query reset
      await user.keyboard('1');
      expect(focusedName()).toMatch(/^11:00/); // 10:00 is booked; next "1" after 10:30
    });
  });

  it('submits the selected slot value and supports required', async () => {
    const user = userEvent.setup();
    const submitted = vi.fn();
    render(
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitted(new FormData(e.currentTarget).get('slot'));
        }}
      >
        <TimeSlotList
          label="Available times"
          locale="en-GB"
          timeZone="Asia/Kolkata"
          slots={SLOTS}
          name="slot"
          required
        />
        <button type="submit">Book</button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Book' }));
    expect(submitted).not.toHaveBeenCalled();
    await user.click(slot('11:00'));
    await user.click(screen.getByRole('button', { name: 'Book' }));
    expect(submitted).toHaveBeenCalledWith(SLOTS[4]!.value);
  });

  it('is controllable', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderList({ value: SLOTS[0]!.value, onValueChange });
    await user.click(slot('11:00'));
    expect(onValueChange).toHaveBeenCalled();
    expect(slot('09:00')).toHaveAttribute('aria-checked', 'true');
  });

  it('shows a loading state that is announced, not an empty list', () => {
    renderList({ loading: true });
    expect(screen.queryByRole('radiogroup', { name: 'Available times' })).not.toBeInTheDocument();
    expect(screen.getByText('Loading available times')).toBeInTheDocument();
  });

  it('shows a useful empty state', () => {
    renderList({ slots: [] });
    expect(screen.getByText('No times available')).toBeInTheDocument();
    expect(screen.getByText('No times left on this day. Try another date.')).toBeInTheDocument();
  });

  it('labels repeated times on a DST fall-back day with their zone', () => {
    renderList({
      locale: 'en-US',
      timeZone: 'America/New_York',
      slots: [
        { value: 'a', start: Date.parse('2026-11-01T05:30:00Z') },
        { value: 'b', start: Date.parse('2026-11-01T06:30:00Z') },
      ],
    });
    expect(slot(/1:30\sAM\sEDT/)).toBeInTheDocument();
    expect(slot(/1:30\sAM\sEST/)).toBeInTheDocument();
  });

  it('marks slots that fall on a different local day, visibly and in their name', () => {
    // 09:00 in Kolkata on 9 March is 20:30 on 8 March in Los Angeles (already on PDT).
    renderList({
      locale: 'en-US',
      timeZone: 'America/Los_Angeles',
      date: createDate(2026, 3, 9),
      slots: SLOTS.slice(0, 2),
    });
    const first = within(group()).getAllByRole('radio')[0]!;
    expect(first).toHaveAttribute('data-other-day');
    expect(first).toHaveTextContent(/Sun/);
    expect(first).toHaveAccessibleName(/^8:30\sPM, Sunday, March 8, 2026$/);
  });

  it('adds no day marker when every slot is on the given day', () => {
    renderList({ date: createDate(2026, 3, 9) });
    expect(group().querySelector('[data-other-day]')).toBeNull();
  });

  describe('has no axe violations', () => {
    it.each<[string, Partial<TimeSlotListProps>]>([
      ['default', {}],
      ['selected', { defaultValue: SLOTS[3]!.value }],
      ['12h', { locale: 'en-US' }],
      ['disabled', { disabled: true }],
      ['loading', { loading: true }],
      ['empty', { slots: [] }],
      ['without toggle', { showHourCycleToggle: false }],
      ['with day markers', { timeZone: 'America/Los_Angeles', date: createDate(2026, 3, 9) }],
    ])('%s', async (_label, props) => {
      const { container } = renderList(props);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
