import { useMemo, useState } from 'react';
import { ChevronRight, Library, Search, ExternalLink } from 'lucide-react';
import { api, imgUrl, type Teacher } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { useCatalog } from '../lib/catalog';
import { searchBatches } from '../lib/search';
import { BatchCard } from '../components/BatchCard';
import { CardGridSkeleton, Empty, ErrorBox, ListSkeleton } from '../components/ui';

interface KhazanaCourse {
  _id: string; name: string; description?: string; teacherName?: string; teacher?: Teacher;
  year?: { name?: string }; batchType?: { name?: string }; courseType?: { name?: string }; backgroundImage?: string;
}
interface Filters { name?: string; filters?: { key: string; value: string; options: { name: string; value: string }[] }[] }

export function KhazanaPicker() {
  const { batches, loading, error, reload } = useCatalog();
  const [q, setQ] = useState('');
  const results = useMemo(() => searchBatches(batches, q, 24), [batches, q]);
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Khazana</h1>
          <div className="page-sub">Recorded course library — pick a batch to open its Khazana programme</div>
        </div>
        <div className="spacer" />
        <div className="searchbox" style={{ maxWidth: 300 }}>
          <Search /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a batch…" />
        </div>
      </div>
      {loading && <CardGridSkeleton count={8} />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!loading && !error && (results.length ? <div className="grid">{results.map((b) => <BatchCard key={b.batch_id} batch={b} />)}</div> : <Empty title="No batches match" icon={<Library />} />)}
    </>
  );
}

export function Khazana({ batchId }: { batchId: string }) {
  const batch = useAsync((signal) => api.batch(batchId, signal), [batchId]);
  const programId = batch.data?.data?.khazanaProgramId ?? '';
  const filters = useAsync((signal) => api.khazanaFilters(programId, signal), [programId], Boolean(programId));
  const subjects = useMemo(() => {
    const data = filters.data?.data as Filters | undefined;
    return data?.filters?.find((f) => f.key === 'subjectId')?.options.filter((o) => o.value !== 'all') ?? [];
  }, [filters.data]);
  const [subjectId, setSubjectId] = useState('');
  const active = subjectId || subjects[0]?.value || '';
  const courses = useAsync(
    (signal) => api.khazanaChapters(programId, active, 1, signal), [programId, active], Boolean(programId && active));
  const list = (courses.data?.data as unknown as KhazanaCourse[]) ?? [];
  const programName = (filters.data?.data as Filters | undefined)?.name;

  if (batch.loading) return <ListSkeleton count={5} />;
  if (batch.error) return <ErrorBox message={batch.error} onRetry={batch.reload} />;
  if (!programId) return <Empty title="This batch has no Khazana programme" hint="Try a newer batch — most current batches include one." icon={<Library />} />;

  return (
    <>
      <nav className="crumbs">
        <a href="#/">Home</a><ChevronRight size={12} /><a href="#/khazana">Khazana</a><ChevronRight size={12} />
        <a href={`#/batch/${batchId}`}>{batch.data?.data?.name}</a>
      </nav>
      <div className="page-head">
        <div>
          <h1 className="page-title">{programName || 'Khazana'}</h1>
          <div className="page-sub">{list.length} recorded courses{active ? ' in the selected subject' : ''}</div>
        </div>
      </div>

      {filters.loading && <ListSkeleton count={3} />}
      {filters.error && <ErrorBox message={filters.error} onRetry={filters.reload} />}
      {subjects.length > 0 && (
        <div className="filters">
          {subjects.map((s) => (
            <button key={s.value} className={`btn ${s.value === active ? 'primary' : ''}`} onClick={() => setSubjectId(s.value)}>{s.name}</button>
          ))}
        </div>
      )}

      {courses.loading && <CardGridSkeleton count={6} />}
      {courses.error && <ErrorBox message={courses.error} onRetry={courses.reload} />}
      {!courses.loading && !courses.error && (list.length === 0
        ? <Empty title="No courses in this subject yet" icon={<Library />} />
        : (
          <div className="grid">
            {list.map((c) => (
              <article className="card batch-card" key={c._id}>
                {c.backgroundImage && <img className="batch-thumb" src={c.backgroundImage} alt="" loading="lazy" />}
                <div className="batch-body">
                  <div className="batch-name">{c.name}</div>
                  <div className="tiny muted">{c.description}</div>
                  <div className="batch-meta">
                    {c.year?.name && <span className="chip gold">{c.year.name}</span>}
                    {c.courseType?.name && <span className="chip">{c.courseType.name}</span>}
                  </div>
                  {c.teacher && (
                    <div className="row" style={{ gap: 8 }}>
                      <img src={imgUrl(c.teacher.imageId)} alt="" width={26} height={26} style={{ borderRadius: 999, objectFit: 'cover', background: 'var(--surface-2)' }} />
                      <span className="tiny muted">{c.teacherName}</span>
                    </div>
                  )}
                  <a className="btn" style={{ justifyContent: 'center' }} target="_blank" rel="noreferrer"
                     href={`https://stream.aryavidya.cc/#/batch/${batchId}?tab=khazana`}>
                    <ExternalLink /> Open in AryaVidya
                  </a>
                </div>
              </article>
            ))}
          </div>
        ))}
    </>
  );
}
