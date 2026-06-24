export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function redirectByRole(role) {
  const normalizedRole = (role || "").toUpperCase();
  const routes = {
    ADMIN: "/admin/dashboard",
    TEACHER: "/teacher/courses",
    STUDENT: "/student/my-courses",
  };

  window.location.replace(routes[normalizedRole] || "/login");
}
