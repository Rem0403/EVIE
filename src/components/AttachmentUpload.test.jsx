// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import AttachmentUpload from './AttachmentUpload.jsx';

URL.createObjectURL = vi.fn(() => 'blob:x');
URL.revokeObjectURL = vi.fn();
afterEach(cleanup);

function Harness() {
  const [files, setFiles] = useState([]);
  return <AttachmentUpload files={files} onChange={setFiles} />;
}
const pick = (...files) => fireEvent.change(document.querySelector('input[type=file]'), { target: { files } });

it('lists picked files and lets you remove one', () => {
  render(<Harness />);
  pick(new File(['a'], 'rash.png', { type: 'image/png' }), new File(['b'], 'letter.pdf', { type: 'application/pdf' }));
  expect(screen.getByRole('button', { name: 'Preview rash.png' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Remove letter.pdf' }));
  expect(screen.queryByText('letter.pdf')).toBeNull();
});

it('explains why a file was not added', () => {
  render(<Harness />);
  pick({ name: 'huge.mov', size: 40 * 1024 * 1024, type: 'video/quicktime' });
  expect(screen.getByRole('alert').textContent).toMatch(/huge.mov is too large/);
});

it('opens a full-size photo preview that closes with Escape', () => {
  render(<Harness />);
  pick(new File(['a'], 'rash.png', { type: 'image/png' }));
  fireEvent.click(screen.getByRole('button', { name: 'Preview rash.png' }));
  expect(screen.getByRole('dialog', { name: 'Preview of rash.png' })).toBeTruthy();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('warns not to attach ID cards', () => {
  render(<Harness />);
  expect(screen.getByText(/Don.t attach insurance or Medicaid cards/)).toBeTruthy();
});
