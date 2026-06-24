import { NavLink, useNavigate } from "react-router-dom";
import { clearSession, getUser } from "../../lib/auth/storage";
import { navConfig } from "../../lib/navigation";

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppShell({ title, children, actions }) {
  const navigate = useNavigate();
  const user = getUser();
  const links = navConfig[user?.role] || [];
  const displayName = user?.full_name || user?.name || "User";

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">EC</div>
          <div>
            <div className="sidebar-brand-name">EduCenter</div>
            <div className="sidebar-brand-sub">Administration</div>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {links.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials(displayName)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{displayName}</div>
              <div className="sidebar-user-role">{user?.role || "User"}</div>
            </div>
            <button type="button" className="btn-logout" onClick={handleLogout}>
              Out
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <span className="topbar-title">{title}</span>
          <div className="topbar-actions">{actions}</div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
