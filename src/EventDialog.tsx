import { useState } from "react";
import { COLORS } from "./App";

export type EventPayload = {
  title: string;
  startAt: string;
  endAt: string;
  color: string;
};

type Props = {
  defaultDay: Date;
  onClose: () => void;
  onSave: (payload: EventPayload) => void;
};

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventDialog({ defaultDay, onClose, onSave }: Props) {
  const s0 = new Date(defaultDay);
  s0.setHours(12, 0, 0, 0);
  const e0 = new Date(s0);
  e0.setHours(13, 0, 0, 0);

  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState(toLocalInput(s0));
  const [endAt, setEndAt] = useState(toLocalInput(e0));
  const [color, setColor] = useState("blue");

  function save() {
    const s = new Date(startAt);
    const e = new Date(endAt);
    if (!title.trim() || isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return;
    onSave({ title: title.trim(), startAt: s.toISOString(), endAt: e.toISOString(), color });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New fixed event</h2>
        <p className="sub">Meetings, classes, appointments — the scheduler plans tasks around these.</p>
        <div className="field">
          <label>Title</label>
          <input autoFocus placeholder="e.g. Team standup" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Starts</label>
            <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
          <div className="field">
            <label>Ends</label>
            <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
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
          <button className="btn primary" onClick={save} disabled={!title.trim()}>Add event</button>
        </div>
      </div>
    </div>
  );
}
