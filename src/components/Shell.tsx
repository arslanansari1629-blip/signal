import { useState, type ReactNode } from 'react';
import { LayoutDashboard, Star, History, Send, Download, Settings, Search, Menu, Moon, Sun, Layers, FileText, Library, X } from 'lucide-react';
import { useRoute, navigate } from '../lib/router';
import { store, useTheme } from '../lib/store';

const PRIMARY = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/batches', label: 'All Batches', icon: Layers },
  { path: '/favorites', label: 'Favorites', icon: Star },
  { path: '/history', label: 'History', icon: History }
];
const ZONE = [
  { path: '/pdf-bank', label: 'PDF Bank', icon: FileText },
  { path: '/khazana', label: 'Khazana', icon: Library },
  { path: '/downloads', label: 'Downloads', icon: Download },
  { path: '/settings', label: 'Settings', icon: Settings }
];

export function Shell({ children }: { children: ReactNode }) {
  const route = useRoute();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const active = (p: string) => (p === '/' ? route.path === '/' : route.path.startsWith(p));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/batches?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  return (
    <div className="app">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <a className="brand" href="#/" onClick={() => setOpen(false)}>
          <span className="brand-mark">A</span>
          <span>
            <div className="brand-name">AryaVidya</div>
            <div className="brand-sub">Study Portal</div>
          </span>
        </a>
        <nav className="nav" onClick={() => setOpen(false)}>
          <div className="nav-label">Menu</div>
          {PRIMARY.map(({ path, label, icon: Icon }) => (
            <a key={path} className={`nav-item ${active(path) ? 'active' : ''}`} href={`#${path}`}><Icon />{label}</a>
          ))}
          <div className="nav-label">My Study Zone</div>
          {ZONE.map(({ path, label, icon: Icon }) => (
            <a key={path} className={`nav-item ${active(path) ? 'active' : ''}`} href={`#${path}`}><Icon />{label}</a>
          ))}
          <div className="nav-label">Community</div>
          <a className="nav-item" href="https://t.me/+X5GgG4MnqiUzODZl" target="_blank" rel="noreferrer"><Send />Telegram</a>
        </nav>
        <div className="sidebar-foot">Live data from stream.aryavidya.cc</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
          <form className="searchbox" onSubmit={submit}>
            <Search />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search batches — Prayas, Lakshya, Arjuna…" aria-label="Search batches" />
          </form>
          <div className="spacer" />
          <button className="icon-btn" title="Toggle theme"
                  onClick={() => store.setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
