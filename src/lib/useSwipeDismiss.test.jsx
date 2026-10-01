// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useSwipeDismiss } from './useSwipeDismiss.js';

function Sheet({ onClose }) {
  const sheet = useSwipeDismiss(onClose);
  return <div data-testid="sheet" ref={sheet.ref} {...sheet.handlers} />;
}

afterEach(cleanup);

const swipe = (el, dy, ms) => {
  Object.defineProperty(el, 'offsetHeight', { value: 400, configurable: true }); // jsdom has no layout
  const now = vi.spyOn(Date, 'now').mockReturnValue(0);
  fireEvent.touchStart(el, { touches: [{ clientY: 100 }] });
  fireEvent.touchMove(el, { touches: [{ clientY: 100 + dy }] });
  now.mockReturnValue(ms);
  fireEvent.touchEnd(el);
  now.mockRestore();
};

test('a quick flick down closes the sheet; a slow nudge snaps it back', () => {
  const onClose = vi.fn();
  const { getByTestId } = render(<Sheet onClose={onClose} />);
  swipe(getByTestId('sheet'), 20, 1000);
  expect(onClose).not.toHaveBeenCalled();
  swipe(getByTestId('sheet'), 120, 100);
  expect(onClose).toHaveBeenCalled();
});

test('dragging up never closes it', () => {
  const onClose = vi.fn();
  const { getByTestId } = render(<Sheet onClose={onClose} />);
  swipe(getByTestId('sheet'), -200, 50);
  expect(onClose).not.toHaveBeenCalled();
});
