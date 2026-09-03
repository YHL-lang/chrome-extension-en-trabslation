import { STATE_LABELS } from '@/lib/types';
import type { AppState } from '@/lib/types';

const VERSION = 'v0.1.0';

interface FooterProps {
  state: AppState;
}

export default function Footer({ state }: FooterProps) {
  return (
    <footer className="footer">
      <span className="footer__state">{STATE_LABELS[state]}</span>
      <span className="footer__version">{VERSION}</span>
    </footer>
  );
}
