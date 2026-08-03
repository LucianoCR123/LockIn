import { flagEmoji } from "../flag";

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

export default function FeedItem({ item, currentUserId }) {
  if (item.type === "cheer") {
    const emoji = item.cheerType === "congrats" ? "🎉" : item.cheerType === "encouragement" ? "💪" : "💬";
    return (
      <div className="feed-item feed-item-cheer">
        <span className="feed-item-emoji">{emoji}</span>
        <div>
          <p>
            <strong>{item.senderName}</strong>
            {item.recipientName ? (
              <>
                {" "}
                a <strong>{item.recipientName}</strong>
              </>
            ) : (
              " al grupo"
            )}
            : "{item.text}"
          </p>
          <span className="muted small">{timeAgo(item.at)}</span>
        </div>
      </div>
    );
  }

  const badges = [];
  if (item.workoutDone) badges.push("🏋️ Gym");
  if (item.dietOk) badges.push("🥗 Dieta");
  if (item.usedShitMeal) badges.push("🍔 Shit meal");
  if (item.usedShitDay) badges.push("🍕 Shit day");

  return (
    <div className="feed-item">
      <span className="feed-item-emoji">✅</span>
      <div>
        <p>
          <strong>
            {item.userId === currentUserId ? "Tú" : `${flagEmoji(item.country)} ${item.displayName}`.trim()}
          </strong>{" "}
          registró {item.steps.toLocaleString()} pasos
          {badges.length > 0 && <> · {badges.join(" · ")}</>}
        </p>
        <span className="muted small">{timeAgo(item.at)}</span>
      </div>
    </div>
  );
}
