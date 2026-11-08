import { useEffect, useState } from 'react';
import { Star, CalendarDays, BookOpen, ClipboardList, Megaphone, ChevronRight, Library, Clock, FileQuestion } from 'lucide-react';
import { api, imgUrl, teacherName, type Announcement, type Subject, type Test } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { useRoute } from '../lib/router';
import { store, useFavorites } from '../lib/store';
import { Empty, ErrorBox, ListSkeleton, Section, fmtDate, fmtTime } from '../components/ui';
import { sanitizeHtml } from '../lib/sanitize';

const TABS = ['subjects', 'description', 'tests', 'announcements', 'schedule'] as const;
type Tab = (typeof TABS)[number];
const LABEL: Record<Tab, string> = { subjects: 'Subjects', description: 'Description', tests: 'Tests', announcements: 'Announcements', schedule: 'Schedule' };

export function BatchPage({ batchId }: { batchId: string }) {
  const route = useRoute();
  const tabParam = (route.query.get('tab') || 'subjects') as Tab;
  const tab: Tab = TABS.includes(tabParam) ? tabParam : 'subjects';
  const { data, loading, error, reload } = useAsync((signal) => api.batch(batchId, signal), [batchId]);
  const batch = data?.data;
  useFavorites();

  useEffect(() => {
    if (batch) store.visit({ batch_id: batchId, name: batch.name, photo: imgUrl(batch.previewImage), path: `/batch/${batchId}` });
  }, [batch, batchId]);

  if (loading) return <ListSkeleton count={8} />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!batch) return <Empty title="Batch not found" />;

  const subjects = batch.subjects ?? [];
  const lectures = subjects.reduce((n, s) => n + (s.lectureCount ?? 0), 0);
  const fav = store.isFavorite(batchId);

  return (
    <>
      <nav className="crumbs">
        <a href="#/">Home</a><ChevronRight size={12} /><a href="#/batches">Batches</a><ChevronRight size={12} /><span>{batch.name}</span>
      </nav>

      <div className="batch-hero" style={{ marginBottom: 22 }}>
        <div className="card hero-main">
          {batch.previewImage?.key && <img className="hero-img" src={imgUrl(batch.previewImage)} alt="" />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="hero-title">{batch.name}</h1>
            {batch.byName && <div className="muted" style={{ marginBottom: 8 }}>{batch.byName}</div>}
            <div className="row" style={{ marginBottom: 12 }}>
              {batch.exam?.map((e) => <span className="chip gold" key={e}>{e}</span>)}
              {batch.class && <span className="chip">Class {batch.class}</span>}
              {batch.language && <span className="chip">{batch.language}</span>}
              {batch.mode && <span className="chip vio">{batch.mode}</span>}
            </div>
            <div className="row">
              <button className={`btn ${fav ? '' : 'primary'}`} onClick={() => store.toggleFavorite({ batch_id: batchId, name: batch.name, photo: imgUrl(batch.previewImage) })}>
                <Star /> {fav ? 'Saved to favorites' : 'Add to favorites'}
              </button>
              <a className="btn" href={`#/batch/${batchId}?tab=schedule`}><CalendarDays /> Schedule</a>
              {batch.khazanaProgramId && <a className="btn" href={`#/khazana/${batchId}`}><Library /> Khazana</a>}
            </div>
          </div>
        </div>

        <aside className="card side-facts">
          <h3 style={{ fontSize: 15 }}>Batch details</h3>
          <div className="fact"><span className="muted">Starts</span><b>{fmtDate(batch.startDate)}</b></div>
          <div className="fact"><span className="muted">Ends</span><b>{fmtDate(batch.endDate)}</b></div>
          <div className="fact"><span className="muted">Subjects</span><b>{subjects.length}</b></div>
          <div className="fact"><span className="muted">Lectures</span><b>{lectures.toLocaleString('en-IN')}</b></div>
          {typeof batch.fee?.amount === 'number' && <div className="fact"><span className="muted">Listed price</span><b>₹{batch.fee.amount.toLocaleString('en-IN')}</b></div>}
          <div className="tiny muted" style={{ borderTop: '1px solid var(--border-2)', paddingTop: 10 }}>
            Batch id <code>{batchId}</code>
          </div>
        </aside>
      </div>

      <div className="tabs">
        {TABS.map((t) => <a key={t} className={`tab ${t === tab ? 'active' : ''}`} href={`#/batch/${batchId}?tab=${t}`}>{LABEL[t]}</a>)}
      </div>

      {tab === 'subjects' && <SubjectsTab batchId={batchId} subjects={subjects} />}
      {tab === 'description' && (
        <div className="card pad html-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(batch.description || batch.shortDescription || '<p>No description provided.</p>') }} />
      )}
      {tab === 'tests' && <TestsTab batchId={batchId} />}
      {tab === 'announcements' && <AnnouncementsTab batchId={batchId} />}
      {tab === 'schedule' && <ScheduleTab batchId={batchId} />}
    </>
  );
}

function SubjectsTab({ batchId, subjects }: { batchId: string; subjects: Subject[] }) {
  if (!subjects.length) return <Empty title="No subjects published for this batch" icon={<BookOpen />} />;
  return (
    <div className="grid">
      {subjects.map((s) => (
        <a className="card subject-card" key={s._id}
           href={`#/batch/${batchId}/subject/${s.slug}?name=${encodeURIComponent(s.subject)}&sid=${s._id}`}>
          <img className="subject-img" src={imgUrl(s.imageId)} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
          <div style={{ minWidth: 0 }}>
            <div className="subject-name">{s.subject}</div>
            <div className="tiny muted">{s.lectureCount ?? 0} lectures · {s.tagCount ?? 0} chapters</div>
            {s.teacherIds?.[0] && <div className="tiny muted" style={{ marginTop: 2 }}>{teacherName(s.teacherIds[0])}</div>}
          </div>
        </a>
      ))}
    </div>
  );
}

