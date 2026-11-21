export interface YouTubeSource {
  videoId: string;
  embedUrl: string;
  watchUrl: string;
}

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts a safe 11-character YouTube video ID from standard watch, shorts,
 * live, embed, mobile, music, or youtu.be URLs (or a raw 11-char ID).
 */
export function extractYouTubeVideoId(rawInput: string): string | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  if (VIDEO_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  let candidateUrl = trimmed;
  if (!/^https?:\/\//i.test(candidateUrl)) {
    if (/^(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//i.test(candidateUrl)) {
      candidateUrl = `https://${candidateUrl}`;
    } else {
      return null;
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(candidateUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');

  if (host === 'youtu.be') {
    const seg = parsed.pathname.split('/').filter(Boolean)[0] ?? '';
    return VIDEO_ID_REGEX.test(seg) ? seg : null;
  }

  if (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'music.youtube.com' ||
    host === 'youtube-nocookie.com'
  ) {
    const vParam = parsed.searchParams.get('v');
    if (vParam && VIDEO_ID_REGEX.test(vParam)) {
      return vParam;
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    if (
      segments.length >= 2 &&
      (segments[0] === 'embed' ||
        segments[0] === 'shorts' ||
        segments[0] === 'live' ||
        segments[0] === 'v')
    ) {
      return VIDEO_ID_REGEX.test(segments[1]) ? segments[1] : null;
    }
  }

  return null;
}

export function parseYouTubeSource(rawInput: string): YouTubeSource | null {
  const videoId = extractYouTubeVideoId(rawInput);
  if (!videoId) return null;
  return {
    videoId,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}
