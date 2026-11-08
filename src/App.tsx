import { useEffect } from 'react';
import { Shell } from './components/Shell';
import { useRoute } from './lib/router';
import { applyTheme } from './lib/store';
import { Dashboard } from './pages/Dashboard';
import { Batches } from './pages/Batches';
import { BatchPage } from './pages/BatchPage';
import { SubjectPage } from './pages/SubjectPage';
import { TopicPage } from './pages/TopicPage';
import { Favorites, HistoryPage, Downloads } from './pages/Library';
import { PdfBank } from './pages/PdfBank';
import { Khazana, KhazanaPicker } from './pages/Khazana';
import { Settings } from './pages/Settings';
import { Empty } from './components/ui';

export default function App() {
  const route = useRoute();
  useEffect(() => { applyTheme(); }, []);
  const p = route.parts;

  let page: React.ReactNode;
  if (p.length === 0) page = <Dashboard />;
  else if (p[0] === 'batches') page = <Batches />;
  else if (p[0] === 'favorites') page = <Favorites />;
  else if (p[0] === 'history') page = <HistoryPage />;
  else if (p[0] === 'downloads') page = <Downloads />;
  else if (p[0] === 'settings') page = <Settings />;
  else if (p[0] === 'pdf-bank') page = <PdfBank />;
  else if (p[0] === 'khazana') page = p[1] ? <Khazana batchId={p[1]} /> : <KhazanaPicker />;
  else if (p[0] === 'batch' && p[1]) {
    if (p[2] === 'subject' && p[3]) {
      page = p[4] === 'topic' && p[5]
        ? <TopicPage batchId={p[1]} slug={p[3]} tag={p[5]} />
        : <SubjectPage batchId={p[1]} slug={p[3]} />;
    } else page = <BatchPage batchId={p[1]} />;
  } else page = <Empty title="Page not found" hint="Use the sidebar to get back on track." />;

  return <Shell>{page}</Shell>;
}
