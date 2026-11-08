import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, X } from 'lucide-react';

export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card" key={i} style={{ overflow: 'hidden' }}>
          <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: 0 }} />
          <div style={{ padding: 14, display: 'grid', gap: 8 }}>
            <div className="skeleton" style={{ height: 14, width: '85%' }} />
            <div className="skeleton" style={{ height: 12, width: '55%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="card">
      {Array.from({ length: count }).map((_, i) => (
        <div className="list-item" key={i}>
          <div className="skeleton" style={{ width: 28, height: 28 }} />
          <div style={{ flex: 1, display: 'grid', gap: 6 }}>
            <div className="skeleton" style={{ height: 12, width: `${50 + (i % 3) * 12}%` }} />
            <div className="skeleton" style={{ height: 10, width: '28%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export const Spinner = () => <div className="center"><div className="spinner" /></div>;

export function Empty({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return <div className="card empty">{icon ?? <Inbox />}<div style={{ fontWeight: 600, color: 'var(--text-2)' }}>{title}</div>{hint && <div className="tiny" style={{ marginTop: 4 }}>{hint}</div>}</div>;
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card error-box">
      <AlertTriangle />
      <div style={{ fontWeight: 600 }}>{message}</div>
      {onRetry && <button className="btn" style={{ marginTop: 12 }} onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Section({ title, icon, action, children }: { title: string; icon?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">{icon}{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong style={{ flex: 1, fontFamily: 'var(--font-display)' }}>{title}</strong>
          {footer}
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export const fmtDate = (v?: string) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
export const fmtTime = (v?: string) => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
};
