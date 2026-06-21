// js/ui.js — shared UI helpers (toasts, modal, loading, formatting)

/* ── Toast ───────────────────────────────────────────── */
(function _initToastContainer() {
  const c = document.createElement("div");
  c.className = "toast-container";
  c.id = "toast-container";
  document.body.appendChild(c);
})();

const _TOAST_ICONS = {
  success: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"/></svg>`,
};

function showToast(message, type = "info") {
  const c = document.getElementById("toast-container");
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-icon">${_TOAST_ICONS[type] || _TOAST_ICONS.info}</span><span class="toast-msg">${message}</span>`;
  c.appendChild(t);
  // Trigger animation on next frame
  requestAnimationFrame(() =>
    requestAnimationFrame(() => t.classList.add("show")),
  );
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 350);
  }, 3600);
}

/* ── Modal ───────────────────────────────────────────── */
let _modalOverlay = null;
let _onModalConfirm = null;

function _ensureModal() {
  if (_modalOverlay) return _modalOverlay;
  _modalOverlay = document.createElement("div");
  _modalOverlay.className = "modal-overlay";
  _modalOverlay.id = "modal-overlay";
  _modalOverlay.innerHTML = `
    <div class="modal" id="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-header">
        <h2 class="modal-title" id="modal-title"></h2>
        <button class="modal-close" id="modal-close-btn" aria-label="Close dialog">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="18" height="18"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="modal-body" id="modal-body"></div>
      <div class="modal-footer" id="modal-footer"></div>
    </div>`;
  document.body.appendChild(_modalOverlay);
  _modalOverlay.addEventListener("click", (e) => {
    if (e.target === _modalOverlay) closeModal();
  });
  _modalOverlay
    .querySelector("#modal-close-btn")
    .addEventListener("click", closeModal);
  return _modalOverlay;
}

/**
 * openModal(title, bodyHTML, footerHTML?, { wide? })
 * footerHTML can include a button with id="modal-confirm-btn" that will
 * trigger the _onModalConfirm callback.
 */
function openModal(title, bodyHTML, footerHTML = "", opts = {}) {
  const overlay = _ensureModal();
  const box = overlay.querySelector("#modal-box");
  box.classList.toggle("modal-lg", !!opts.wide);
  overlay.querySelector("#modal-title").textContent = title;
  overlay.querySelector("#modal-body").innerHTML = bodyHTML;
  overlay.querySelector("#modal-footer").innerHTML = footerHTML;
  overlay.classList.add("visible");
}

function closeModal() {
  _modalOverlay?.classList.remove("visible");
  _onModalConfirm = null;
}

/** Convenience: show a simple confirm dialog */
function confirmDialog(
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  danger = false,
) {
  const btnClass = danger ? "btn-danger" : "btn-primary";
  openModal(
    title,
    `<p style="color:var(--text-muted);font-size:14px;">${message}</p>`,
    `<button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
     <button class="btn ${btnClass} btn-sm" id="modal-confirm-btn">${confirmLabel}</button>`,
  );
  setTimeout(() => {
    document
      .getElementById("modal-confirm-btn")
      ?.addEventListener("click", async () => {
        await onConfirm?.();
      });
  }, 0);
}

/* ── Loading / Empty state HTML ──────────────────────── */
function loadingHTML(msg = "Loading…") {
  return `<div class="loading"><div class="spinner"></div><span>${msg}</span></div>`;
}

function emptyHTML(title, message, actionHTML = "") {
  return `
    <div class="empty">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z"/></svg>
      </div>
      <h3>${title}</h3>
      <p>${message}</p>
      ${actionHTML}
    </div>`;
}

function setContent(elOrId, html) {
  const el =
    typeof elOrId === "string" ? document.getElementById(elOrId) : elOrId;
  if (el) el.innerHTML = html;
}

/* ── Shared formatters ───────────────────────────────── */
function statusBadge(status) {
  const map = {
    PENDING: ["badge-warning", "Pending"],
    ACCEPTED: ["badge-teal", "Accepted"],
    REJECTED: ["badge-danger", "Rejected"],
    CANCELLED: ["badge-muted", "Cancelled"],
    PASSED: ["badge-teal", "Passed"],
    FAILED: ["badge-danger", "Failed"],
    ACTIVE: ["badge-teal", "Active"],
    INACTIVE: ["badge-muted", "Inactive"],
  };
  const [cls, label] = map[(status || "").toUpperCase()] || [
    "badge-muted",
    status || "—",
  ];
  return `<span class="badge ${cls}">${label}</span>`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPrice(amount, currency = "EUR") {
  if (amount == null || amount === "") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

// Pull a query-string param from the current URL
function qp(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Build a URL with updated query params without reloading the page
function setQP(params) {
  const sp = new URLSearchParams(window.location.search);
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === "") sp.delete(k);
    else sp.set(k, v);
  });
  return `${window.location.pathname}?${sp.toString()}`;
}
