export default function LoadingView() {
  return (
    <div className="view view--center">
      <span className="spinner" aria-hidden="true" />
      <div className="view__copy">
        <h2 className="view__title">正在提取文章</h2>
        <p className="view__desc">正在识别页面正文内容…</p>
      </div>
    </div>
  );
}
