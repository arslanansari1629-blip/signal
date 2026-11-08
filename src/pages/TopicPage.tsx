import { useState } from 'react';
import { ChevronRight, PlayCircle, FileText, Download, ExternalLink, Video, Lock, Youtube } from 'lucide-react';
import { api, attachmentUrl, playerLink, referenceBatchLink, teacherName, type Content } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { useRoute } from '../lib/router';
import { Empty, ErrorBox, ListSkeleton, Modal, fmtDate, fmtTime } from '../components/ui';
import { store } from '../lib/store';
import { watchTarget } from '../lib/media.mjs';
import { VideoPlayer } from '../components/VideoPlayer';

export function TopicPage({ batchId, slug, tag }: { batchId: string; slug: string; tag: string }) {
  const route = useRoute();
  const subjectName = route.query.get('name') || 'Subject';
  const topicName = route.query.get('topic') || 'Chapter';
  const subjectId = route.query.get('sid') || '';
  const [type, setType] = useState<'videos' | 'notes'>(route.query.get('type') === 'notes' ? 'notes' : 'videos');
  const [page, setPage] = useState(1);
  const [pdf, setPdf] = useState<{ name: string; url: string } | null>(null);
  const [playing, setPlaying] = useState<{ title: string; target: ReturnType<typeof watchTarget>; href: string } | null>(null);
  const { data, loading, error, reload } = useAsync(
    (signal) => api.contents(batchId, slug, tag, type, page, signal), [batchId, slug, tag, type, page]);
  const items: Content[] = data?.data ?? [];
  const total = data?.paginate?.totalCount ?? items.length;
  const limit = data?.paginate?.limit ?? 20;
  const pages = Math.max(1, Math.ceil(total / limit));

  const openPdf = (name: string, url: string) => {
    setPdf({ name, url });
    store.savePdf({ name, url, context: `${subjectName} · ${topicName}` });
  };

  const watch = (c: Content) => {
    const title = c.topic || c.videoDetails?.name || 'Lecture';
    const href = playerLink(batchId, subjectId, c);
    store.visit({ batch_id: batchId, name: `${title} — ${subjectName}`, path: `/batch/${batchId}/subject/${slug}/topic/${tag}?name=${encodeURIComponent(subjectName)}&topic=${encodeURIComponent(topicName)}&sid=${subjectId}` });
    const target = watchTarget(c);
    if (target.kind === 'external') { window.open(href, '_blank', 'noopener'); return; }
    setPlaying({ title, target, href });
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
          <div className="page-sub">{subjectName} · {loading ? 'loading…' : `${total} ${type === 'videos' ? 'lectures' : 'notes'} · page ${page} of ${pages}`}</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${type === 'videos' ? 'active' : ''}`} onClick={() => { setType('videos'); setPage(1); }}>Lectures</button>
        <button className={`tab ${type === 'notes' ? 'active' : ''}`} onClick={() => { setType('notes'); setPage(1); }}>Notes &amp; PDFs</button>
      </div>

      {loading && <ListSkeleton count={6} />}
      {error && <ErrorBox message={error} onRetry={reload} href={referenceBatchLink(batchId)} />}
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
                      <button className="btn primary" onClick={() => watch(c)}>
                        {watchTarget(c).kind === 'external' ? <><ExternalLink /> Open on AryaVidya</> : <><PlayCircle /> Play lecture</>}
                      </button>
                      {c.hasAttachment && <button className="btn" onClick={() => { setType('notes'); setPage(1); }}><FileText /> Notes</button>}
                      {watchTarget(c).kind === 'youtube'
                        ? <span className="chip"><Youtube size={11} /> YouTube</span>
                        : c.isLocked && <span className="chip"><Lock size={11} /> Opens on AryaVidya</span>}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <span className="list-index"><FileText size={14} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {(c.homeworkIds?.length ? c.homeworkIds : [{ _id: c._id, topic: c.topic, note: '', attachmentIds: [] }]).map((h, hi) => {
                      const atts = h.attachmentIds ?? [];
                      const openable = atts.filter((a) => attachmentUrl(a));
                      return (
                        <div className="note-entry" key={h._id || hi}>
                          <div className="list-title">{h.topic || c.topic || (c.isDPPNotes ? 'DPP' : 'Class notes')}</div>
                          <div className="tiny muted">{h.note ? `${h.note} · ` : ''}{fmtDate(c.date || c.startTime)}</div>
                          <div className="row" style={{ marginTop: 8 }}>
                            {openable.map((a) => {
                              const url = attachmentUrl(a);
                              const label = a.name || 'Attachment';
                              return (
                                <span className="row" key={a._id} style={{ gap: 6 }}>
                                  <button className="btn" onClick={() => openPdf(label, url)}><FileText /> {label.length > 28 ? `${label.slice(0, 28)}…` : label}</button>
                                  <a className="icon-btn" href={url} target="_blank" rel="noreferrer" title="Download"><Download /></a>
                                </span>
                              );
                            })}
                            {atts.length > 0 && openable.length === 0 && (
                              <>
                                <span className="chip"><Lock size={11} /> {atts[0].name || 'Protected file'}</span>
                                <a className="btn" href={referenceBatchLink(batchId)} target="_blank" rel="noreferrer">
                                  <ExternalLink /> Open on AryaVidya
                                </a>
                              </>
                            )}
                            {atts.length === 0 && <span className="tiny muted">No attachment published for this entry.</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && pages > 1 && (
        <div className="center row" style={{ justifyContent: 'center' }}>
          <button className="btn" disabled={page === 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="tiny muted">Page {page} of {pages}</span>
          <button className="btn" disabled={page >= pages || loading} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      {playing && (
        <VideoPlayer title={playing.title} target={playing.target} fallbackHref={playing.href} onClose={() => setPlaying(null)} />
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
