/**
 * Playable-source resolution.
 *
 * The upstream API blanks `videoUrl` / `hls_url` / `video_id` for every lecture, but
 * for YouTube-hosted lectures it still returns the real thumbnail, e.g.
 *   https://i.ytimg.com/vi/nmp4YViMoOo/mqdefault.jpg
 * That thumbnail carries the public YouTube id, so those lectures can be played in
 * an ordinary YouTube embed. Nothing here defeats a lock or a DRM stream: if the
 * only source is a protected PW stream we hand the visitor to AryaVidya instead.
 */

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/** Pull a YouTube id out of an id, watch/embed/shorts URL, or ytimg thumbnail. */
export function youtubeIdFrom(value) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  if (YT_ID.test(s)) return s;
  const patterns = [
    /(?:youtube\.com|youtube-nocookie\.com)\/(?:watch\?(?:[^#\s]*&)?v=|embed\/|shorts\/|live\/|v\/)([A-Za-z0-9_-]{11})/i,
    /youtu\.be\/([A-Za-z0-9_-]{11})/i,
    /(?:i\.ytimg\.com|img\.youtube\.com|i\d\.ytimg\.com)\/vi(?:_webp)?\/([A-Za-z0-9_-]{11})\//i
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return '';
}

export function youtubeId(content) {
  const v = content?.videoDetails ?? {};
  const candidates = [v.video_id, v.videoUrl, content?.url, content?.ytStreamUrl, v.embedCode, v.image];
  for (const c of candidates) {
    const id = youtubeIdFrom(c);
    if (id) return id;
  }
  return '';
}

const isHttp = (u) => typeof u === 'string' && /^https?:\/\//i.test(u.trim());

/** Can this browser play an HLS playlist without a player library? */
export function supportsNativeHls() {
  if (typeof document === 'undefined') return false;
  const el = document.createElement('video');
  return Boolean(el.canPlayType('application/vnd.apple.mpegurl'));
}

/**
 * @returns {{kind:'youtube'|'file'|'external', id?:string, url:string, embed?:string}}
 */
export function watchTarget(content) {
  const id = youtubeId(content);
  if (id) {
    return {
      kind: 'youtube',
      id,
      url: `https://www.youtube.com/watch?v=${id}`,
      embed: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`
    };
  }
  const v = content?.videoDetails ?? {};
  const file = [v.videoUrl, content?.url, v.hls_url].find(isHttp);
  if (file) {
    const hls = /\.m3u8(\?|$)/i.test(file);
    if (!hls || supportsNativeHls()) return { kind: 'file', url: file.trim() };
  }
  return { kind: 'external', url: '' };
}

/**
 * Links pasted out of HTML often arrive entity-escaped, so `?name=Notices&amp;sid=x`
 * parses as a parameter literally named `amp;sid` and the real `sid` goes missing.
 */
export function normalizeSearch(search) {
  return String(search ?? '')
    .replace(/&(?:amp;|amp|AMP;|AMP)+/g, '&')
    .replace(/&#(?:38|x26);/gi, '&');
}
