// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PhotoPicker from './PhotoPicker.jsx';

afterEach(cleanup);

const GOOGLE = 'https://lh3.googleusercontent.com/a/me=s96-c';

it('shows initials until there is a photo', () => {
  render(<PhotoPicker name="Remy Jacob" photo="" onChange={vi.fn()} />);
  expect(screen.getByText('RJ')).toBeTruthy();
  expect(screen.getByText('Choose photo')).toBeTruthy();
  expect(screen.queryByText('Remove photo')).toBeNull();
});

it('can switch to the Google picture, and remove a photo', () => {
  const onChange = vi.fn();
  const { rerender } = render(<PhotoPicker name="Remy" photo="" googlePhoto={GOOGLE} onChange={onChange} />);
  fireEvent.click(screen.getByText('Use Google photo'));
  expect(onChange).toHaveBeenLastCalledWith(GOOGLE);

  rerender(<PhotoPicker name="Remy" photo={GOOGLE} googlePhoto={GOOGLE} onChange={onChange} />);
  expect(screen.queryByText('Use Google photo')).toBeNull(); // already using it
  fireEvent.click(screen.getByText('Remove photo'));
  expect(onChange).toHaveBeenLastCalledWith('');
});

it('explains when the chosen file is not a photo', async () => {
  const onChange = vi.fn();
  const { container } = render(<PhotoPicker name="Remy" photo="" onChange={onChange} />);
  const file = new File(['%PDF'], 'scan.pdf', { type: 'application/pdf' });
  fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Choose a photo (an image file).');
  expect(onChange).not.toHaveBeenCalled();
});
