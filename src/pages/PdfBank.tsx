import { useState } from 'react';
import { ChevronRight, FileText, Folder, ExternalLink, ArrowLeft } from 'lucide-react';
import { api, nodeUrl, type PdfExam, type PdfNode } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { Empty, ErrorBox, ListSkeleton, Modal } from '../components/ui';
import { store } from '../lib/store';
import { useRoute } from '../lib/router';

export function PdfBank() {
  const { data, loading, error, reload } = useAsync((signal) => api.pdfBank(signal), []);
  const exams: PdfExam[] = data?.data ?? [];
  const [examIdx, setExamIdx] = useState(0);
  const route = useRoute();
  // Deep-linkable folders, e.g. #/pdf-bank?deeplink=/JEE/Mindmaps
  const [trail, setTrail] = useState<PdfNode[]>(() => {
    const link = route.query.get('deeplink');
    return link ? [{ name: link.split('/').filter(Boolean).pop() || link, deeplink: link }] : [];
  });
  const [pdf, setPdf] = useState<{ name: string; url: string } | null>(null);
  const deeplink = trail.length ? trail[trail.length - 1].deeplink ?? '' : '';

  const nodes = useAsync(
    (signal) => api.pdfNodes(deeplink, signal),
    [deeplink],
    Boolean(deeplink)
  );

  const exam = exams[examIdx];
  const list: PdfNode[] = trail.length ? nodes.data?.data ?? [] : exam?.categories ?? [];

  const open = (node: PdfNode) => {
    const url = nodeUrl(node);
    if (url) {
      setPdf({ name: node.name, url });
      store.savePdf({ name: node.name, url, context: `PDF Bank · ${trail.map((t) => t.name).join(' / ') || exam?.exam || ''}` });
      return;
    }
    if (node.deeplink) setTrail((t) => [...t, node]);
  };

  return (
    <>
      <nav className="crumbs">
        <a href="#/">Home</a><ChevronRight size={12} />
        <button className="link" style={{ background: 'none', border: 'none', padding: 0 }} onClick={() => setTrail([])}>PDF Bank</button>
        {exam && !trail.length && <><ChevronRight size={12} /><span>{exam.exam}</span></>}
        {trail.map((t, i) => (
          <span key={t.deeplink || i} className="row" style={{ gap: 6 }}>
            <ChevronRight size={12} />
            <button className="link" style={{ background: 'none', border: 'none', padding: 0 }} onClick={() => setTrail((prev) => prev.slice(0, i + 1))}>{t.name}</button>
          </span>
        ))}
      </nav>
      <div className="page-head">
        <div>
          <h1 className="page-title">PDF Bank</h1>
          <div className="page-sub">Mindmaps, short notes, formula sheets, PYQs and NCERT material</div>
        </div>
        <div className="spacer" />
        {trail.length > 0 && <button className="btn" onClick={() => setTrail((t) => t.slice(0, -1))}><ArrowLeft /> Back</button>}
      </div>

      {loading && <ListSkeleton count={6} />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {!loading && !error && exams.length > 0 && (
        <div className="tabs">
          {exams.map((e, i) => (
            <button key={e.exam} className={`tab ${i === examIdx ? 'active' : ''}`} onClick={() => { setExamIdx(i); setTrail([]); }}>{e.exam}</button>
          ))}
        </div>
      )}

      {trail.length > 0 && nodes.loading && <ListSkeleton count={6} />}
      {trail.length > 0 && nodes.error && <ErrorBox message={nodes.error} onRetry={nodes.reload} />}
      {((trail.length === 0 && !loading && !error) || (trail.length > 0 && !nodes.loading && !nodes.error)) && (
        list.length === 0
          ? <Empty title="Nothing published in this folder yet" icon={<Folder />} />
          : (
            <div className="card">
              {list.map((n, i) => {
                const url = nodeUrl(n);
                return (
                  <button className="list-item" key={n.deeplink || n.nodeId || i} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }} onClick={() => open(n)}>
                    <span className="list-index">{url ? <FileText size={13} /> : <Folder size={13} />}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="list-title">{n.name}</div>
                      {n.type && <div className="tiny muted">{n.type}</div>}
                    </div>
                    <ChevronRight size={16} className="muted" />
                  </button>
                );
              })}
            </div>
          )
      )}

      {pdf && (
        <Modal title={pdf.name} onClose={() => setPdf(null)} footer={<a className="btn" href={pdf.url} target="_blank" rel="noreferrer"><ExternalLink /> Open original</a>}>
          <iframe className="pdf-frame" src={pdf.url} title={pdf.name} />
        </Modal>
      )}
    </>
  );
}
