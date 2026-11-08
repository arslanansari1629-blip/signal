import { useEffect, useMemo, useState } from 'react';
import { Layers, Search } from 'lucide-react';
import { useCatalog, examOf } from '../lib/catalog';
import { searchBatches } from '../lib/search';
import { BatchCard } from '../components/BatchCard';
import { CardGridSkeleton, Empty, ErrorBox } from '../components/ui';
import { useRoute, navigate } from '../lib/router';

const PAGE = 24;

export function Batches() {
  const route = useRoute();
  const { batches, loading, error, reload, data } = useCatalog();
  const [q, setQ] = useState(route.query.get('q') ?? '');
  const [exam, setExam] = useState('');
  const [language, setLanguage] = useState('');
  const [klass, setKlass] = useState('');
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => { setQ(route.query.get('q') ?? ''); }, [route.path, route.query.toString()]);
  useEffect(() => { setLimit(PAGE); }, [q, exam, language, klass]);

  const exams = useMemo(() => [...new Set(batches.map(examOf).filter(Boolean))].sort(), [batches]);
  const languages = useMemo(() => [...new Set(batches.map((b) => b.language).filter(Boolean) as string[])].sort(), [batches]);
  const classes = useMemo(() => [...new Set(batches.map((b) => b.class).filter(Boolean) as string[])].sort(), [batches]);

  const results = useMemo(() => {
    const filtered = batches.filter((b) =>
      (!exam || examOf(b) === exam) && (!language || b.language === language) && (!klass || b.class === klass));
    return searchBatches(filtered, q, 100000);
  }, [batches, q, exam, language, klass]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">All Batches</h1>
          <div className="page-sub">
            {loading ? 'Loading…' : `${results.length.toLocaleString('en-IN')} of ${batches.length.toLocaleString('en-IN')} batches`}
            {data?.generated_at ? ` · updated ${new Date(data.generated_at).toLocaleDateString('en-IN')}` : ''}
          </div>
        </div>
        <div className="spacer" />
        <div className="searchbox" style={{ maxWidth: 320 }}>
          <Search />
          <input value={q} placeholder="Search by name, year, exam…"
                 onChange={(e) => { setQ(e.target.value); navigate(`/batches?q=${encodeURIComponent(e.target.value)}`); }} />
        </div>
      </div>

      <div className="filters">
        <select value={exam} onChange={(e) => setExam(e.target.value)} aria-label="Exam">
          <option value="">All exams</option>
          {exams.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={klass} onChange={(e) => setKlass(e.target.value)} aria-label="Class">
          <option value="">All classes</option>
          {classes.map((c) => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language">
          <option value="">All languages</option>
          {languages.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        {(exam || language || klass || q) && (
          <button className="btn ghost" onClick={() => { setExam(''); setLanguage(''); setKlass(''); setQ(''); navigate('/batches'); }}>Clear</button>
        )}
      </div>

      {loading && <CardGridSkeleton count={12} />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!loading && !error && results.length === 0 && <Empty title="No batches match your filters" hint="Try a different exam, class or spelling." icon={<Layers />} />}
      {!loading && !error && results.length > 0 && (
        <>
          <div className="grid">{results.slice(0, limit).map((b) => <BatchCard key={b.batch_id} batch={b} />)}</div>
          {limit < results.length && (
            <div className="center"><button className="btn" onClick={() => setLimit((l) => l + PAGE)}>Load more ({results.length - limit} left)</button></div>
          )}
        </>
      )}
    </>
  );
}
