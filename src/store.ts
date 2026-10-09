export type Priority = "low" | "normal" | "high";
export type Recurring = "none" | "daily" | "weekdays" | "weekly";

export interface Task {
  id: number;
  title: string;
  durationMin: number;
  deadline: string | null; // ISO
  priority: Priority;
  color: string;
  recurring: Recurring;
  completed: boolean;
  createdAt: string;
}

export interface CalEvent {
  id: number;
  title: string;
  startAt: string;
  endAt: string;
  color: string;
}

export interface Block {
  id: number;
  taskId: number;
  title: string;
  startAt: string;
  endAt: string;
  color: string;
  completed: boolean;
  recurDay: string | null;
}

export interface PlannerData {
  tasks: Task[];
  events: CalEvent[];
  blocks: Block[];
  nextId: number;
}

const KEY = "flowpilot-data-v1";

const EMPTY: PlannerData = { tasks: [], events: [], blocks: [], nextId: 1 };

export function loadData(): PlannerData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw);
    return { ...EMPTY, ...parsed };
  } catch {
    return { ...EMPTY };
  }
}

export function saveData(d: PlannerData) {
  localStorage.setItem(KEY, JSON.stringify(d));
}
