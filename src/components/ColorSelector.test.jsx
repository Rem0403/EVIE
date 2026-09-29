// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ColorSelector from './ColorSelector.jsx';

afterEach(cleanup);

const options = [
  { value: 'lavender', label: 'Lavender', color: '#c9b8ea' },
  { value: 'blue', label: 'Soft blue', color: '#a9cbea' },
];

it('is a labelled radio group where each color has a visible name', () => {
  const onChange = vi.fn();
  render(<ColorSelector legend="Colors" value="lavender" options={options} onChange={onChange} />);
  expect(screen.getByRole('group', { name: 'Colors' })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Lavender' }).checked).toBe(true);
  fireEvent.click(screen.getByText('Soft blue'));
  expect(onChange).toHaveBeenCalledWith('blue');
});

it('keeps all swatches in one group so arrow keys move between them', () => {
  render(<ColorSelector legend="Colors" value="blue" options={options} onChange={vi.fn()} />);
  const [a, b] = screen.getAllByRole('radio');
  expect(a.name).toBe(b.name);
  expect(b.checked).toBe(true);
});
