import { Moon, Sun, Trash2, Info, Database } from 'lucide-react';
import { store, useTheme, useFavorites, useHistory, useDownloads } from '../lib/store';
import { Section } from '../components/ui';

export function Settings() {
  const theme = useTheme();
  const favorites = useFavorites();
  const history = useHistory();
  const pdfs = useDownloads();
  return (
    <>
      <div className="page-head"><div><h1 className="page-title">Settings</h1><div className="page-sub">Preferences are stored locally in your browser</div></div></div>

      <Section title="Appearance" icon={theme === 'dark' ? <Moon /> : <Sun />}>
        <div className="card pad row" style={{ justifyContent: 'space-between' }}>
          <div><strong>Theme</strong><div className="tiny muted">Warm paper light mode, or a low-glare dark mode.</div></div>
          <div className="row">
            <button className={`btn ${theme === 'light' ? 'primary' : ''}`} onClick={() => store.setTheme('light')}><Sun /> Light</button>
            <button className={`btn ${theme === 'dark' ? 'primary' : ''}`} onClick={() => store.setTheme('dark')}><Moon /> Dark</button>
          </div>
        </div>
      </Section>

      <Section title="Local data" icon={<Database />}>
        <div className="card">
          <div className="list-item"><div style={{ flex: 1 }}><strong>Favorites</strong><div className="tiny muted">{favorites.length} batches</div></div></div>
          <div className="list-item">
            <div style={{ flex: 1 }}><strong>History</strong><div className="tiny muted">{history.length} entries</div></div>
            <button className="btn" onClick={() => store.clearHistory()}><Trash2 /> Clear</button>
          </div>
          <div className="list-item">
            <div style={{ flex: 1 }}><strong>Saved PDFs</strong><div className="tiny muted">{pdfs.length} entries</div></div>
            <button className="btn" onClick={() => store.clearPdfs()}><Trash2 /> Clear</button>
          </div>
        </div>
      </Section>

      <Section title="About this app" icon={<Info />}>
        <div className="card pad html-body">
          <p>AryaVidya Study Portal — a fast, keyboard-friendly front end for browsing batches, chapters, lectures, notes, tests and the PDF bank.</p>
          <ul>
            <li>Batch catalog and all course data are fetched live from <code>stream.aryavidya.cc</code> through this app's own server proxy; nothing is hard-coded or mocked.</li>
            <li>Lecture playback opens the original AryaVidya player, which handles its own access rules. This app does not bypass any lock or subscription.</li>
            <li>Favorites, history, saved PDFs and theme never leave your browser.</li>
          </ul>
        </div>
      </Section>
    </>
  );
}
