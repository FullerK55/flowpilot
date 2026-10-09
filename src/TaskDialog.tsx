import { useState } from "react";
import type { Priority, Recurring, Task } from "./store";
import { COLORS } from "./App";

export type TaskPayload = {
  title: string;
  durationMin: number;
  deadline: string | null;
  priority: Priority;
  recurring: Recurring;
  color: string;
};

type Props = {
  task: Task | null;
  onClose: () => void;
  onSave: (payload: TaskPayload) => void;
};

const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240];

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TaskDialog({ task, onClose, onSave }: Props) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [durationMin, setDurationMin] = useState(String(task?.durationMin ?? 60));
  const [deadline, setDeadline] = useState(toLocalInput(task?.deadline ?? null));
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "normal");
  const [recurring, setRecurring] = useState<Recurring>(task?.recurring ?? "none");
  const [color, setColor] = useState(task?.color ?? "green");

  function save() {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      durationMin: Number(durationMin),
      deadline: deadline ? new Date(deadline).toISOString() : null,
      priority,
      recurring,
      color,
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{task ? "Edit task" : "New task"}</h2>
        <div className="field">
          <label>What do you need to do?</label>
          <input
            autoFocus
            placeholder="e.g. Prep training"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Duration</label>
            <select value={durationMin} onChange={(e) => setDurationMin(e.target.value)}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d < 60 ? `${d} min` : d % 60 === 0 ? `${d / 60} hr` : `${Math.floor(d / 60)}h ${d % 60}m`}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Repeat</label>
            <select value={recurring} onChange={(e) => setRecurring(e.target.value as Recurring)}>
              <option value="none">One-time</option>
              <option value="daily">Every day</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="field">
            <label>Deadline (optional)</label>
            <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Color</label>
          <div className="swatches">
            {COLORS.map((c) => (
              <button
                key={c}
                aria-label={c}
                className={`swatch d-${c} ${color === c ? "active" : ""}`}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn outline" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={!title.trim()}>
            {task ? "Save changes" : "Add & schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
