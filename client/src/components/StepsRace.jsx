import { flagEmoji } from "../flag";
import { buildColorMap } from "../categoricalColors";

// "Carrera" de pasos: cada miembro es una barra horizontal (pista) con un
// marcador en la punta. El color identifica a la PERSONA (misma persona =
// mismo color siempre, sin importar su puesto actual), nunca el puesto —
// ver client/src/categoricalColors.js. Los nombres/valores van en texto
// (nunca coloreados) al lado de cada barra, siguiendo el mismo patron que
// el resto de la UI.
export default function StepsRace({ entries, currentUserId }) {
  if (entries.length === 0) return null;

  const colorMap = buildColorMap(entries.map((e) => e.userId));
  const maxSteps = Math.max(1, ...entries.map((e) => e.totalSteps));

  return (
    <div className="steps-race" role="table" aria-label="Ranking de pasos">
      {entries.map((entry, i) => {
        const pct = Math.max(4, Math.round((entry.totalSteps / maxSteps) * 100));
        const color = colorMap.get(entry.userId);
        const isMe = entry.userId === currentUserId;
        const initial = entry.displayName.slice(0, 1).toUpperCase();

        return (
          <div key={entry.userId} className={`steps-race-row ${isMe ? "steps-race-row-me" : ""}`} role="row">
            <div className="steps-race-row-top">
              <span className="steps-race-rank">#{i + 1}</span>
              <strong>
                {flagEmoji(entry.country)} {entry.displayName}
                {isMe ? " (tú)" : ""}
              </strong>
              <span className="muted small steps-race-count">{entry.totalSteps.toLocaleString()} pasos</span>
            </div>
            <div className="steps-race-track">
              <div className="steps-race-fill" style={{ width: `${pct}%`, background: color }} />
              <span className="steps-race-walker" style={{ left: `${pct}%` }} aria-hidden="true">
                <span className="steps-race-walker-icon">🚶</span>
                <span className="steps-race-marker" style={{ background: color }}>
                  {flagEmoji(entry.country) || initial}
                </span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
