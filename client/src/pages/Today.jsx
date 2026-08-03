import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useGroups } from "../GroupContext";
import GroupSwitcher from "../components/GroupSwitcher";
import CheerComposer from "../components/CheerComposer";
import FeedItem from "../components/FeedItem";
import Calendar from "../components/Calendar";
import { flagEmoji } from "../flag";

const emptyLog = { steps: 0, workoutDone: false, dietOk: false, usedShitMeal: false, usedShitDay: false, note: "" };

export default function Today() {
  const { user } = useAuth();
  const { activeGroup, activeGroupId } = useGroups();
  const [log, setLog] = useState(emptyLog);
  const [todayDate, setTodayDate] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [members, setMembers] = useState([]);
  const [dayMembers, setDayMembers] = useState(null);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAll = useCallback(async () => {
    if (!activeGroupId) return;
    setLoading(true);
    try {
      const [todayLog, memberList, feedList] = await Promise.all([
        api.getToday(),
        api.getMembers(activeGroupId),
        api.getFeed(activeGroupId),
      ]);
      setLog(todayLog);
      setTodayDate(todayLog.date);
      setSelectedDate((current) => current || todayLog.date);
      setMembers(memberList);
      setFeed(feedList);
    } finally {
      setLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!activeGroupId || !selectedDate || !todayDate || selectedDate === todayDate) {
      setDayMembers(null);
      return;
    }
    let cancelled = false;
    api.getDay(activeGroupId, selectedDate).then((data) => {
      if (!cancelled) setDayMembers(data);
    });
    return () => {
      cancelled = true;
    };
  }, [activeGroupId, selectedDate, todayDate]);

  async function handleSave(e) {
    e?.preventDefault();
    setError("");
    setSaving(true);
    try {
      const saved = await api.saveToday(log);
      setLog(saved);
      const [memberList, feedList] = await Promise.all([api.getMembers(activeGroupId), api.getFeed(activeGroupId)]);
      setMembers(memberList);
      setFeed(feedList);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function toggle(field) {
    setLog((l) => ({ ...l, [field]: !l[field] }));
  }

  if (loading || !selectedDate) return <p className="muted">Cargando...</p>;

  const me = members.find((m) => m.userId === user.id);
  const rules = activeGroup?.rules;
  const isToday = selectedDate === todayDate;
  const dayList = isToday
    ? members.map((m) => ({ userId: m.userId, displayName: m.displayName, country: m.country, city: m.city, log: m.today }))
    : dayMembers || [];

  return (
    <div className="today-page">
      <GroupSwitcher />

      <Calendar groupId={activeGroupId} selectedDate={selectedDate} todayDate={todayDate} onSelectDate={setSelectedDate} />

      {isToday ? (
        <div className="checkin-card">
          <h1>Hoy</h1>
          {rules && (
            <p className="muted">
              Meta: {rules.minDailySteps.toLocaleString()} pasos · {rules.minWeeklyWorkouts} entrenos/semana
            </p>
          )}
          <form onSubmit={handleSave} className="form">
            <label>
              Pasos de hoy
              <input
                type="number"
                min={0}
                value={log.steps}
                onChange={(e) => setLog({ ...log, steps: Number(e.target.value) })}
              />
            </label>
            <div className="pill-row">
              <button type="button" className={`pill ${log.workoutDone ? "pill-active" : ""}`} onClick={() => toggle("workoutDone")}>
                🏋️ Fui al gym
              </button>
              <button type="button" className={`pill ${log.dietOk ? "pill-active" : ""}`} onClick={() => toggle("dietOk")}>
                🥗 Cumplí la dieta
              </button>
            </div>
            {rules && (rules.shitMealsPerWeek > 0 || rules.shitDaysPerMonth > 0) && (
              <div className="pill-row">
                {rules.shitMealsPerWeek > 0 && (
                  <button type="button" className={`pill ${log.usedShitMeal ? "pill-active" : ""}`} onClick={() => toggle("usedShitMeal")}>
                    🍔 Shit meal {me ? `(${me.stats.shitMealsUsedWeek}/${me.stats.shitMealsAllowed})` : ""}
                  </button>
                )}
                {rules.shitDaysPerMonth > 0 && (
                  <button type="button" className={`pill ${log.usedShitDay ? "pill-active" : ""}`} onClick={() => toggle("usedShitDay")}>
                    🍕 Shit day {me ? `(${me.stats.shitDaysUsedMonth}/${me.stats.shitDaysAllowed})` : ""}
                  </button>
                )}
              </div>
            )}
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar check-in"}
            </button>
          </form>
        </div>
      ) : (
        <div className="checkin-card day-viewing-banner">
          <p className="muted">
            Viendo el {selectedDate}. Los check-ins pasados no se pueden editar, solo consultar.
          </p>
          <button type="button" className="pill" onClick={() => setSelectedDate(todayDate)}>
            Volver a hoy
          </button>
        </div>
      )}

      <h2>{isToday ? "Actividad de hoy" : "Ese día"}</h2>
      <ul className="member-list">
        {dayList.map((m) => (
          <li key={m.userId} className="member-row">
            <div className="member-info">
              <strong>
                {flagEmoji(m.country)} {m.displayName}
                {m.userId === user.id ? " (tú)" : ""}
              </strong>
              <div className="member-badges">
                {m.log?.steps > 0 && <span className="badge-mini">👣 {m.log.steps.toLocaleString()}</span>}
                {m.log?.workoutDone && <span className="badge-mini">🏋️</span>}
                {m.log?.dietOk && <span className="badge-mini">🥗</span>}
                {m.log?.usedShitMeal && <span className="badge-mini">🍔</span>}
                {m.log?.usedShitDay && <span className="badge-mini">🍕</span>}
                {!m.log && <span className="muted small">Sin registrar</span>}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <CheerComposer members={members} onSent={loadAll} />

      <h2>Actividad reciente</h2>
      {feed.length === 0 && <p className="muted">Todavía no hay actividad esta semana.</p>}
      <div className="feed-list">
        {feed.map((item, i) => (
          <FeedItem key={i} item={item} currentUserId={user.id} />
        ))}
      </div>
      <p className="muted small-link">
        <Link to="/perfil">Ver mis grupos</Link>
      </p>
    </div>
  );
}
