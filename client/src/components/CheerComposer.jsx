import { useState } from "react";
import { api } from "../api";
import { useGroups } from "../GroupContext";

const PRESETS = [
  { type: "encouragement", text: "Dale, tú puedes 💪" },
  { type: "congrats", text: "Felicitaciones por el gym 🎉" },
];

// Mensajes siempre al grupo entero — no hay para que escoger a una sola
// persona, es un mensaje de animo colectivo.
export default function CheerComposer({ onSent }) {
  const { activeGroupId } = useGroups();
  const [customText, setCustomText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function send(type, text) {
    if (!text.trim()) return;
    setError("");
    setSending(true);
    try {
      await api.sendCheer(activeGroupId, { recipientId: null, type, text: text.trim() });
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
      <h2>Mandar un mensaje al grupo</h2>
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
