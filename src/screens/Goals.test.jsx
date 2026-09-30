// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../data/goals.js', () => ({ addGoal: vi.fn(() => 'g9'), updateGoal: vi.fn(), deleteGoal: vi.fn() }));

import Goals from './Goals.jsx';
import GoalForm from './GoalForm.jsx';
import { addGoal, deleteGoal, updateGoal } from '../data/goals.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const circle = { id: 'c1', personName: 'Maya' };
const me = { uid: 'u1', name: 'Remy' };
const handlers = () => ({ onBack: vi.fn(), onAdd: vi.fn(), onEdit: vi.fn(), onPractice: vi.fn() });

it('explains goals and offers to add one when there are none', () => {
  const h = handlers();
  render(<Goals circle={circle} goals={[]} entries={[]} {...h} />);
  expect(screen.getByText(/No goals yet/)).toBeTruthy();
  fireEvent.click(screen.getByText('Add a goal'));
  expect(h.onAdd).toHaveBeenCalled();
});

it('shows each goal with its last two weeks of practice', () => {
  const h = handlers();
  const goals = [
    { id: 'g1', title: 'Ask for more', area: 'communication', status: 'active', workingWith: 'speech therapist' },
    { id: 'g2', title: 'Shoes on', area: 'daily_living', status: 'met' },
  ];
  const now = Date.now();
  const entries = [
    { type: 'goal', goalId: 'g1', goalTitle: 'Ask for more', result: 'own', occurredAt: now - 1000 },
    { type: 'goal', goalId: 'g1', goalTitle: 'Ask for more', result: 'help', occurredAt: now - 2000 },
    { type: 'goal', goalId: 'g1', goalTitle: 'Ask for more', result: 'own', occurredAt: now - 30 * 24 * 3600 * 1000 },
  ];
  render(<Goals circle={circle} goals={goals} entries={entries} {...h} />);
  expect(screen.getByText('Working on it · Speech and communication · with speech therapist')).toBeTruthy();
  expect(screen.getByText(/Last 2 weeks: 1 on their own · 1 with help/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Log practice for Ask for more' }));
  expect(h.onPractice).toHaveBeenCalledWith('g1');
  // A met goal can't be practiced, but can be edited back.
  expect(screen.queryByRole('button', { name: 'Log practice for Shoes on' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Shoes on' }));
  expect(h.onEdit).toHaveBeenCalledWith('g2');
});

it('adds a goal signed by whoever added it', () => {
  const onDone = vi.fn();
  render(<GoalForm circle={circle} me={me} onDone={onDone} />);
  fireEvent.change(screen.getByLabelText('Goal'), { target: { value: ' Ask for more ' } });
  fireEvent.click(screen.getByText('Social'));
  fireEvent.click(screen.getByText('Save'));
  expect(addGoal).toHaveBeenCalledWith('c1', expect.objectContaining({
    title: 'Ask for more', area: 'social', status: 'active', createdBy: 'u1', createdByName: 'Remy',
  }));
  expect(onDone).toHaveBeenCalled();
});

it('edits a goal, including marking it met, without changing who made it', () => {
  const goal = { id: 'g1', title: 'Ask for more', area: 'communication', status: 'active', details: '', workingWith: '', createdBy: 'u2' };
  render(<GoalForm circle={circle} me={me} goal={goal} onDone={vi.fn()} />);
  fireEvent.click(screen.getByText('Met'));
  fireEvent.click(screen.getByText('Save'));
  const patch = updateGoal.mock.calls[0][2];
  expect(updateGoal.mock.calls[0].slice(0, 2)).toEqual(['c1', 'g1']);
  expect(patch).toMatchObject({ status: 'met', updatedByName: 'Remy' });
  expect(patch.createdBy).toBeUndefined();
});

it('needs a goal title, and confirms before removing', () => {
  render(<GoalForm circle={circle} me={me} onDone={vi.fn()} />);
  fireEvent.click(screen.getByText('Save'));
  expect(screen.getByText('Say what the goal is.')).toBeTruthy();
  expect(addGoal).not.toHaveBeenCalled();
  cleanup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<GoalForm circle={circle} me={me} goal={{ id: 'g1', title: 'Old', status: 'active' }} onDone={vi.fn()} />);
  fireEvent.click(screen.getByText('Remove goal'));
  expect(deleteGoal).toHaveBeenCalledWith('c1', 'g1');
});
