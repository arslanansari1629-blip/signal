import { Star } from 'lucide-react';
import { store, useFavorites } from '../lib/store';
import type { CatalogBatch } from '../lib/api';
import { navigate } from '../lib/router';

const FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#faefd3"/><text x="160" y="98" font-family="sans-serif" font-size="34" font-weight="700" fill="#c88a1a" text-anchor="middle">AryaVidya</text></svg>`
);

export function BatchCard({ batch }: { batch: CatalogBatch }) {
  useFavorites();
  const fav = store.isFavorite(batch.batch_id);
  const exam = Array.isArray(batch.exam) ? batch.exam.join(', ') : batch.exam;
  return (
    <article className="card batch-card">
      <a href={`#/batch/${batch.batch_id}`} aria-label={batch.name}>
        <img className="batch-thumb" src={batch.photo || FALLBACK} alt="" loading="lazy"
             onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }} />
      </a>
      <button className={`fav-btn ${fav ? 'on' : ''}`} title={fav ? 'Remove from favorites' : 'Add to favorites'}
              onClick={() => store.toggleFavorite(batch)} aria-pressed={fav}>
        <Star />
      </button>
      <div className="batch-body">
        <a className="batch-name" href={`#/batch/${batch.batch_id}`}>{batch.name}</a>
        {batch.byName && <div className="tiny muted">{batch.byName}</div>}
        <div className="batch-meta">
          {exam && <span className="chip gold">{exam}</span>}
          {batch.class && <span className="chip">Class {batch.class}</span>}
          {batch.language && <span className="chip">{batch.language}</span>}
        </div>
        <div className="spacer" />
        <button className="btn primary" style={{ justifyContent: 'center' }} onClick={() => navigate(`/batch/${batch.batch_id}`)}>
          Explore batch
        </button>
      </div>
    </article>
  );
}
