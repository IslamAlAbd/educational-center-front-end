const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

function readJsonSafely(response) {
  return response.json().catch(() => ({}));
}

export async function apiFetch(method, path, body, { isPublic = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (!isPublic) {
    const token = localStorage.getItem("token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => {
    throw new Error("Network error. Check that the backend is running.");
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("/login");
    return null;
  }

  const data = await readJsonSafely(response);

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || `Server error ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  get: (path, isPublic = false) => apiFetch("GET", path, null, { isPublic }),
  post: (path, body = {}, isPublic = false) =>
    apiFetch("POST", path, body, { isPublic }),
  put: (path, body = {}) => apiFetch("PUT", path, body),
  patch: (path, body = {}) => apiFetch("PATCH", path, body),
  delete: (path) => apiFetch("DELETE", path),
};
