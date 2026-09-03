interface EmptyViewProps {
  onStart: () => void;
}

export default function EmptyView({ onStart }: EmptyViewProps) {
  return (
    <div className="view view--center">
      <svg
        className="view__illustration"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v4h4" />
        <path d="M9 12h6M9 16h6" />
      </svg>
      <p className="view__desc">
        提取当前网页文章
        <br />
        并一键翻译为中文
      </p>
      <button type="button" className="btn btn--primary" onClick={onStart}>
        一键翻译本页
      </button>
    </div>
  );
}
