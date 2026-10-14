import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from '@/test/axe';
import { createDate as d } from '../time/calendar-date';
import { DatePicker, type DatePickerProps } from './date-picker';

const today = d(2026, 10, 14);

function renderPicker(props: Partial<DatePickerProps> = {}) {
  return render(<DatePicker label="Appointment date" locale="en-US" today={today} {...props} />);
}

const trigger = () => screen.getByRole('button', { name: /^Appointment date/ });

describe('DatePicker', () => {
  it('names the trigger with its label and current value', () => {
    renderPicker({ defaultValue: d(2026, 3, 8) });
    expect(trigger()).toHaveAccessibleName('Appointment date Sun, Mar 8, 2026');
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('shows the placeholder when empty', () => {
    renderPicker();
    expect(trigger()).toHaveAccessibleName('Appointment date Select a date');
  });

  it('opens a dialog named by the label, with focus on the selected day', async () => {
    const user = userEvent.setup();
    renderPicker({ defaultValue: d(2026, 10, 20) });
    await user.click(trigger());
    expect(await screen.findByRole('dialog', { name: 'Appointment date' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /October 20/ })).toHaveFocus());
  });

  it('opens on today when nothing is selected', async () => {
    const user = userEvent.setup();
    renderPicker();
    trigger().focus();
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /October 14, 2026, today/ })).toHaveFocus(),
    );
  });

  it('can be completed with the keyboard alone, and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderPicker({ onValueChange });
    trigger().focus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByRole('button', { name: /October 14/ })).toHaveFocus());

    await user.keyboard('{ArrowDown}{ArrowRight}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith(d(2026, 10, 22), { reason: 'keyboard' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveAccessibleName('Appointment date Thu, Oct 22, 2026');
  });

  it('closes on Escape without changing the value, and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderPicker({ defaultValue: d(2026, 10, 2), onValueChange });
    await user.click(trigger());
    await screen.findByRole('dialog');
    await user.keyboard('{ArrowRight}{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger()).toHaveFocus();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('supports controlled open state', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = renderPicker({ open: false, onOpenChange });
    await user.click(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(
      <DatePicker
        label="Appointment date"
        locale="en-US"
        today={today}
        open
        onOpenChange={onOpenChange}
      />,
    );
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('submits YYYY-MM-DD and blocks submit when required and empty, pointing at the trigger', async () => {
    const user = userEvent.setup();
    const submitted = vi.fn();
    render(
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitted(new FormData(e.currentTarget).get('date'));
        }}
      >
        <DatePicker label="Appointment date" locale="en-US" today={today} name="date" required />
        <button type="submit">Book</button>
      </form>,
    );

    await user.click(screen.getByRole('button', { name: 'Book' }));
    expect(submitted).not.toHaveBeenCalled();
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    expect(trigger()).toHaveAccessibleDescription('Choose a date.');

    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByRole('button', { name: /October 14/ })).toHaveFocus());
    await user.keyboard('{Enter}');
    await waitFor(() => expect(trigger()).not.toHaveAttribute('aria-invalid'));

    await user.click(screen.getByRole('button', { name: 'Book' }));
    expect(submitted).toHaveBeenCalledWith('2026-10-14');
  });

  it('is described by its description', () => {
    renderPicker({ description: 'Weekdays only.' });
    expect(trigger()).toHaveAccessibleDescription('Weekdays only.');
  });

  it('cannot be opened when disabled', async () => {
    const user = userEvent.setup();
    renderPicker({ disabled: true });
    expect(trigger()).toBeDisabled();
    await user.click(trigger());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('has no axe violations', () => {
    it.each<[string, Partial<DatePickerProps>]>([
      ['empty', {}],
      ['filled', { defaultValue: d(2026, 10, 20) }],
      ['invalid', { invalid: true, errorMessage: 'That day is fully booked.' }],
      ['disabled', { disabled: true }],
      ['with description', { description: 'Weekdays only.' }],
    ])('%s', async (_label, props) => {
      const { container } = renderPicker(props);
      expect(await axe(container)).toHaveNoViolations();
    });

    it('open (whole page, including the portaled dialog)', async () => {
      const user = userEvent.setup();
      // Inside <main> as on a real page, so axe's page-level landmark rule applies fairly.
      render(
        <main>
          <DatePicker
            label="Appointment date"
            locale="en-US"
            today={today}
            defaultValue={d(2026, 10, 20)}
          />
        </main>,
      );
      await user.click(trigger());
      await screen.findByRole('dialog');
      expect(await axe(document.body)).toHaveNoViolations();
    });
  });
});
