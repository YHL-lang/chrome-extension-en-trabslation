export default function LoadingView() {
  return (
    <div className="view view--center">
      <span className="spinner" aria-hidden="true" />
      <p className="view__title">加载中…</p>
      <p className="view__desc">正在提取文章正文…</p>
    </div>
  );
}
