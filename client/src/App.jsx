import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useGroups } from "./GroupContext";
import BottomNav from "./components/BottomNav";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import CreateGroup from "./pages/CreateGroup";
import JoinGroup from "./pages/JoinGroup";
import Today from "./pages/Today";
import GroupScreen from "./pages/GroupScreen";
import Profile from "./pages/Profile";

export default function App() {
  const { user, loading } = useAuth();
  const groupsCtx = useGroups();
  const location = useLocation();

  if (loading) return <div className="app-frame" />;

  const publicPaths = ["/login", "/registro"];

  if (!user) {
    if (!publicPaths.includes(location.pathname)) {
      return <Navigate to="/login" replace />;
    }
    return (
      <div className="app-frame">
        <div className="app-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
          </Routes>
        </div>
      </div>
    );
  }

  const onboardingPaths = ["/onboarding", "/crear-grupo", "/unirse"];
  const needsOnboarding = !groupsCtx.loading && groupsCtx.groups.length === 0;

  if (needsOnboarding && !onboardingPaths.includes(location.pathname)) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="app-frame">
      <div className="app-content">
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/crear-grupo" element={<CreateGroup />} />
          <Route path="/unirse" element={<JoinGroup />} />
          <Route path="/" element={<Today />} />
          <Route path="/grupo" element={<GroupScreen />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!needsOnboarding && <BottomNav />}
    </div>
  );
}
