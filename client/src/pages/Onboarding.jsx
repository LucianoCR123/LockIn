import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Onboarding() {
  const { user, logout } = useAuth();

  return (
    <div className="card onboarding-card">
      <div className="brand-mark">LockIn</div>
      <h1>Hola, {user.displayName} 👋</h1>
      <p className="muted">Todavía no perteneces a ningún grupo. Crea uno para tu combo de amigos, o únete con un código de invitación.</p>
      <div className="onboarding-actions">
        <Link to="/crear-grupo" className="onboarding-option">
          <strong>Crear un grupo</strong>
          <span className="muted">Defines las reglas: pasos mínimos, entrenamientos por semana, shit meals/days.</span>
        </Link>
        <Link to="/unirse" className="onboarding-option">
          <strong>Unirme a un grupo</strong>
          <span className="muted">Con el código que te compartió un amigo.</span>
        </Link>
      </div>
      <button className="link-button" onClick={logout}>
        Salir
      </button>
    </div>
  );
}
