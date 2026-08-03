import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useGroups } from "../GroupContext";

export default function CreateGroup() {
  const [form, setForm] = useState({
    name: "",
    minDailySteps: 10000,
    minWeeklyWorkouts: 5,
    shitMealsPerWeek: 1,
    shitDaysPerMonth: 0,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const groupsCtx = useGroups();
  const navigate = useNavigate();

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const group = await api.createGroup(form);
      await groupsCtx.refresh();
      groupsCtx.setActiveGroupId(group.id);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h1>Crear grupo</h1>
      <p className="muted">Estas reglas aplican a todos los que se unan — las verán antes de aceptar.</p>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Nombre del grupo
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ej. Los Lock-in" />
        </label>
        <label>
          Mínimo de pasos por día
          <input
            required
            type="number"
            min={0}
            value={form.minDailySteps}
            onChange={(e) => update("minDailySteps", e.target.value)}
          />
        </label>
        <label>
          Mínimo de entrenamientos por semana
          <input
            required
            type="number"
            min={0}
            value={form.minWeeklyWorkouts}
            onChange={(e) => update("minWeeklyWorkouts", e.target.value)}
          />
        </label>
        <label>
          Shit meals permitidos por semana
          <input
            required
            type="number"
            min={0}
            value={form.shitMealsPerWeek}
            onChange={(e) => update("shitMealsPerWeek", e.target.value)}
          />
        </label>
        <label>
          Shit days permitidos por mes
          <input
            required
            type="number"
            min={0}
            value={form.shitDaysPerMonth}
            onChange={(e) => update("shitDaysPerMonth", e.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Creando..." : "Crear grupo"}
        </button>
      </form>
      <p>
        <Link to="/onboarding">Volver</Link>
      </p>
    </div>
  );
}
