export function Modal({ open, title, children, footer, wide = false, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-overlay visible" onClick={(event) => event.target === event.currentTarget && onClose?.()}>
      <div className={`modal ${wide ? "modal-lg" : ""}`} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button type="button" className="modal-close" aria-label="Close dialog" onClick={onClose}>
            x
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">{footer}</div>
      </div>
    </div>
  );
}
