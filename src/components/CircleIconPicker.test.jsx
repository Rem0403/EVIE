// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import CircleIconPicker from './CircleIconPicker.jsx';

afterEach(cleanup);

const PHOTO = 'data:image/jpeg;base64,/9j/AAAA';

function Harness({ initial, onChange }) {
  const [value, setValue] = useState(initial);
  return <CircleIconPicker value={value} onChange={(v) => { setValue(v); onChange(v); }} />;
}

it('keeps a chosen photo while switching to Symbol and back, but saves only what is showing', () => {
  const onChange = vi.fn();
  render(<Harness initial={{ icon: 'heart', iconColor: 'lavender', iconPhoto: PHOTO }} onChange={onChange} />);
  expect(screen.getByRole('tab', { name: 'Photo' }).getAttribute('aria-selected')).toBe('true');
  expect(screen.getByText('Change photo')).toBeTruthy();

  fireEvent.click(screen.getByRole('tab', { name: 'Symbol' }));
  expect(onChange).toHaveBeenLastCalledWith({ icon: 'heart', iconColor: 'lavender', iconPhoto: '' });
  fireEvent.click(screen.getByRole('radio', { name: 'Frog' }));
  expect(onChange).toHaveBeenLastCalledWith({ icon: 'frog', iconColor: 'lavender', iconPhoto: '' });

  fireEvent.click(screen.getByRole('tab', { name: 'Photo' }));
  expect(onChange).toHaveBeenLastCalledWith({ icon: 'frog', iconColor: 'lavender', iconPhoto: PHOTO });
});

it('removing the photo falls back to the symbol', () => {
  const onChange = vi.fn();
  render(<Harness initial={{ icon: 'star', iconColor: 'gold', iconPhoto: PHOTO }} onChange={onChange} />);
  fireEvent.click(screen.getByText('Remove photo'));
  expect(onChange).toHaveBeenLastCalledWith({ icon: 'star', iconColor: 'gold', iconPhoto: '' });
  expect(screen.getByText('Choose photo')).toBeTruthy();
  expect(screen.getByText('Until you choose one, the symbol is used.')).toBeTruthy();
});
