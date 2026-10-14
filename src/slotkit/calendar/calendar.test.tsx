import { DirectionProvider } from '@base-ui/react/direction-provider';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from '@/test/axe';
import { type CalendarDate, createDate as d } from '../time/calendar-date';
import { Calendar, type CalendarProps } from './calendar';

const today = d(2026, 10, 14);
const weekend = (date: CalendarDate) =>
  [0, 6].includes(new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay());

function renderCalendar(props: Partial<CalendarProps> = {}) {
  return render(<Calendar locale="en-US" today={today} {...props} />);
}

describe('Calendar', () => {
  it('is a grid labelled by its month, with full weekday names for screen readers', () => {
    renderCalendar();
    const grid = screen.getByRole('grid', { name: 'October 2026' });
    expect(grid).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'SunSunday',
      'MonMonday',
      'TueTuesday',
      'WedWednesday',
      'ThuThursday',
      'FriFriday',
      'SatSaturday',
    ]);
  });

  it('exposes state as data attributes for styling', () => {
    renderCalendar({
      defaultValue: d(2026, 10, 20),
      min: d(2026, 10, 5),
      isDateUnavailable: weekend,
    });
    const btn = (name: RegExp) => screen.getByRole('button', { name });
    expect(btn(/October 20/)).toHaveAttribute('data-selected');
    expect(btn(/October 14/)).toHaveAttribute('data-today');
    expect(btn(/October 4,/)).toHaveAttribute('data-disabled');
    expect(btn(/October 17/)).toHaveAttribute('data-unavailable');
    expect(btn(/October 20/)).toHaveAttribute('data-focused');
  });

  it('submits the selected date as YYYY-MM-DD under its name', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      return new FormData(e.currentTarget).get('date');
    });
    render(
      <form onSubmit={onSubmit}>
        <Calendar locale="en-US" today={today} name="date" />
        <button type="submit">Submit</button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: /October 22/ }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveReturnedWith('2026-10-22');
  });

  it('accepts className as a function of state, and a render prop', () => {
    const { container } = renderCalendar({
      defaultValue: d(2026, 10, 1),
      className: (s) => (s.filled ? 'is-filled' : 'is-empty'),
      render: <section />,
    });
    const root = container.firstElementChild!;
    expect(root.tagName).toBe('SECTION');
    expect(root).toHaveClass('is-filled');
  });

  it('forwards ref to the root element', () => {
    const ref = { current: null as HTMLDivElement | null };
    renderCalendar({ ref });
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('follows Base UI DirectionProvider for RTL, including arrow keys', async () => {
    const user = userEvent.setup();
    render(
      <DirectionProvider direction="rtl">
        <Calendar locale="ar-EG" today={today} />
      </DirectionProvider>,
    );
    const focused = screen
      .getAllByRole('button')
      .find((b) => b.tabIndex === 0 && b.hasAttribute('data-calendar-day'))!;
    focused.focus();
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toHaveAttribute('aria-label', expect.stringContaining('١٥'));
    expect(screen.getByRole('grid').closest('[dir]')).toHaveAttribute('dir', 'rtl');
  });

  it('starts weeks on Saturday for ar-EG', () => {
    render(<Calendar locale="ar-EG" today={today} dir="rtl" />);
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('السبت');
  });

  it('disables month buttons at min and max', () => {
    renderCalendar({ min: d(2026, 10, 1), max: d(2026, 10, 31) });
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });

  it('accepts translated labels', () => {
    renderCalendar({
      locale: 'de-DE',
      labels: {
        previousMonth: 'Vorheriger Monat',
        nextMonth: 'Nächster Monat',
        unavailable: 'nicht verfügbar',
      },
      isDateUnavailable: weekend,
    });
    expect(screen.getByRole('button', { name: 'Vorheriger Monat' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Samstag, 17. Oktober 2026, nicht verfügbar' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Mittwoch, 14. Oktober 2026, heute' }),
    ).toBeInTheDocument();
  });

  describe('has no axe violations', () => {
    const states: [string, Partial<CalendarProps>][] = [
      ['default', {}],
      ['selected', { defaultValue: d(2026, 10, 20) }],
      ['with min and max', { min: d(2026, 10, 10), max: d(2026, 11, 5) }],
      ['with unavailable days', { isDateUnavailable: weekend }],
      ['disabled', { disabled: true }],
      ['read only', { readOnly: true, defaultValue: d(2026, 10, 3) }],
      ['RTL Arabic', { locale: 'ar-EG', dir: 'rtl' }],
      ['before today is known', { today: null }],
    ];
    it.each(states)('%s', async (_label, props) => {
      const { container } = renderCalendar(props);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
