import { flagEmoji } from "../flag";
import { buildColorMap } from "../categoricalColors";

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

function Avatar({ name, country, color }) {
  return (
    <span className="feed-avatar" style={{ background: color }}>
      {flagEmoji(country) || name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export default function FeedItem({ item, currentUserId, colorMap }) {
  const colors = colorMap || buildColorMap([item.userId || item.senderId]);

  if (item.type === "cheer") {
    const emoji = item.cheerType === "congrats" ? "🎉" : item.cheerType === "encouragement" ? "💪" : "💬";
    const isMine = item.senderId === currentUserId;
    return (
      <div className="feed-item feed-item-cheer">
        <Avatar name={item.senderName} country={item.senderCountry} color={colors.get(item.senderId)} />
        <div className="feed-item-body">
          <div className="feed-item-head">
            <strong>{isMine ? "Tú" : item.senderName}</strong>
            <span className="muted small">{timeAgo(item.at)}</span>
          </div>
          <p className="feed-item-text">
            {emoji} {item.recipientName ? <span className="muted">para {item.recipientName}: </span> : null}"{item.text}"
          </p>
          {item.photoUrl && (
            <a href={item.photoUrl} target="_blank" rel="noreferrer">
              <img className="feed-item-photo" src={item.photoUrl} alt="Foto adjunta" />
            </a>
          )}
        </div>
      </div>
    );
  }

  const chips = [];
  if (item.steps > 0) chips.push(`👣 ${item.steps.toLocaleString()}`);
  if (item.workoutDone) chips.push("🏋️ Gym");
  if (item.dietOk) chips.push("🥗 Dieta");
  if (item.usedShitMeal) chips.push("🍔 Shit meal");
  if (item.usedShitDay) chips.push("🍕 Shit day");

  const isMe = item.userId === currentUserId;

  return (
    <div className="feed-item">
      <Avatar name={item.displayName} country={item.country} color={colors.get(item.userId)} />
      <div className="feed-item-body">
        <div className="feed-item-head">
          <strong>{isMe ? "Tú" : item.displayName}</strong>
          <span className="muted small">{timeAgo(item.at)}</span>
        </div>
        <div className="feed-chips">
          {chips.length > 0 ? (
            chips.map((c) => (
              <span key={c} className="feed-chip">
                {c}
              </span>
            ))
          ) : (
            <span className="muted small">registró su día</span>
          )}
        </div>
        {item.photoUrl && (
          <a href={item.photoUrl} target="_blank" rel="noreferrer">
            <img className="feed-item-photo" src={item.photoUrl} alt="Prueba del día" />
          </a>
        )}
      </div>
    </div>
  );
}
