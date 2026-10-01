// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PhotoCropper from './PhotoCropper.jsx';

afterEach(cleanup);

const img = { naturalWidth: 400, naturalHeight: 300, src: 'blob:photo' };

it('Cancel and Escape close it, and Escape stops there instead of closing the sheet underneath', () => {
  const onCancel = vi.fn();
  const sheetEscape = vi.fn();
  document.addEventListener('keydown', sheetEscape);
  render(<PhotoCropper img={img} onChoose={vi.fn()} onCancel={onCancel} />);
  expect(screen.getByRole('dialog', { name: 'Move and scale' })).toBeTruthy();

  fireEvent.keyDown(screen.getByLabelText(/Drag or use the arrow keys/), { key: 'Escape' });
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(sheetEscape).not.toHaveBeenCalled();

  fireEvent.click(screen.getByText('Cancel'));
  expect(onCancel).toHaveBeenCalledTimes(2);
  document.removeEventListener('keydown', sheetEscape);
});

it("keeps drags to itself, so the sheet under it doesn't slide away", () => {
  const sheetTouch = vi.fn();
  render(
    <div onTouchStart={sheetTouch} onTouchMove={sheetTouch}>
      <PhotoCropper img={img} onChoose={vi.fn()} onCancel={vi.fn()} />
    </div>,
  );
  const stage = screen.getByLabelText(/Drag or use the arrow keys/);
  fireEvent.touchStart(stage, { touches: [{ clientX: 10, clientY: 10 }] });
  fireEvent.touchMove(stage, { touches: [{ clientX: 10, clientY: 200 }] });
  expect(sheetTouch).not.toHaveBeenCalled();
});

it('opens with focus on the photo, ready for the arrow keys', () => {
  render(<PhotoCropper img={img} onChoose={vi.fn()} onCancel={vi.fn()} />);
  expect(document.activeElement).toBe(screen.getByLabelText(/Drag or use the arrow keys/));
});
