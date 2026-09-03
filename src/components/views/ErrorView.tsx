interface ErrorViewProps {
  message?: string;
  onRetry: () => void;
}

export default function ErrorView({ message = '未识别到正文', onRetry }: ErrorViewProps) {
  return (
    <div className="view view--center">
      <span className="view__icon" aria-hidden="true">
        ⚠
      </span>
      <p className="view__title">提取失败 / 翻译失败</p>
      <p className="view__desc">原因：{message}</p>
      <button type="button" className="btn btn--primary" onClick={onRetry}>
        重试
      </button>
    </div>
  );
}
