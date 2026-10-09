import { useMemo, useState } from "react";
import { loadData, saveData, type PlannerData, type Task } from "./store";
import { replan } from "./scheduler";
import { WeekCalendar } from "./WeekCalendar";
import { TaskDialog } from "./TaskDialog";
import { EventDialog } from "./EventDialog";

export const COLORS = ["green", "blue", "orange", "purple", "red", "teal"];

export function fmtDur(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function App() {
  const [data, setData] = useState<PlannerData>(loadData);
  const [dayCount, setDayCount] = useState(7);
  const [weekOffset, setWeekOffset] = useState(0);
  const [taskDialog, setTaskDialog] = useState<{ open: boolean; task: Task | null }>({
    open: false,
    task: null,
  });
  const [eventDialog, setEventDialog] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function update(mutate: (d: PlannerData) => void) {
    setData((prev) => {
      const next: PlannerData = JSON.parse(JSON.stringify(prev));
      mutate(next);
      saveData(next);
      return next;
    });
  }

  const days = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + weekOffset * 7);
    return Array.from({ length: dayCount }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekOffset, dayCount]);

  const activeTasks = data.tasks.filter((t) => !t.completed);

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          FlowPilot
        </div>

        <select
          className="inline"
          value={dayCount}
          onChange={(e) => setDayCount(Number(e.target.value))}
        >
          <option value={1}>1 day</option>
          <option value={3}>3 days</option>
          <option value={7}>7 days</option>
        </select>

        <button className="btn icon" onClick={() => setWeekOffset((w) => w - 4)} title="Back 4 weeks">«</button>
        <button className="btn icon" onClick={() => setWeekOffset((w) => w - 1)} title="Previous week">‹</button>
        <button className="btn" onClick={() => setWeekOffset(0)}>Today</button>
        <button className=