import { useMemo, useState } from 'react';
import { Layers, ClipboardList, Star, CalendarDays, History as HistoryIcon, FileText, Library, Shuffle, Sparkles, BookOpen } from 'lucide-react';
import { useCatalog, randomBatches } from '../lib/catalog';
import { BatchCard } from '../components/BatchCard';
import { CardGridSkeleton, ErrorBox, Section, Empty } from '../components/ui';
import { useFavorites, useHistory } from '../lib/store';

const TILES = [
  { href: '#/batches', label: 'All Batches', icon: Layers },
  { href: '#/favorites', label: 'Favorites', icon: Star },
  { href: '#/pdf-bank', label: 'PDF Bank', icon: FileText },
  { href: '#/khazana', label: 'Khazana', icon: Library },
  { href: '#/history', label: 'History', icon: HistoryIcon },
  { href: '#/downloads', label: 'Downloads', icon: BookOpen }
];

export function Dashboard() {
  const { batches, loading, error, reload, data } = useCatalog();
  const favorites = useFavorites();
  const history = useHistory();
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6) + 1);
  const picks = useMemo(() => randomBatches(batches, 12, seed), [batches, seed]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <div className="card pad" style={{ marginBottom: 24, background: 'linear-gradient(120deg, var(--chan-100), var(--surface))' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">{greeting}, scholar 👋</h1>
            <div className="page-sub">
              {loading ? 'Loading the batch library…' : `${batches.length.toLocaleString('en-IN')} batches ready to explore`}
              {data?.generated_at ? ` · catalog updated ${new Date(data.generated_at).toLocaleDateString('en-IN')}` : ''}
            </div>
          </div>
          <a className="btn primary" href="#/batches"><Sparkles /> Browse batches</a>
        </div>
      </div>

      <Section title="Quick Hub" icon={<Sparkles />}>
        <div className="tiles">
          {TILES.map(({ href, label, icon: Icon }) => (
            <a className="tile" key={href} href={href}><span className="tile-ico"><Icon /></span>{label}</a>
          ))}
        </div>
      </Section>

      {favorites.length > 0 && (
        <Section title="My Batches" icon={<Star />} action={<a className="link" href="#/favorites">View all</a>}>
          <div className="grid">
            {favorites.slice(0, 4).map((f) => <BatchCard key={f.batch_id} batch={{ ...f, exam: f.exam }} />)}
          </div>
        </Section>
      )}

      <Section title="Random Batches" icon={<Layers />}
               action={<button className="btn ghost" onClick={() => setSeed(Math.floor(Math.random() * 1e6) + 1)}><Shuffle /> Shuffle</button>}>
        {loading && <CardGridSkeleton count={8} />}
        {error && <ErrorBox message={error} onRetry={reload} />}
        {!loading && !error && picks.length === 0 && <Empty title="No batches in the catalog yet" />}
        {!loading && !error && picks.length > 0 && <div className="grid">{picks.map((b) => <BatchCard key={b.batch_id} batch={b} />)}</div>}
      </Section>

      {history.length > 0 && (
        <Section title="Continue where you left off" icon={<CalendarDays />} action={<a className="link" href="#/history">View history</a>}>
          <div className="card">
            {history.slice(0, 5).map((h) => (
              <a className="list-item" key={h.path} href={`#${h.path}`}>
                <span className="list-index"><ClipboardList size={14} /></span>
                <span style={{ flex: 1 }}>
                  <div className="list-title">{h.name}</div>
                  <div className="tiny muted">{new Date(h.visitedAt).toLocaleString('en-IN')}</div>
                </span>
              </a>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
