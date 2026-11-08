/**
 * Upstream failures are not always JSON: Cloudflare answers with a bot-check HTML
 * page, and the proxy forwards that text. Turn any of it into one readable line.
 */
export function friendlyError(message) {
  const text = String(message ?? '').trim();
  if (!text) return 'Something went wrong.';
  if (/token expired|invalid token|token is invalid/i.test(text)) {
    return "AryaVidya's access token for this batch has expired, so its chapters and lectures can't be listed right now. Retry later, or open the batch on AryaVidya.";
  }
  if (/<!doctype|<html|<head|just a moment/i.test(text)) {
    return "AryaVidya blocked this request (bot protection). This content can only be opened on AryaVidya itself.";
  }
  const plain = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return (plain || 'Something went wrong.').slice(0, 240);
}
