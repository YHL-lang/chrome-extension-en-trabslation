interface TopBarProps {
  onSettings: () => void;
}

export default function TopBar({ onSettings }: TopBarProps) {
  return (
    <header className="topbar">
      <span className="topbar__title">网页文章翻译</span>
      <button type="button" className="topbar__settings" aria-label="设置" onClick={onSettings}>
        ⚙
      </button>
    </header>
  );
}
