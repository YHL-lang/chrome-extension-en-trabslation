export default function TranslatingView() {
  return (
    <div className="view view--translating">
      <h1 className="view__heading">文章标题</h1>
      <div className="view__center">
        <span className="spinner" aria-hidden="true" />
        <p className="view__desc">正在调用 AI 模型…</p>
      </div>
      <div className="preview">
        <p className="preview__placeholder">译文预览（打字机）…</p>
        <p>这是第一段翻译内容……</p>
      </div>
    </div>
  );
}
