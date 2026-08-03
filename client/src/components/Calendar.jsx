import { useEffect, useState } from "react";
import { api } from "../api";
import { addDays, startOfWeek, endOfMonth, dateRange, shiftMonth, formatDayLabel, formatMonthLabel } from "../dateUtils";

function dotClass(day) {
  if (!day || day.loggedCount === 0) return "cal-dot-empty";
  if (day.totalMembers > 0 && day.compliantCount === day.totalMembers) return "cal-dot-full";
  if (day.compliantCount > 0) return "cal-dot-partial";
  return "cal-dot-none";
}

export default function Calendar({ groupId, selectedDate, todayDate, onSelectDate }) {
  const [expanded, setExpanded] = useState(false);
  const [viewMonth, setViewMonth] = useState(selectedDate.slice(0, 7));
  const [summary, setSummary] = useState({});

  useEffect(() => {
    if (!groupId) return;
    api.getCalendar(groupId, viewMonth).then(setSummary);
  }, [groupId, viewMonth]);

  const weekStart = startOfWeek(selectedDate);
  const weekDays = dateRange(weekStart, addDays(weekStart, 6));

  let monthGrid = [];
  if (expanded) {
    const first = `${viewMonth}-01`;
    const last = endOfMonth(first);
    const gridStart = startOfWeek(first);
    const gridEnd = addDays(startOfWeek(last), 6);
    const allDays = dateRange(gridStart, gridEnd);
    for (let i = 0; i < allDays.length; i += 7) monthGrid.push(allDays.slice(i, i + 7));
  }

  return (
    <div className="calendar">
      <div className="cal-week-row">
        {weekDays.map((date) => (
          <button
            key={date}
            type="button"
            className={`cal-day ${date === selectedDate ? "cal-day-selected" : ""} ${date === todayDate ? "cal-day-today" : ""}`}
            onClick={() => onSelectDate(date)}
          >
            <span className="cal-day-label">{formatDayLabel(date)}</span>
            <span className={`cal-dot ${dotClass(summary[date])}`} />
          </button>
        ))}
      </div>

      <button type="button" className="link-button cal-toggle" onClick={() => setExpanded((v) => !v)}>
        {expanded ? "▲ Ver semana" : "▼ Ver mes"}
      </button>

      {expanded && (
        <div className="cal-month">
          <div className="cal-month-nav">
            <button type="button" onClick={() => setViewMonth((m) => shiftMonth(m, -1))}>
              ‹
            </button>
            <strong>{formatMonthLabel(viewMonth)}</strong>
            <button type="button" onClick={() => setViewMonth((m) => shiftMonth(m, 1))}>
              ›
            </button>
          </div>
          {monthGrid.map((row, i) => (
            <div className="cal-month-row" key={i}>
              {row.map((date) => {
                const inMonth = date.slice(0, 7) === viewMonth;
                return (
                  <button
                    key={date}
                    type="button"
                    className={`cal-day cal-day-mini ${date === selectedDate ? "cal-day-selected" : ""} ${
                      !inMonth ? "cal-day-outside" : ""
                    } ${date === todayDate ? "cal-day-today" : ""}`}
                    onClick={() => {
                      onSelectDate(date);
                      setExpanded(false);
                    }}
                  >
                    <span className="cal-day-num">{Number(date.slice(8, 10))}</span>
                    <span className={`cal-dot ${dotClass(summary[date])}`} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
