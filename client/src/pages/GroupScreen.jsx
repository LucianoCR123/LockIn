import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useGroups } from "../GroupContext";
import GroupSwitcher from "../components/GroupSwitcher";
import { flagEmoji } from "../flag";

export default function GroupScreen() {
  const { user } = useAuth();
  const { activeGroup, activeGroupId } = useGroups();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!activeGroupId) return;
    setLoading(true);
    try {
      setMembers(await api.getMembers(activeGroupId));
    } finally {
      setLoading(false);
    }
  }, [activeGroupId]);

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

      <ul className="rules-list">
        <li>Mínimo {r.minDailySteps.toLocaleString()} pasos por día</li>
        <li>Mínimo {r.minWeeklyWorkouts} entrenamientos por semana</li>
        <li>{r.shitMealsPerWeek} shit meal(s) por semana</li>
        <li>{r.shitDaysPerMonth} shit day(s) por mes</li>
      </ul>

      <h2>Ranking de la semana</h2>
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
