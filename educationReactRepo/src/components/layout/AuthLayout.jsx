export function AuthLayout({ title, subtitle, brandTitle, brandText, features, children, footer }) {
  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">EC</div>
          <h1 dangerouslySetInnerHTML={{ __html: brandTitle }} />
          <p>{brandText}</p>
          <div className="auth-features">
            {features.map((feature) => (
              <div className="auth-feature" key={feature}>
                <div className="auth-feature-dot" />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <h2>{title}</h2>
          <p className="auth-card-sub">{subtitle}</p>
          {children}
          {footer}
        </div>
      </div>
    </div>
  );
}
