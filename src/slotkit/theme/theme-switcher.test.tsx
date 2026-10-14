import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from '@/test/axe';
import { THEME_STORAGE_KEY } from './theme-store';
import { ThemeSwitcher } from './theme-switcher';

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('ThemeSwitcher', () => {
  it('is a labelled radio group with three options, System checked by default', () => {
    render(<ThemeSwitcher />);
    const group = screen.getByRole('radiogroup', { name: 'Theme' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual([
      'System',
      'Light',
      'Dark',
    ]);
    expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true');
  });

  it('reflects a stored preference', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    render(<ThemeSwitcher />);
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
  });

  it('applies and stores the choice on click', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);
    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('is operable with the keyboard alone: one tab stop, arrows change the theme', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <ThemeSwitcher />
      </>,
    );
    await user.tab();
    await user.tab();
    expect(screen.getByRole('radio', { name: 'System' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Light' })).toHaveFocus();
    expect(document.documentElement.dataset.theme).toBe('light');

    await user.keyboard('{ArrowRight}');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('has no axe violations', async () => {
    const { container } = render(<ThemeSwitcher />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
