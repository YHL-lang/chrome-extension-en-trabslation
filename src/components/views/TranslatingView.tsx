interface TranslatingViewProps {
  title?: string;
  preview?: string;
}

export default function TranslatingView({ title = '文章标题', preview }: TranslatingViewProps) {
  return (
    <div className="view view--translating">
      <h1 className="view__heading">{title}</h1>
      <div className="view__center">
        <span className="spinner" aria-hidden="true" />
        <p className="view__desc">正在调用 AI 模型…</p>
      </div>
      <div className="preview">
        <p className="preview__placeholder">译文预览（打字机）…</p>
        {preview ? <p className="preview__text">{preview}</p> : <p>等待返回分片…</p>}
      </div>
    </div>
  );
}
