import { useMemo, useState } from 'react';
import { ChevronRight, FolderOpen, Search } from 'lucide-react';
import { api, type Topic } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { useRoute } from '../lib/router';
import { Empty, ErrorBox, ListSkeleton } from '../components/ui';

export function SubjectPage({ batchId, slug }: { batchId: string; slug: string }) {
  const route = useRoute();
  const name = route.query.get('name') || 'Subject';
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const { data, loading, error, reload } = useAsync((signal) => api.topics(batchId, slug, page, signal), [batchId, slug, page]);
  const topics: Topic[] = data?.data ?? [];
  const total = data?.paginate?.totalCount ?? topics.length;
  const limit = data?.paginate?.limit ?? 20;
  const pages = Math.max(1, Math.ceil(total / limit));
  const visible = useMemo(
    () => (filter ? topics.filter((t) => t.name.toLowerCase().includes(filter.toLowerCase())) : topics),
    [topics, filter]);

  return (
    <>
      <nav className="crumbs">
        <a href="#/">Home</a><ChevronRight size={12} />
        <a href={`#/batch/${batchId}`}>Batch</a><ChevronRight size={12} />
        <span>{name}</span>
      </nav>
      <div className="page-head">
        <div>
          <h1 className="page-title">{name}</h1>
          <div className="page-sub">{loading ? 'Loading chapters…' : `${total} chapters · page ${page} of ${pages}`}</div>
        </div>
        <div className="spacer" />
        <div className="searchbox" style={{ maxWidth: 280 }}>
          <Search />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter chapters on this page" />
        </div>
      </div>

      {loading && <ListSkeleton count={8} />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!loading && !error && visible.length === 0 && <Empty title="No chapters found" icon={<FolderOpen />} />}
      {!loading && !error && visible.length > 0 && (
        <div className="card">
          {visible.map((t, i) => (
            <a className="list-item" key={t._id}
               href={`#/batch/${batchId}/subject/${slug}/topic/${t.slug}?name=${encodeURIComponent(name)}&topic=${encodeURIComponent(t.name)}&sid=${route.query.get('sid') ?? ''}`}>
              <span className="list-index">{(page - 1) * limit + i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="list-title">{t.name}</div>
                <div className="tiny muted">{t.videos ?? 0} videos · {t.notes ?? 0} notes</div>
              </div>
              <ChevronRight size={16} className="muted" />
            </a>
          ))}
        </div>
      )}
      {pages > 1 && (
        <div className="center row" style={{ justifyContent: 'center' }}>
          <button className="btn" disabled={page === 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="tiny muted">Page {page} of {pages}</span>
          <button className="btn" disabled={page >= pages || loading} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </>
  );
}
