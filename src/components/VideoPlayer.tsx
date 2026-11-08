import { ExternalLink, Youtube } from 'lucide-react';
import { Modal } from './ui';
import type { WatchTarget } from '../lib/media.mjs';

/**
 * In-app player. YouTube-hosted lectures play in a normal YouTube embed; a plain
 * media URL plays in a <video> element. Protected streams never reach this component.
 */
export function VideoPlayer({ title, target, onClose, fallbackHref }: {
  title: string;
  target: WatchTarget;
  onClose: () => void;
  fallbackHref: string;
}) {
  const footer = (
    <>
      {target.kind === 'youtube' && (
        <a className="btn" href={target.url} target="_blank" rel="noreferrer"><Youtube /> YouTube</a>
      )}
      <a className="btn" href={fallbackHref} target="_blank" rel="noreferrer"><ExternalLink /> AryaVidya</a>
    </>
  );

  return (
    <Modal title={title} onClose={onClose} footer={footer}>
      {target.kind === 'youtube' ? (
        <>
          <iframe
            className="video-frame"
            src={target.embed}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          <div className="tiny muted" style={{ marginTop: 10 }}>
            Streaming from YouTube. If the player says the video is unavailable, the uploader removed
            it or disabled embedding — the AryaVidya button above opens the batch there.
          </div>
        </>
      ) : target.kind === 'file' ? (
        <video className="video-frame" src={target.url} controls autoPlay playsInline />
      ) : null}
    </Modal>
  );
}
