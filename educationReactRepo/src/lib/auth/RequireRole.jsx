import { Navigate } from "react-router-dom";
import { getToken, getUser, redirectByRole } from "./storage";

export function RequireRole({ role, children }) {
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role && (user.role || "").toUpperCase() !== role.toUpperCase()) {
    redirectByRole(user.role);
    return null;
  }

  return children;
}