function TestsTab({ batchId }: { batchId: string }) {
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<'tests' | 'dpp'>('tests');
  const { data, loading, error, reload } = useAsync(
    (signal) => (mode === 'tests' ? api.tests(batchId, page, signal) : api.dpp(batchId, page, signal)), [batchId, page, mode]);
  const tests: Test[] = (data?.data as Test[]) ?? [];
  return (
    <>
      <div className="filters">
        <button className={`btn ${mode === 'tests' ? 'primary' : ''}`} onClick={() => { setMode('tests'); setPage(1); }}><ClipboardList /> Test series</button>
        <button className={`btn ${mode === 'dpp' ? 'primary' : ''}`} onClick={() => { setMode('dpp'); setPage(1); }}><FileQuestion /> DPP</button>
      </div>
      {loading && <ListSkeleton />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!loading && !error && tests.length === 0 && <Empty title={`No ${mode === 'dpp' ? 'DPPs' : 'tests'} published here yet`} />}
      {!loading && !error && tests.length > 0 && (
        <div className="card">
          {tests.map((t, i) => (
            <div className="list-item" key={t._id}>
              <span className="list-index">{(page - 1) * 20 + i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="list-title">{t.name}</div>
                <div className="tiny muted">
                  {t.totalQuestions ?? '—'} questions · {t.totalMarks ?? '—'} marks
                  {t.maxDuration ? ` · ${t.maxDuration} min` : ''} · {fmtDate(t.startTime)}
                </div>
              </div>
              <div className="row">
                {t.tag1 && <span className="chip ok">{t.tag1}</span>}
                {t.testActivityStatus && <span className="chip">{t.testActivityStatus}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {tests.length > 0 && (
        <div className="center row" style={{ justifyContent: 'center' }}>
          <button className="btn" disabled={page === 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="tiny muted">Page {page}</span>
          <button className="btn" disabled={loading || tests.length < 8} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </>
  );
}

function AnnouncementsTab({ batchId }: { batchId: string }) {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync((signal) => api.announcements(batchId, page, signal), [batchId, page]);
  const items: Announcement[] = (data?.data as Announcement[]) ?? [];
  return (
    <>
      {loading && <ListSkeleton count={4} />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && <Empty title="No announcements" icon={<Megaphone />} />}
      {items.map((a) => (
        <div className="card pad" key={a._id} style={{ marginBottom: 12 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <strong>{a.title || 'Announcement'}</strong>
            <span className="tiny muted">{fmtDate(a.createdAt || a.created_at || a.date)}</span>
          </div>
          <div className="html-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(a.announcement || a.content || '') }} />
        </div>
      ))}
      {items.length > 0 && (
        <div className="center row" style={{ justifyContent: 'center' }}>
          <button className="btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="tiny muted">Page {page}</span>
          <button className="btn" disabled={items.length < 10} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </>
  );
}

interface ScheduleItem { _id?: string; topic?: string; subject?: string; startTime?: string; endTime?: string; status?: string; batchSubjectId?: { subject?: string }; tags?: { name?: string }[] }

function ScheduleTab({ batchId }: { batchId: string }) {
  const today = useAsync((signal) => api.todaySchedule(batchId, signal), [batchId]);
  const weekly = useAsync((signal) => api.weeklySchedule(batchId, signal), [batchId]);

  const flatten = (input: unknown): ScheduleItem[] => {
    if (Array.isArray(input)) return input as ScheduleItem[];
    if (input && typeof input === 'object') {
      return Object.values(input as Record<string, unknown>).flatMap((v) => (Array.isArray(v) ? (v as ScheduleItem[]) : []));
    }
    return [];
  };
  const todayItems = flatten(today.data?.data);
  const weekItems = flatten(weekly.data?.data);

  const render = (items: ScheduleItem[]) => (
    <div className="card">
      {items.map((s, i) => (
        <div className="list-item" key={s._id || i}>
          <span className="list-index"><Clock size={13} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="list-title">{s.topic || s.tags?.[0]?.name || 'Class'}</div>
            <div className="tiny muted">{s.batchSubjectId?.subject || s.subject || ''} {s.startTime ? `· ${fmtTime(s.startTime)}` : ''}</div>
          </div>
          {s.status && <span className="chip">{s.status}</span>}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Section title="Today's classes" icon={<CalendarDays />}>
        {today.loading && <ListSkeleton count={3} />}
        {today.error && <ErrorBox message={today.error} onRetry={today.reload} />}
        {!today.loading && !today.error && (todayItems.length ? render(todayItems) : <Empty title="No classes scheduled today" hint="Older or completed batches usually have an empty daily planner." />)}
      </Section>
      <Section title="Weekly schedule" icon={<CalendarDays />}>
        {weekly.loading && <ListSkeleton count={3} />}
        {weekly.error && <ErrorBox message={weekly.error} onRetry={weekly.reload} />}
        {!weekly.loading && !weekly.error && (weekItems.length ? render(weekItems) : <Empty title="No weekly schedule published" />)}
      </Section>
    </>
  );
}
