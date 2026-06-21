// js/api.js — single source for all backend requests

const API_BASE = "http://localhost:3000"; // ← change this to your deployed URL

/**
 * Detect how deep we are in the folder hierarchy so we can
 * build root-relative hrefs that work with both file:// and http://.
 */
function getRootPath() {
  const p = window.location.pathname;
  console.log("Current path:", p);
  return p.includes("/admin/") ||
    p.includes("/student/") ||
    p.includes("/teacher/")
    ? "../"
    : "./";
}

/**
 * Core fetch wrapper.
 * - Attaches Authorization header automatically
 * - Normalises JSON error messages (NestJS can return string OR string[])
 * - On 401 → clears auth and redirects to login
 */
async function apiFetch(method, path, body = null, isPublic = false) {
  const headers = { "Content-Type": "application/json" };

  if (!isPublic) {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const opts = { method, headers };
  if (body !== null) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(API_BASE + path, opts);
  } catch (err) {
    throw {
      status: 0,
      message: "Network error — check that the backend is running.",
    };
  }

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = getRootPath() + "index.html";
    return;
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const msg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || `Server error ${res.status}`;
    throw { status: res.status, message: msg, data };
  }

  return data;
}

/** Public API surface used by every page */
const api = {
  get: (path, isPublic = false) => apiFetch("GET", path, null, isPublic),
  post: (path, body = {}, isPublic = false) =>
    apiFetch("POST", path, body, isPublic),
  put: (path, body = {}) => apiFetch("PUT", path, body),
  patch: (path, body = {}) => apiFetch("PATCH", path, body),
  delete: (path) => apiFetch("DELETE", path),
};
