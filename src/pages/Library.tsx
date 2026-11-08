import { Star, History as HistoryIcon, FileText, Trash2, Download, ExternalLink } from 'lucide-react';
import { store, useFavorites, useHistory, useDownloads } from '../lib/store';
import { BatchCard } from '../components/BatchCard';
import { Empty, Section, fmtDate } from '../components/ui';

export function Favorites() {
  const favorites = useFavorites();
  return (
    <>
      <div className="page-head">
        <div><h1 className="page-title">Favorites</h1><div className="page-sub">{favorites.length} saved batches</div></div>
      </div>
      {favorites.length === 0
        ? <Empty title="No favorites yet" hint="Tap the star on any batch to keep it here." icon={<Star />} />
        : <div className="grid">{favorites.map((f) => <BatchCard key={f.batch_id} batch={{ ...f }} />)}</div>}
    </>
  );
}

export function HistoryPage() {
  const history = useHistory();
  return (
    <>
      <div className="page-head">
        <div><h1 className="page-title">History</h1><div className="page-sub">{history.length} recently opened pages</div></div>
        <div className="spacer" />
        {history.length > 0 && <button className="btn" onClick={() => store.clearHistory()}><Trash2 /> Clear history</button>}
      </div>
      {history.length === 0
        ? <Empty title="Nothing here yet" hint="Batches and lectures you open will show up here." icon={<HistoryIcon />} />
        : (
          <div className="card">
            {history.map((h) => (
              <a className="list-item" key={h.path} href={`#${h.path}`}>
                <span className="list-index"><HistoryIcon size={13} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div className="list-title">{h.name}</div>
                  <div className="tiny muted">{new Date(h.visitedAt).toLocaleString('en-IN')}</div>
                </span>
              </a>
            ))}
          </div>
        )}
    </>
  );
}

export function Downloads() {
  const pdfs = useDownloads();
  return (
    <>
      <div className="page-head">
        <div><h1 className="page-title">Downloads</h1><div className="page-sub">{pdfs.length} PDFs you opened, kept on this device</div></div>
        <div className="spacer" />
        {pdfs.length > 0 && <button className="btn" onClick={() => store.clearPdfs()}><Trash2 /> Clear list</button>}
      </div>
      {pdfs.length === 0
        ? <Empty title="No PDFs yet" hint="Open any notes attachment and it will be listed here for quick access." icon={<FileText />} />
        : (
          <Section title="Saved PDFs" icon={<FileText />}>
            <div className="card">
              {pdfs.map((p) => (
                <div className="list-item" key={p.url}>
                  <span className="list-index"><FileText size={13} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="list-title">{p.name}</div>
                    <div className="tiny muted">{p.context} · {fmtDate(new Date(p.savedAt).toISOString())}</div>
                  </div>
                  <a className="icon-btn" href={p.url} target="_blank" rel="noreferrer" title="Open"><ExternalLink /></a>
                  <a className="icon-btn" href={p.url} download target="_blank" rel="noreferrer" title="Download"><Download /></a>
                  <button className="icon-btn" onClick={() => store.removePdf(p.url)} title="Remove"><Trash2 /></button>
                </div>
              ))}
            </div>
          </Section>
        )}
    </>
  );
}
