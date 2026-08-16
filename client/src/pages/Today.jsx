import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useGroups } from "../GroupContext";
import GroupSwitcher from "../components/GroupSwitcher";
import CheerComposer from "../components/CheerComposer";
import FeedItem from "../components/FeedItem";
import Calendar from "../components/Calendar";
import StepsRace from "../components/StepsRace";
import { flagEmoji } from "../flag";
import { buildColorMap } from "../categoricalColors";
import { stepsToKm, closestFunDistance } from "../funDistances";

const emptyLog = {
  steps: 0,
  workoutDone: false,
  dietOk: false,
  usedShitMeal: false,
  usedShitDay: false,
  note: "",
  groupIds: [],
};

export default function Today() {
  const { user } = useAuth();
  const { groups, activeGroup, activeGroupId } = useGroups();
  const [log, setLog] = useState(emptyLog);
  const [todayDate, setTodayDate] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [members, setMembers] = useState([]);
  const [dayMembers, setDayMembers] = useState(null);
  const [feed, setFeed] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadAll = useCallback(async () => {
    if (!activeGroupId) return;
    setLoading(true);
    try {
      const [todayLog, memberList, feedList, board] = await Promise.all([
        api.getToday(),
        api.getMembers(activeGroupId),
        api.getFeed(activeGroupId),
        api.getLeaderboard(activeGroupId, "week"),
      ]);
      setLog(todayLog);
      setTodayDate(todayLog.date);
      setSelectedDate((current) => current || todayLog.date);
      setMembers(memberList);
      setFeed(feedList);
      setLeaderboard(board);
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
      const [memberList, feedList, board] = await Promise.all([
        api.getMembers(activeGroupId),
        api.getFeed(activeGroupId),
        api.getLeaderboard(activeGroupId, "week"),
      ]);
      setMembers(memberList);
      setFeed(feedList);
      setLeaderboard(board);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function toggle(field) {
    setLog((l) => ({ ...l, [field]: !l[field] }));
  }

  // groupIds vacio significa "cuenta para todos mis grupos". Al destildar uno
  // se materializa la lista; nunca se permite dejar cero grupos.
  function toggleGroup(groupId) {
    setLog((l) => {
      const allIds = groups.map((g) => g.id);
      const current = l.groupIds.length === 0 ? allIds : l.groupIds;
      const next = current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId];
      if (next.length === 0) return l;
      return { ...l, groupIds: next.length === allIds.length ? [] : next };
    });
  }

  if (loading || !selectedDate) return <p className="muted">Cargando...</p>;

  const me = members.find((m) => m.userId === user.id);
  const rules = activeGroup?.rules;
  // Mismo color por persona en el feed y en el Top de pasos.
  const feedColors = buildColorMap(members.map((m) => m.userId));
  const isToday = selectedDate === todayDate;
  const dayList = isToday
    ? members.map((m) => ({ userId: m.userId, displayName: m.displayName, country: m.country, city: m.city, log: m.today }))
    : dayMembers || [];

  const myBoard = leaderboard.find((e) => e.userId === user.id);
  const myKm = myBoard ? stepsToKm(myBoard.totalSteps) : 0;
  const funFact = myKm > 0 ? closestFunDistance(myKm) : null;
  const selectedGroupNames =
    log.groupIds.length === 0 ? "ambos" : groups.filter((g) => log.groupIds.includes(g.id)).map((g) => g.name).join(", ");

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

          {groups.length > 1 && (
            <div className="checkin-groups">
              <span className="checkin-groups-label">Este check-in cuenta para: {selectedGroupNames}</span>
              <div className="pill-row">
                {groups.map((g) => {
                  const selected = log.groupIds.length === 0 || log.groupIds.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      className={`pill ${selected ? "pill-active" : ""}`}
                      onClick={() => toggleGroup(g.id)}
                    >
                      {selected ? "✓ " : ""}
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </div>
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

            <div className="checklist">
              <button type="button" className="checklist-item" onClick={() => toggle("workoutDone")}>
                <span className={`checklist-box ${log.workoutDone ? "checklist-box-checked" : ""}`}>
                  {log.workoutDone ? "✓" : ""}
                </span>
                <span>🏋️ Fui al gym hoy</span>
              </button>
              <button type="button" className="checklist-item" onClick={() => toggle("dietOk")}>
                <span className={`checklist-box ${log.dietOk ? "checklist-box-checked" : ""}`}>
                  {log.dietOk ? "✓" : ""}
                </span>
                <span>🥗 Cumplí la dieta hoy</span>
              </button>
            </div>

            {rules && (rules.shitMealsPerWeek > 0 || rules.shitDaysPerMonth > 0) && (
              <div className="coupons">
                {rules.shitMealsPerWeek > 0 && (
                  <button
                    type="button"
                    className={`coupon ${log.usedShitMeal ? "coupon-used" : ""}`}
                    onClick={() => toggle("usedShitMeal")}
                  >
                    <span className="coupon-icon">🍔</span>
                    <span className="coupon-body">
                      <strong>Cheat meal</strong>
                      <span className="muted small">
                        {me ? `${me.stats.shitMealsUsedWeek}/${me.stats.shitMealsAllowed} esta semana` : ""}
                      </span>
                    </span>
                    <span className="coupon-check">{log.usedShitMeal ? "✓" : ""}</span>
                  </button>
                )}
                {rules.shitDaysPerMonth > 0 && (
                  <button
                    type="button"
                    className={`coupon ${log.usedShitDay ? "coupon-used" : ""}`}
                    onClick={() => toggle("usedShitDay")}
                  >
                    <span className="coupon-icon">🍕</span>
                    <span className="coupon-body">
                      <strong>Cheat day</strong>
                      <span className="muted small">
                        {me ? `${me.stats.shitDaysUsedMonth}/${me.stats.shitDaysAllowed} este mes` : ""}
                      </span>
                    </span>
                    <span className="coupon-check">{log.usedShitDay ? "✓" : ""}</span>
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

      <h2>Participantes del grupo</h2>
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

      {leaderboard.length > 0 && (
        <>
          {funFact && (
            <p className="steps-race-fun-fact">
              Caminaste <strong>{myKm.toFixed(1)} km</strong> esta semana — ¡como {funFact.label}! 🚶
            </p>
          )}
          <StepsRace entries={leaderboard} currentUserId={user.id} />
        </>
      )}

      <CheerComposer onSent={loadAll} />

      <h2>Actividad reciente</h2>
      {feed.length === 0 && (
        <p className="muted feed-empty">Todavía no hay actividad esta semana. Sé el primero en registrar tu día 💪</p>
      )}
      <div className="feed-list">
        {feed.map((item, i) => (
          <FeedItem key={i} item={item} currentUserId={user.id} colorMap={feedColors} />
        ))}
      </div>
      <p className="muted small-link">
        <Link to="/perfil">Ver mis grupos</Link>
      </p>
    </div>
  );
}
