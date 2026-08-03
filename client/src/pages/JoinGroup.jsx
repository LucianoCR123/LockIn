import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useGroups } from "../GroupContext";

export default function JoinGroup() {
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const groupsCtx = useGroups();
  const navigate = useNavigate();

  async function handleLookup(e) {
    e.preventDefault();
    setError("");
    setPreview(null);
    setSubmitting(true);
    try {
      const data = await api.previewGroup(code.trim().toUpperCase());
      setPreview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin() {
    setError("");
    setSubmitting(true);
    try {
      const group = await api.joinGroup(preview.inviteCode);
      await groupsCtx.refresh();
      groupsCtx.setActiveGroupId(group.id);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (preview) {
    const r = preview.rules;
    return (
      <div className="card">
        <h1>{preview.name}</h1>
        <p className="muted">
          Creado por {preview.createdByName} · {preview.memberCount} miembro{preview.memberCount === 1 ? "" : "s"}
        </p>
        <h2>Reglas del grupo</h2>
        <ul className="rules-list">
          <li>Mínimo {r.minDailySteps.toLocaleString()} pasos por día</li>
          <li>Mínimo {r.minWeeklyWorkouts} entrenamientos por semana</li>
          <li>{r.shitMealsPerWeek} shit meal(s) permitidos por semana</li>
          <li>{r.shitDaysPerMonth} shit day(s) permitidos por mes</li>
        </ul>
        {preview.alreadyMember ? (
          <p className="success">Ya perteneces a este grupo.</p>
        ) : (
          <>
            <p className="muted">Al unirte aceptas cumplir estas reglas frente al grupo.</p>
            {error && <p className="error">{error}</p>}
            <button onClick={handleJoin} disabled={submitting}>
              {submitting ? "Uniéndome..." : "Acepto las reglas y me uno"}
            </button>
          </>
        )}
        <p>
          <button className="link-button" onClick={() => setPreview(null)}>
            Buscar otro código
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>Unirme a un grupo</h1>
      <form onSubmit={handleLookup} className="form">
        <label>
          Código de invitación
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ej. AB3D9K"
            style={{ textTransform: "uppercase" }}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Buscando..." : "Buscar grupo"}
        </button>
      </form>
      <p>
        <Link to="/onboarding">Volver</Link>
      </p>
    </div>
  );
}
