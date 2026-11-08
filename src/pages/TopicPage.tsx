import { useState } from 'react';
import { ChevronRight, PlayCircle, FileText, Download, ExternalLink, Video, Lock } from 'lucide-react';
import { api, attachmentUrl, playerLink, teacherName, type Content } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { useRoute } from '../lib/router';
import { Empty, ErrorBox, ListSkeleton, Modal, fmtDate, fmtTime } from '../components/ui';
import { store } from '../lib/store';

export function TopicPage({ batchId, slug, tag }: { batchId: string; slug: string; tag: string }) {
  const route = useRoute();
  const subjectName = route.query.get('name') || 'Subject';
  const topicName = route.query.get('topic') || 'Chapter';
  const subjectId = route.query.get('sid') || '';
  const [type, setType] = useState<'videos' | 'notes'>(route.query.get('type') === 'notes' ? 'notes' : 'videos');
  const [page, setPage] = useState(1);
  const [pdf, setPdf] = useState<{ name: string; url: string } | null>(null);
  const { data, loading, error, reload } = useAsync(
    (signal) => api.contents(batchId, slug, tag, type, page, signal), [batchId, slug, tag, type, page]);
  const items: Content[] = data?.data ?? [];
  const hasMore = items.length >= 20;

  const openPdf = (name: string, url: string) => {
    setPdf({ name, url });
    store.savePdf({ name, url, context: `${subjectName} · ${topicName}` });
  };

  const watch = (c: Content) => {
    const url = playerLink(batchId, subjectId, c);
    store.visit({ batch_id: batchId, name: `${c.topic || c.videoDetails?.name} — ${subjectName}`, path: `/batch/${batchId}/subject/${slug}/topic/${tag}?name=${encodeURIComponent(subjectName)}&topic=${encodeURIComponent(topicName)}&sid=${subjectId}` });
    window.open(url, '_blank', 'noopener');
  };

  return (
    <>
      <nav className="crumbs">
        <a href="#/">Home</a><ChevronRight size={12} />
        <a href={`#/batch/${batchId}`}>Batch</a><ChevronRight size={12} />
        <a href={`#/batch/${batchId}/subject/${slug}?name=${encodeURIComponent(subjectName)}&sid=${subjectId}`}>{subjectName}</a>
        <ChevronRight size={12} /><span>{topicName}</span>
      </nav>
      <div className="page-head">
        <div>
          <h1 className="page-title">{topicName}</h1>
          <div className="page-sub">{subjectName} · {loading ? 'loading…' : `${items.length} items on page ${page}`}</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${type === 'videos' ? 'active' : ''}`} onClick={() => { setType('videos'); setPage(1); }}>Lectures</button>
        <button className={`tab ${type === 'notes' ? 'active' : ''}`} onClick={() => { setType('notes'); setPage(1); }}>Notes &amp; PDFs</button>
      </div>

      {loading && <ListSkeleton count={6} />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && <Empty title={type === 'videos' ? 'No lectures in this chapter' : 'No notes in this chapter'} icon={type === 'videos' ? <Video /> : <FileText />} />}

      {!loading && !error && items.length > 0 && (
        <div className="card">
          {items.map((c) => (
            <div className="list-item" key={c._id} style={{ alignItems: 'flex-start' }}>
              {type === 'videos' ? (
                <>
                  {c.videoDetails?.image
                    ? <img className="lecture-thumb" src={c.videoDetails.image} alt="" loading="lazy" />
                    : <span className="lecture-thumb" style={{ display: 'grid', placeItems: 'center' }}><PlayCircle className="muted" /></span>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="list-title">{c.topic || c.videoDetails?.name || 'Lecture'}</div>
                    <div className="tiny muted">
                      {fmtDate(c.date || c.startTime)} {fmtTime(c.startTime)}
                      {c.videoDetails?.duration ? ` · ${c.videoDetails.duration}` : ''}
                      {c.teachers?.length ? ` · ${teacherName(c.teachers[0])}` : ''}
                    </div>
                    <div className="row" style={{ marginTop: 8 }}>
                      <button className="btn primary" onClick={() => watch(c)}><PlayCircle /> Watch lecture</button>
                      {c.hasAttachment && <button className="btn" onClick={() => { setType('notes'); setPage(1); }}><FileText /> Notes</button>}
                      {c.isLocked && <span className="chip"><Lock size={11} /> Player opens on AryaVidya</span>}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <span className="list-index"><FileText size={14} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="list-title">{c.topic || 'Notes'}</div>
                    <div className="tiny muted">{fmtDate(c.date || c.startTime)}</div>
                    <div className="row" style={{ marginTop: 8 }}>
                      {(c.homeworkIds ?? []).flatMap((h) => h.attachmentIds ?? []).map((a) => {
                        const url = attachmentUrl(a);
                        if (!url) return null;
                        const label = a.name || 'Attachment';
                        return (
                          <span className="row" key={a._id} style={{ gap: 6 }}>
                            <button className="btn" onClick={() => openPdf(label, url)}><FileText /> {label.length > 28 ? `${label.slice(0, 28)}…` : label}</button>
                            <a className="icon-btn" href={url} target="_blank" rel="noreferrer" title="Download"><Download /></a>
                          </span>
                        );
                      })}
                      {!(c.homeworkIds ?? []).some((h) => (h.attachmentIds ?? []).length > 0) && <span className="tiny muted">No attachment published for this entry.</span>}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="center row" style={{ justifyContent: 'center' }}>
          <button className="btn" disabled={page === 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="tiny muted">Page {page}</span>
          <button className="btn" disabled={!hasMore || loading} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      {pdf && (
        <Modal title={pdf.name} onClose={() => setPdf(null)}
               footer={<a className="btn" href={pdf.url} target="_blank" rel="noreferrer"><ExternalLink /> Open original</a>}>
          <iframe className="pdf-frame" src={pdf.url} title={pdf.name} />
        </Modal>
      )}
    </>
  );
}
