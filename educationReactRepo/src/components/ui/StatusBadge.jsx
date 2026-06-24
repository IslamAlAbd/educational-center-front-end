import { statusTone } from "../../lib/ui/format";

export function StatusBadge({ status }) {
  const [className, label] = statusTone(status);
  return <span className={`badge ${className}`}>{label}</span>;
}
