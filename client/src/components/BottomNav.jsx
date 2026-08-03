import { NavLink } from "react-router-dom";

const icons = {
  today: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3M16 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
    </svg>
  ),
  group: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 20c1-3.5 3.8-5.5 6.5-5.5s5.5 2 6.5 5.5" />
      <circle cx="17.5" cy="9" r="2.3" />
      <path d="M15.8 14.6c2 .3 4 1.9 4.7 5.4" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  ),
};

const TABS = [
  { to: "/", label: "Hoy", icon: "today", end: true },
  { to: "/grupo", label: "Grupo", icon: "group" },
  { to: "/perfil", label: "Perfil", icon: "profile" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `bottom-nav-item${isActive ? " active" : ""}`}
        >
          <span className="bottom-nav-icon">{icons[tab.icon]}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
