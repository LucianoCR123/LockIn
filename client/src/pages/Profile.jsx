import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useGroups } from "../GroupContext";
import { COUNTRIES } from "../countries";
import { flagEmoji } from "../flag";

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const { groups, activeGroupId, setActiveGroupId } = useGroups();
  const [statsByGroup, setStatsByGroup] = useState({});
  const [error, setError] = useState("");
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationForm, setLocationForm] = useState({ country: user.country || "", city: user.city || "" });
  const [savingLocation, setSavingLocation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      const entries = await Promise.all(
        groups.map(async (g) => {
          const members = await api.getMembers(g.id);
          const me = members.find((m) => m.userId === user.id);
          return [g.id, me?.stats || null];
        })
      );
      if (!cancelled) setStatsByGroup(Object.fromEntries(entries));
    }
    if (groups.length > 0) loadStats();
    return () => {
      cancelled = true;
    };
  }, [groups, user.id]);

  async function handleSaveLocation(e) {
    e.preventDefault();
    setSavingLocation(true);
    setError("");
    try {
      const updated = await api.updateProfile(locationForm);
      setUser(updated);
      setEditingLocation(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingLocation(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  async function handleDelete() {
    if (!confirm("Esto borra tu cuenta y todos tus check-ins de forma permanente. ¿Continuar?")) return;
    setError("");
    try {
      await api.deleteAccount();
      navigate("/login");
      window.location.reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="profile-page-content">
      <div className="profile-header">
        <div className="avatar-circle">{user.displayName.slice(0, 1).toUpperCase()}</div>
        <h1>{user.displayName}</h1>
        <p className="muted">{user.email}</p>
        {!editingLocation && (
          <p className="muted">
            {user.country ? (
              <>
                {flagEmoji(user.country)} {user.city || COUNTRIES.find((c) => c.code === user.country)?.name}
              </>
            ) : (
              "Sin ubicación"
            )}{" "}
            ·{" "}
            <button type="button" className="link-button" onClick={() => setEditingLocation(true)}>
              editar
            </button>
          </p>
        )}
        {editingLocation && (
          <form onSubmit={handleSaveLocation} className="form location-edit-form">
            <select value={locationForm.country} onChange={(e) => setLocationForm({ ...locationForm, country: e.target.value })}>
              <option value="">Prefiero no decir</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              value={locationForm.city}
              onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
              placeholder="Ciudad"
            />
            <div className="pill-row">
              <button type="submit" disabled={savingLocation}>
                Guardar
              </button>
              <button type="button" className="pill" onClick={() => setEditingLocation(false)}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      <h2>Mis grupos</h2>
      <ul className="member-list">
        {groups.map((g) => {
          const stats = statsByGroup[g.id];
          return (
            <li key={g.id} className={`member-row group-select-row ${g.id === activeGroupId ? "active" : ""}`}>
              <div className="member-info">
                <strong>{g.name}</strong>
                <span className="muted small">{g.memberCount} miembro{g.memberCount === 1 ? "" : "s"}</span>
              </div>
              {stats && <span className="score">{stats.weeklyScore}%</span>}
              {g.id !== activeGroupId && (
                <button type="button" onClick={() => setActiveGroupId(g.id)}>
                  Ver
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="profile-actions">
        <Link to="/crear-grupo" className="pill">
          + Crear grupo
        </Link>
        <Link to="/unirse" className="pill">
          + Unirme a otro grupo
        </Link>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="profile-danger-zone">
        <button type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
        <button type="button" className="danger" onClick={handleDelete}>
          Borrar cuenta
        </button>
      </div>
    </div>
  );
}
