import {
  buildDemoWeek, DEMO_CARE_PLAN, DEMO_GOALS, demoGoalPractice, demoResources,
} from '../lib/demoWeek.js';
import { addEntriesBatch } from './entries.js';
import { updateCircle } from './circles.js';
import { addResource } from './resources.js';
import { addGoal } from './goals.js';

// A week of sample entries, plus a care plan, resources and goals where the circle has none yet.
export async function seedDemo(circle, me, { hasResources = false, hasGoals = false } = {}) {
  const now = Date.now();
  const entries = buildDemoWeek(now, me);
  if (!hasGoals) {
    const goals = DEMO_GOALS.map((g) => ({
      ...g, id: addGoal(circle.id, { ...g, createdAt: now, createdBy: me.uid, createdByName: me.name || 'Remy' }),
    }));
    entries.push(...demoGoalPractice(now, me, goals));
  }
  await addEntriesBatch(circle.id, entries);
  if (!circle.meds?.length && !circle.profile) await updateCircle(circle.id, DEMO_CARE_PLAN);
  if (!hasResources) for (const r of demoResources(now, me)) addResource(circle.id, r);
}
