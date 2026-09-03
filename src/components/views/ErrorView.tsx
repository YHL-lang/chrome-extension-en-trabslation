interface ErrorViewProps {
  message?: string;
  onRetry: () => void;
}

export default function ErrorView({ message = '未识别到正文', onRetry }: ErrorViewProps) {
  return (
    <div className="view view--center">
      <div className="error__badge" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="view__copy">
        <h2 className="view__title">翻译未完成</h2>
        <p className="view__desc">{message}</p>
      </div>
      <button type="button" className="btn btn--primary btn--block" onClick={onRetry}>
        重试
      </button>
    </div>
  );
}
