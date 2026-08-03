import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useGroups } from "../GroupContext";
import { COUNTRIES } from "../countries";

export default function Register() {
  const [form, setForm] = useState({ email: "", password: "", displayName: "", country: "", city: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { setUser } = useAuth();
  const groupsCtx = useGroups();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const user = await api.register({ ...form, timezone });
      setUser(user);
      await groupsCtx.refresh();
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card auth-card">
      <div className="brand-mark">LockIn</div>
      <h1>Crear cuenta</h1>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Nombre
          <input
            required
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="Cómo te van a ver tus amigos"
          />
        </label>
        <label>
          Email
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          Contraseña
          <input
            required
            type="password"
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <label>
          País (opcional)
          <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
            <option value="">Prefiero no decir</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ciudad (opcional)
          <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ej. Toronto" />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
      <p>
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  );
}
