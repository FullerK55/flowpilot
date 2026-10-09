import type { Block, CalEvent, PlannerData, Task } from "./store";

export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 22;
export const HORIZON_DAYS = 7;

type Interval = { start: number; end: number };

type TaskInstance = {
  task: Task;
  recurDay: string | null;
  deadlineMs: number;
};

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayWindow(d: Date): Interval {
  const start = new Date(d);
  start.setHours(DAY_START_HOUR, 0, 0, 0);
  const end = new Date(d);
  end.setHours(DAY_END_HOUR, 0, 0, 0);
  return { start: start.getTime(), end: end.getTime() };
}

const PRIORITY_WEIGHT: Record<Task["priority"], number> = { high: 0, normal: 1, low: 2 };

function expandInstances(tasks: Task[], now: Date, horizonEnd: Date): TaskInstance[] {
  const instances: TaskInstance[] = [];
  for (const task of tasks) {
    if (task.completed) continue;
    if (task.recurring === "none") {
      instances.push({
        task,
        recurDay: null,
        deadlineMs: task.deadline ? new Date(task.deadline).getTime() : horizonEnd.getTime(),
      });
      continue;
    }
    for (let i = 0; i < HORIZON_DAYS; i++) {
      const day = new Date(now);
      day.setDate(day.getDate() + i);
      const dow = day.getDay();
      if (task.recurring === "weekdays" && (dow === 0 || dow === 6)) continue;
      if (task.recurring === "weekly" && i > 0 && dow !== now.getDay()) continue;
      const win = dayWindow(day);
      const instanceDeadline = Math.min(
        task.deadline ? new Date(task.deadline).getTime() : Infinity,
        win.end,
      );
      instances.push({ task, recurDay: dayKey(day), deadlineMs: instanceDeadline });
    }
  }
  instances.sort((a, b) => {
    if (a.deadlineMs !== b.deadlineMs) return a.deadlineMs - b.deadlineMs;
    const p = PRIORITY_WEIGHT[a.task.priority] - PRIORITY_WEIGHT[b.task.priority];
    if (p !== 0) return p;
    return a.task.durationMin - b.task.durationMin;
  });
  return instances;
}

function findGap(busy: Interval[], win: Interval, earliest: number, needMs: number): Interval | null {
  const start = Math.max(win.start, earliest);
  const end = win.end;
  if (end - start < needMs) return null;
  const sorted = busy
    .filter((b) => b.end > start && b.start < end)
    .map((b) => ({ start: Math.max(b.start, start), end: Math.min(b.end, end) }))
    .sort((a, b) => a.start - b.start);
  let cursor = start;
  for (const b of sorted) {
    if (b.start - cursor >= needMs) return { start: cursor, end: cursor + needMs };
    cursor = Math.max(cursor, b.end);
  }
  if (end - cursor >= needMs) return { start: cursor, end: cursor + needMs };
  return null;
}

/**
 * Re-plan the whole schedule in-place on `data`:
 * keeps completed blocks as fixed, re-lays-out everything else from now.
 * Returns number of blocks placed.
 */
export function replan(data: PlannerData, now = new Date()): number {
  const horizonEnd = new Date(now);
  horizonEnd.setDate(horizonEnd.getDate() + HORIZON_DAYS);

  const completedBlocks = data.blocks.filter((b) => b.completed);
  data.blocks = completedBlocks;

  const doneRecur = new Set(
    completedBlocks.filter((b) => b.recurDay).map((b) => `${b.taskId}:${b.recurDay}`),
  );

  const busy: Interval[] = [
    ...data.events.map((e: CalEvent) => ({
      start: new Date(e.startAt).getTime(),
      end: new Date(e.endAt).getTime(),
    })),
    ...completedBlocks.map((b: Block) => ({
      start: new Date(b.startAt).getTime(),
      end: new Date(b.endAt).getTime(),
    })),
  ];

  const earliest = new Date(now);
  earliest.setSeconds(0, 0);
  earliest.setMinutes(earliest.getMinutes() + (5 - (earliest.getMinutes() % 5)));
  const earliestMs = earliest.getTime();

  const instances = expandInstances(data.tasks, now, horizonEnd).filter(
    (i) => !i.recurDay || !doneRecur.has(`${i.task.id}:${i.recurDay}`),
  );

  let placed = 0;
  for (const inst of instances) {
    const needMs = inst.task.durationMin * 60_000;
    let slot: Interval | null = null;
    if (inst.recurDay) {
      const [y, m, d] = inst.recurDay.split("-").map(Number);
      slot = findGap(busy, dayWindow(new Date(y, m - 1, d)), earliestMs, needMs);
    } else {
      for (let i = 0; i < HORIZON_DAYS && !slot; i++) {
        const day = new Date(now);
        day.setDate(day.getDate() + i);
        const win = dayWindow(day);
        const capped = { start: win.start, end: Math.min(win.end, inst.deadlineMs) };
        slot = findGap(busy, capped, earliestMs, needMs);
      }
    }
    if (!slot) continue;
    busy.push(slot);
    data.blocks.push({
      id: data.nextId++,
      taskId: inst.task.id,
      title: inst.task.title,
      startAt: new Date(slot.start).toISOString(),
      endAt: new Date(slot.end).toISOString(),
      color: inst.task.color,
      completed: false,
      recurDay: inst.recurDay,
    });
    placed++;
  }
  return placed;
}
