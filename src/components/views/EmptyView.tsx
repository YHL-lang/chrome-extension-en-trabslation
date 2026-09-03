interface EmptyViewProps {
  onStart: () => void;
}

export default function EmptyView({ onStart }: EmptyViewProps) {
  return (
    <div className="view view--center">
      <div className="empty__badge" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </div>
      <div className="view__copy">
        <h2 className="view__title">一键翻译本页</h2>
        <p className="view__desc">提取当前网页文章正文，并翻译为中文</p>
      </div>
      <button type="button" className="btn btn--primary btn--lg btn--block" onClick={onStart}>
        <span>开始翻译</span>
        <svg className="btn__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
