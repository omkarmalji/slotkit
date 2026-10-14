import { render } from '@testing-library/react';
import { axe } from './axe';

describe('axe helper', () => {
  it('reports real violations', async () => {
    // Deliberately inaccessible markup: this test proves axe catches it.
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    const { container } = render(<img src="x.png" />);
    const results = await axe(container);
    expect(results.violations.map((v) => v.id)).toContain('image-alt');
    expect(() => expect(results).toHaveNoViolations()).toThrow();
  });

  it('passes clean markup', async () => {
    const { container } = render(<button type="button">Book</button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
