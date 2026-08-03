import { useState } from "react";
import { api } from "../api";
import { useGroups } from "../GroupContext";
import { useAuth } from "../AuthContext";
import { flagEmoji } from "../flag";

const PRESETS = [
  { type: "encouragement", text: "Dale, tú puedes 💪" },
  { type: "congrats", text: "Felicitaciones por el gym 🎉" },
];

export default function CheerComposer({ members, onSent }) {
  const { activeGroupId } = useGroups();
  const { user } = useAuth();
  const [recipientId, setRecipientId] = useState("");
  const [customText, setCustomText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const others = members.filter((m) => m.userId !== user.id);

  async function send(type, text) {
    if (!text.trim()) return;
    setError("");
    setSending(true);
    try {
      await api.sendCheer(activeGroupId, { recipientId: recipientId || null, type, text: text.trim() });
      setCustomText("");
      onSent?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="cheer-composer">
      <h2>Mandar un mensaje</h2>
      <select value={recipientId} onChange={(e) => setRecipientId(e.target.value)} className="cheer-recipient">
        <option value="">Todo el grupo</option>
        {others.map((m) => (
          <option key={m.userId} value={m.userId}>
            {flagEmoji(m.country)} {m.displayName}
          </option>
        ))}
      </select>
      <div className="pill-row">
        {PRESETS.map((p) => (
          <button key={p.type} type="button" className="pill" disabled={sending} onClick={() => send(p.type, p.text)}>
            {p.text}
          </button>
        ))}
      </div>
      <div className="cheer-custom">
        <input
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Escribe algo..."
          maxLength={280}
        />
        <button type="button" disabled={sending || !customText.trim()} onClick={() => send("custom", customText)}>
          Enviar
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
