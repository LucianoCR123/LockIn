import { Link } from "react-router-dom";
import { useGroups } from "../GroupContext";

export default function GroupSwitcher() {
  const { groups, activeGroupId, setActiveGroupId } = useGroups();

  if (groups.length <= 1) {
    return (
      <div className="group-switcher">
        <span className="group-switcher-name">{groups[0]?.name}</span>
        <Link to="/crear-grupo" className="muted small-link">
          + otro grupo
        </Link>
      </div>
    );
  }

  return (
    <div className="group-switcher">
      <select value={activeGroupId || ""} onChange={(e) => setActiveGroupId(e.target.value)}>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <Link to="/crear-grupo" className="muted small-link">
        + otro grupo
      </Link>
    </div>
  );
}
