export function toArray(value, fallbackKeys = []) {
  if (Array.isArray(value)) return value;
  for (const key of fallbackKeys) {
    if (Array.isArray(value?.[key])) {
      return value[key];
    }
  }
  return [];
}

export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPrice(amount, currency = "EUR") {
  if (amount == null || amount === "") return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function statusTone(status) {
  const map = {
    PENDING: ["badge-warning", "Pending"],
    PENDING_PAYMENT: ["badge-warning", "Pending"],
    ACCEPTED: ["badge-teal", "Accepted"],
    REJECTED: ["badge-danger", "Rejected"],
    CANCELLED: ["badge-muted", "Cancelled"],
    PASSED: ["badge-teal", "Passed"],
    FAILED: ["badge-danger", "Failed"],
    ACTIVE: ["badge-teal", "Active"],
    INACTIVE: ["badge-muted", "Inactive"],
    AVAILABLE: ["badge-teal", "Available"],
    FULL: ["badge-warning", "Full"],
    FINISHED: ["badge-muted", "Finished"],
    COMPLETED: ["badge-teal", "Completed"],
    UPCOMING: ["badge-navy", "Upcoming"],
  };

  return map[(status || "").toUpperCase()] || ["badge-muted", status || "-"];
}
