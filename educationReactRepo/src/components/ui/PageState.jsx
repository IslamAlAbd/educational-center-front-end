export function LoadingState({ message = "Loading..." }) {
  return (
    <div className="loading">
      <div className="spinner" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">i</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
