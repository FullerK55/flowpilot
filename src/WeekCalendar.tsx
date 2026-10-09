import type { Block, CalEvent } from "./store";

const HOUR_HEIGHT = 56;
const START_HOUR = 7;
const END_HOUR = 23;

type Props = {
  days: Date[];
  events: CalEvent[];
  blocks: Block[];
  onToggleBlock: (id: number, completed: boolean) => void;
};

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function fmtTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return m === 0 ? `${h}${ampm}` : `${h}:${String(m).padStart(2, "0")}${ampm}`;
}

export function WeekCalendar({ days, events, blocks, onToggleBlock }: Props) {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const now = new Date();

  function position(start: Date, end: Date) {
    const dayBase = new Date(start);
    dayBase.setHours(START_HOUR, 0, 0, 0);
    const top = ((start.getTime() - dayBase.getTime()) / 3_600_000) * HOUR_HEIGHT;
    const height = Math.max(((end.getTime() - start.getTime()) / 3_600_000) * HOUR_HEIGHT, 20);
    return { top, height };
  }

  return (
    <div className="calendar">
      <div className="cal-inner">
        <div className="gutter">
          <div className="gutter-head" />
          {hours.map((h) => (
            <div key={h} className="hour-row" style={{ height: HOUR_HEIGHT }}>
              <span className="hour-label">
                {h % 12 || 12} {h >= 12 ? "PM" : "AM"}
              </span>
            </div>
          ))}
        </div>

        {days.map((day) => {
          const isToday = sameDay(day, now);
          const dayEvents = events.filter((e) => sameDay(new Date(e.startAt), day));
          const dayBlocks = blocks.filter((b) => sameDay(new Date(b.startAt), day));
          return (
            <div key={day.toISOString()} className="day-col">
              <div className="day-head">
                <span className="day-name">
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                <span className={`day-num ${isToday ? "today" : ""}`}>{day.getDate()}</span>
              </div>
              <div className="day-body">
                {hours.map((h) => (
                  <div key={h} className="hour-row" style={{ height: HOUR_HEIGHT }} />
                ))}

                {isToday && now.getHours() >= START_HOUR && now.getHours() < END_HOUR && (
                  <div
                    className="now-line"
                    style={{
                      top:
                        ((now.getTime() - new Date(day).setHours(START_HOUR, 0, 0, 0)) / 3_600_000) *
                        HOUR_HEIGHT,
                    }}
                  />
                )}

                {dayEvents.map((e) => {
                  const s = new Date(e.startAt);
                  const en = new Date(e.endAt);
                  const { top, height } = position(s, en);
                  return (
                    <div
                      key={`e-${e.id}`}
                      className={`block c-${e.color}`}
                      style={{ top, height }}
                      title={`${e.title} · ${fmtTime(s)}–${fmtTime(en)}`}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div className="block-title">{e.title}</div>
                        {height >= 34 && (
                          <div className="block-time">{fmtTime(s)} – {fmtTime(en)}</div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {dayBlocks.map((b) => {
                  const s = new Date(b.startAt);
                  const en = new Date(b.endAt);
                  const { top, height } = position(s, en);
                  return (
                    <div
                      key={`b-${b.id}`}
                      className={`block c-${b.color} ${b.completed ? "done" : ""}`}
                      style={{ top, height }}
                      title={`${b.title} · ${fmtTime(s)}–${fmtTime(en)}`}
                    >
                      <button
                        className="check-btn"
                        onClick={() => onToggleBlock(b.id, !b.completed)}
                        aria-label={b.completed ? "Mark not done" : "Mark done"}
                      >
                        {b.completed ? "✓" : "○"}
                      </button>
                      <div style={{ minWidth: 0 }}>
                        <div className="block-title">{b.title}</div>
                        {height >= 34 && (
                          <div className="block-time">{fmtTime(s)} – {fmtTime(en)}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
