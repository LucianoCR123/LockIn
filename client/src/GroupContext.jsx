import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { api } from "./api";

const GroupContext = createContext(null);

const STORAGE_KEY = "lockin-active-group";

export function GroupProvider({ children }) {
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupIdState] = useState(localStorage.getItem(STORAGE_KEY) || null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.myGroups();
      setGroups(data);
      setActiveGroupIdState((current) => {
        const stillValid = current && data.some((g) => g.id === current);
        const next = stillValid ? current : data[0]?.id || null;
        if (next) localStorage.setItem(STORAGE_KEY, next);
        return next;
      });
    } catch {
      // No autenticado todavia, o sin conexion: se reintenta despues del login.
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function setActiveGroupId(id) {
    setActiveGroupIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
  }

  const activeGroup = groups.find((g) => g.id === activeGroupId) || null;

  return (
    <GroupContext.Provider value={{ groups, activeGroup, activeGroupId, setActiveGroupId, refresh, loading }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroups() {
  return useContext(GroupContext);
}
