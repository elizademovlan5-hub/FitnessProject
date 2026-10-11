import { CheckCircle2, Info, LoaderCircle, AlertCircle, X } from 'lucide-react';

export function Loading({ label = 'Yüklənir...' }) {
  return <div className="loading-state"><LoaderCircle className="spin" size={22} /><span>{label}</span></div>;
}

export function EmptyState({ icon: Icon = Info, title, description, action }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={24} /></div><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>;
}

export function Notice({ type = 'info', children, onClose }) {
  if (!children) return null;
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Info;
  return <div className={`notice notice-${type}`} role="status"><Icon size={18} /><span>{children}</span>{onClose && <button className="notice-close" onClick={onClose} aria-label="Bağla"><X size={16} /></button>}</div>;
}

export function PageHeading({ eyebrow, title, description, right }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{right && <div className="heading-right">{right}</div>}</div>;
}
