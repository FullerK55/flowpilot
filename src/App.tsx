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
        <button className="btn icon" onClick={() => setWeekOffset((w) => w + 1)} title="Next week">›</button>
        <button className="btn icon" onClick={() => setWeekOffset((w) => w + 4)} title="Forward 4 weeks">»</button>

        <div className="spacer" />

        <button className="btn outline" onClick={() => setEventDialog(true)}>+ Event</button>
        <button
          className="btn primary"
          onClick={() =>
            update((d) => {
              const n = replan(d);
              showToast(`Re-planned your schedule (${n} blocks placed)`);
            })
          }
        >
          ⟳ Recalculate
        </button>
      </header>

      <div className="main">
        <aside className="sidebar">
          <div className="sidebar-head">
            Tasks
            <button className="btn" onClick={() => setTaskDialog({ open: true, task: null })}>
              + Add
            </button>
          </div>
          <div className="sidebar-body">
            {activeTasks.length === 0 && (
              <p className="empty">No tasks yet. Add one and it gets scheduled automatically.</p>
            )}
            {activeTasks.map((t) => (
              <div className="task-card" key={t.id}>
                <div className="task-row">
                  <span className={`dot d-${t.color}`} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="task-title">{t.title}</div>
                    <div className="task-meta">
                      <span>{fmtDur(t.durationMin)}</span>
                      {t.recurring !== "none" && <span className="badge">↻ {t.recurring}</span>}
                      {t.priority === "high" && <span className="badge high">high</span>}
                      {t.deadline && (
                        <span>
                          · due{" "}
                          {new Date(t.deadline).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="task-actions">
                    <button
                      className="mini-btn"
                      title="Mark done"
                      onClick={() =>
                        update((d) => {
                          const task = d.tasks.find((x) => x.id === t.id);
                          if (task) task.completed = true;
                          d.blocks = d.blocks.filter((b) => b.taskId !== t.id);
                          replan(d);
                        })
                      }
                    >
                      ✓
                    </button>
                    <button
                      className="mini-btn"
                      title="Edit"
                      onClick={() => setTaskDialog({ open: true, task: t })}
                    >
                      ✎
                    </button>
                    <button
                      className="mini-btn"
                      title="Delete"
                      onClick={() =>
                        update((d) => {
                          d.tasks = d.tasks.filter((x) => x.id !== t.id);
                          d.blocks = d.blocks.filter((b) => b.taskId !== t.id);
                        })
                      }
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="sidebar-foot">
            {activeTasks.length} task{activeTasks.length === 1 ? "" : "s"} · auto-scheduled around your events
          </div>
        </aside>

        <WeekCalendar
          days={days}
          events={data.events}
          blocks={data.blocks}
          onToggleBlock={(id, completed) =>
            update((d) => {
              const b = d.blocks.find((x) => x.id === id);
              if (b) b.completed = completed;
            })
          }
        />
      </div>

      {taskDialog.open && (
        <TaskDialog
          task={taskDialog.task}
          onClose={() => setTaskDialog({ open: false, task: null })}
          onSave={(payload) =>
            update((d) => {
              if (taskDialog.task) {
                const t = d.tasks.find((x) => x.id === taskDialog.task!.id);
                if (t) Object.assign(t, payload);
              } else {
                d.tasks.push({
                  id: d.nextId++,
                  completed: false,
                  createdAt: new Date().toISOString(),
                  ...payload,
                });
              }
              replan(d);
            })
          }
        />
      )}

      {eventDialog && (
        <EventDialog
          defaultDay={days[0] ?? new Date()}
          onClose={() => setEventDialog(false)}
          onSave={(payload) =>
            update((d) => {
              d.events.push({ id: d.nextId++, ...payload });
              replan(d);
            })
          }
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
