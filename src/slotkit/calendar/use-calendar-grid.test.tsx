import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type CalendarDate, createDate as d } from '../time/calendar-date';
import { type UseCalendarGridOptions, useCalendarGrid } from './use-calendar-grid';

/**
 * A deliberately bare, unstyled renderer. If the hook works here, its behaviour does not
 * depend on anything in the styled Calendar.
 */
function Harness(props: Partial<UseCalendarGridOptions>) {
  const grid = useCalendarGrid({ locale: 'en-US', today: d(2026, 10, 14), ...props });
  return (
    <div>
      <p data-testid="title">{grid.title}</p>
      <button type="button" onClick={grid.goToPrevMonth} disabled={!grid.canGoPrev}>
        prev
      </button>
      <button type="button" onClick={grid.goToNextMonth} disabled={!grid.canGoNext}>
        next
      </button>
      <p data-testid="direction">{`${grid.direction}:${grid.animate}`}</p>
      <div role="status">{grid.announcement}</div>
      <table role="grid" aria-labelledby="t">
        <tbody>
          {grid.weeks.map((w) => (
            <tr key={w.key}>
              {w.days.map((day, i) =>
                day ? (
                  <td key={day.key} role="gridcell" aria-selected={day.isSelected}>
                    <button {...grid.getDayButtonProps(day)}>{day.dayNumber}</button>
                  </td>
                ) : (
                  <td key={i} role="gridcell" />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const day = (name: RegExp | string) => screen.getByRole('button', { name });
const tabbable = () =>
  screen.getAllByRole('button').filter((b) => b.tabIndex === 0 && b.closest('table'));

describe('useCalendarGrid', () => {
  it('builds the visible month with leading blanks for the locale week start', () => {
    render(<Harness />);
    expect(screen.getByTestId('title')).toHaveTextContent('October 2026');
    // October 2026 starts on a Thursday; with a Sunday start that is 4 blanks.
    const firstRow = screen.getAllByRole('row')[0]!;
    const cells = firstRow.querySelectorAll('td');
    expect([...cells].slice(0, 4).every((c) => c.textContent === '')).toBe(true);
    expect(cells[4]).toHaveTextContent('1');
  });

  it('starts weeks on Monday for en-GB', () => {
    render(<Harness locale="en-GB" />);
    const cells = screen.getAllByRole('row')[0]!.querySelectorAll('td');
    expect(cells[3]).toHaveTextContent('1'); // Thursday is the 4th column
  });

  it('labels days with the full date and marks today', () => {
    render(<Harness />);
    expect(day('Wednesday, October 14, 2026, today')).toHaveAttribute('aria-current', 'date');
    expect(day('Thursday, October 15, 2026')).not.toHaveAttribute('aria-current');
  });

  it('has exactly one tabbable day: the selected one, else today, else the 1st', () => {
    const { unmount } = render(<Harness defaultValue={d(2026, 10, 20)} />);
    expect(tabbable()).toHaveLength(1);
    expect(tabbable()[0]).toHaveAccessibleName(/October 20/);
    unmount();

    const second = render(<Harness />);
    expect(tabbable()[0]).toHaveAccessibleName(/October 14/);
    second.unmount();

    render(<Harness today={null} defaultMonth={d(2026, 11, 1)} />);
    expect(tabbable()[0]).toHaveAccessibleName(/November 1,/);
  });

  it('moves focus with the keyboard and keeps one tab stop', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    await user.tab();
    await user.tab();
    expect(day(/October 14/)).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(day(/October 15/)).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(day(/October 22/)).toHaveFocus();
    await user.keyboard('{Home}');
    expect(day(/October 18/)).toHaveFocus();
    await user.keyboard('{End}');
    expect(day(/October 24/)).toHaveFocus();
    expect(tabbable()).toHaveLength(1);
  });

  it('changes month when focus leaves it, and records the direction for motion', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    day(/October 14/).focus();

    await user.keyboard('{PageDown}');
    expect(screen.getByTestId('title')).toHaveTextContent('November 2026');
    expect(day(/November 14/)).toHaveFocus();
    expect(screen.getByTestId('direction')).toHaveTextContent('next:true');

    await user.keyboard('{Shift>}{PageUp}{/Shift}');
    expect(screen.getByTestId('title')).toHaveTextContent('November 2025');
    expect(screen.getByTestId('direction')).toHaveTextContent('prev:true');

    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(screen.getByTestId('title')).toHaveTextContent('October 2025');
  });

  it('does not animate month changes caused by key repeat', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    day(/October 14/).focus();
    // user-event: `>3` holds the key for three presses; repeats after the first set event.repeat.
    await user.keyboard('{PageDown>3/}');
    expect(screen.getByTestId('title')).toHaveTextContent('January 2027');
    expect(screen.getByTestId('direction')).toHaveTextContent('next:false');
  });

  it('selects with Enter, Space and click, and reports the reason', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);
    day(/October 14/).focus();

    await user.keyboard('{ArrowRight}{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(d(2026, 10, 15), { reason: 'keyboard' });
    expect(day(/October 15/).closest('td')).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowRight} ');
    expect(onValueChange).toHaveBeenLastCalledWith(d(2026, 10, 16), { reason: 'keyboard' });

    await user.click(day(/October 20/));
    expect(onValueChange).toHaveBeenLastCalledWith(d(2026, 10, 20), { reason: 'click' });
  });

  it('is controllable: it shows the value prop and only reports changes', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness value={d(2026, 10, 2)} onValueChange={onValueChange} />);
    await user.click(day(/October 9/));
    expect(onValueChange).toHaveBeenCalledWith(d(2026, 10, 9), { reason: 'click' });
    expect(day(/October 2,/).closest('td')).toHaveAttribute('aria-selected', 'true');
    expect(day(/October 9/).closest('td')).toHaveAttribute('aria-selected', 'false');
  });

  it('keeps focus and selection inside min and max', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Harness min={d(2026, 10, 10)} max={d(2026, 10, 31)} onValueChange={onValueChange} />);

    expect(day(/October 9,/)).toHaveAttribute('aria-disabled', 'true');
    await user.click(day(/October 9,/));
    expect(onValueChange).not.toHaveBeenCalled();

    day(/October 14/).focus();
    await user.keyboard('{PageUp}');
    expect(day(/October 10/)).toHaveFocus();
    await user.keyboard('{PageDown}');
    expect(day(/October 31/)).toHaveFocus();
    expect(screen.getByRole('button', { name: 'prev' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'next' })).toBeDisabled();
  });

  it('lets focus land on unavailable days (so they can be heard) but not select them', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const weekends = (date: CalendarDate) =>
      [0, 6].includes(new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay());
    render(<Harness isDateUnavailable={weekends} onValueChange={onValueChange} />);

    const sat = day('Saturday, October 17, 2026, unavailable');
    expect(sat).toHaveAttribute('aria-disabled', 'true');
    day(/October 14/).focus();
    await user.keyboard('{End}');
    expect(sat).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('mirrors left and right in RTL', async () => {
    const user = userEvent.setup();
    render(<Harness dir="rtl" />);
    day(/October 14/).focus();
    await user.keyboard('{ArrowLeft}');
    expect(day(/October 15/)).toHaveFocus();
  });

  it('announces the month only for the previous and next buttons', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'next' }));
    expect(screen.getByRole('status')).toHaveTextContent('November 2026');
    // Focus stays on the button; the grid does not steal it.
    expect(screen.getByRole('button', { name: 'next' })).toHaveFocus();

    day(/November 14/).focus();
    await user.keyboard('{PageDown}');
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('renders nothing until it knows which month to show', () => {
    render(<Harness today={null} />);
    expect(screen.getByTestId('title')).toHaveTextContent('');
    expect(screen.queryAllByRole('gridcell')).toHaveLength(0);
  });

  it('uses locale digits and names', () => {
    render(<Harness locale="ar-EG" />);
    expect(screen.getByTestId('title').textContent).toMatch(/٢٠٢٦/);
  });
});
