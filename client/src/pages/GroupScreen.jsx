import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useGroups } from "../GroupContext";
import GroupSwitcher from "../components/GroupSwitcher";
import StepsRace from "../components/StepsRace";
import { flagEmoji } from "../flag";
import { stepsToKm, closestFunDistance } from "../funDistances";

const PERIODS = [
  { key: "day", label: "Hoy" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
];

export default function GroupScreen() {
  const { user } = useAuth();
  const { activeGroup, activeGroupId } = useGroups();
  const [members, setMembers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState("week");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!activeGroupId) return;
    setLoading(true);
    try {
      const [memberList, board] = await Promise.all([
        api.getMembers(activeGroupId),
        api.getLeaderboard(activeGroupId, period),
      ]);
      setMembers(memberList);
      setLeaderboard(board);
    } finally {
      setLoading(false);
    }
  }, [activeGroupId, period]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !activeGroup) return <p className="muted">Cargando...</p>;

  const r = activeGroup.rules;

  function copyCode() {
    navigator.clipboard?.writeText(activeGroup.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const myEntry = leaderboard.find((e) => e.userId === user.id);
  const myKm = myEntry ? stepsToKm(myEntry.totalSteps) : 0;
  const funFact = myKm > 0 ? closestFunDistance(myKm) : null;
  const periodLabel = { day: "hoy", week: "esta semana", month: "este mes" }[period];

  return (
    <div className="group-page">
      <GroupSwitcher />
      <h1>{activeGroup.name}</h1>

      <div className="invite-box">
        <div>
          <span className="muted small">Código de invitación</span>
          <div className="invite-code">{activeGroup.inviteCode}</div>
        </div>
        <button type="button" onClick={copyCode}>
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>

      <h2>Reglas de este grupo</h2>
      <ul className="rules-list">
        <li>Mínimo {r.minDailySteps.toLocaleString()} pasos por día</li>
        <li>Mínimo {r.minWeeklyWorkouts} entrenamientos por semana</li>
        <li>{r.shitMealsPerWeek} cheat meal(s) por semana</li>
        <li>{r.shitDaysPerMonth} cheat day(s) por mes</li>
      </ul>

      <h2>🏆 Top de pasos</h2>
      <div className="pill-row">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`pill ${period === p.key ? "pill-active" : ""}`}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {funFact && (
        <p className="steps-race-fun-fact">
          Caminaste <strong>{myKm.toFixed(1)} km</strong> {periodLabel} — ¡como {funFact.label}! 🚶
        </p>
      )}

      <StepsRace entries={leaderboard} currentUserId={user.id} />

      {(r.shitMealsPerWeek > 0 || r.shitDaysPerMonth > 0) && (
        <>
          <h2>🎟️ Comodines</h2>
          <ul className="member-list">
            {members.map((m) => (
              <li key={m.userId} className="member-row">
                <div className="member-info">
                  <strong>
                    {flagEmoji(m.country)} {m.displayName}
                    {m.userId === user.id ? " (tú)" : ""}
                  </strong>
                  <div className="member-badges">
                    {r.shitMealsPerWeek > 0 && (
                      <span className={`badge-mini ${m.stats.shitMealsUsedWeek >= m.stats.shitMealsAllowed ? "badge-mini-used" : ""}`}>
                        🍔 {m.stats.shitMealsUsedWeek}/{m.stats.shitMealsAllowed}
                      </span>
                    )}
                    {r.shitDaysPerMonth > 0 && (
                      <span className={`badge-mini ${m.stats.shitDaysUsedMonth >= m.stats.shitDaysAllowed ? "badge-mini-used" : ""}`}>
                        🍕 {m.stats.shitDaysUsedMonth}/{m.stats.shitDaysAllowed}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>Calificación</h2>
      <p className="muted small">Ranking de quién está cumpliendo mejor las reglas del grupo.</p>
      <ul className="member-list">
        {members.map((m, i) => (
          <li key={m.userId} className="member-row">
            <span className="rank">{i + 1}</span>
            <div className="member-info">
              <strong>
                {flagEmoji(m.country)} {m.displayName}
                {m.userId === user.id ? " (tú)" : ""}
              </strong>
              {m.city && <span className="muted small">{m.city}</span>}
              <div className="member-badges">
                {m.today.steps > 0 && <span className="badge-mini">👣 {m.today.steps.toLocaleString()}</span>}
                {m.today.workoutDone && <span className="badge-mini">🏋️</span>}
                {m.today.dietOk && <span className="badge-mini">🥗</span>}
                {m.today.usedShitMeal && <span className="badge-mini">🍔</span>}
                {m.today.usedShitDay && <span className="badge-mini">🍕</span>}
              </div>
              <span className="muted small">🔥 racha de {m.stats.streak} día{m.stats.streak === 1 ? "" : "s"}</span>
            </div>
            <span className="score">{m.stats.weeklyScore}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
