import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useGroups } from "../GroupContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
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
      const user = await api.login(form);
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
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Email
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          Contraseña
          <input
            required
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p>
        ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
      </p>
    </div>
  );
}
