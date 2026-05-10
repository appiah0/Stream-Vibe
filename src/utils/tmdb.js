// ─── TMDB API ────────────────────────────────────────────────────────────────
// IMPORTANT: Add your free key at https://www.themoviedb.org/settings/api
// Then set VITE_TMDB_KEY in Vercel's Environment Variables dashboard
const KEY = import.meta.env.VITE_TMDB_KEY || '';
const BASE = 'https://api.themoviedb.org/3';

export const IMG = {
  poster:   (p) => p ? `https://image.tmdb.org/t/p/w342${p}` : null,
  backdrop: (b) => b ? `https://image.tmdb.org/t/p/w1280${b}` : null,
  thumb:    (p) => p ? `https://image.tmdb.org/t/p/w92${p}` : null,
};

// Simple in-memory cache
const _cache = new Map();
async function api(path, params = {}) {
  if (!KEY) return null;
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('api_key', KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const cacheKey = url.toString();
  if (_cache.has(cacheKey)) return _cache.get(cacheKey);
  try {
    const res = await fetch(cacheKey);
    if (!res.ok) return null;
    const data = await res.json();
    _cache.set(cacheKey, data);
    return data;
  } catch { return null; }
}

// Movies
export const trending     = (w = 'week')    => api(`/trending/all/${w}`);
export const popularMovies= (page = 1)      => api('/movie/popular', { page });
export const topMovies    = (page = 1)      => api('/movie/top_rated', { page });
export const nowPlaying   = (page = 1)      => api('/movie/now_playing', { page });
export const upcoming     = (page = 1)      => api('/movie/upcoming', { page });
export const moviesByGenre= (id, page = 1)  => api('/discover/movie', { with_genres: id, sort_by: 'popularity.desc', page });
export const movieDetail  = (id)            => api(`/movie/${id}`, { append_to_response: 'videos,credits,similar' });

// TV
export const popularShows = (page = 1)      => api('/tv/popular', { page });
export const topShows     = (page = 1)      => api('/tv/top_rated', { page });
export const airingToday  = (page = 1)      => api('/tv/airing_today', { page });
export const showsByGenre = (id, page = 1)  => api('/discover/tv', { with_genres: id, sort_by: 'popularity.desc', page });
export const showDetail   = (id)            => api(`/tv/${id}`, { append_to_response: 'videos,credits,similar' });
export const seasonDetail = (id, s)         => api(`/tv/${id}/season/${s}`);

// Genres
export const movieGenres  = ()              => api('/genre/movie/list');
export const tvGenres     = ()              => api('/genre/tv/list');

// Search
export const search       = (q, page = 1)  => api('/search/multi', { query: q, page, include_adult: false });

// ─── Embed Sources (in-app iframe players – no redirect) ─────────────────────
// These are open embed APIs. The video plays INSIDE the app in an iframe.
// If one server is down, user can switch to the next.
export const SERVERS = {
  movie: [
    { name: 'Server 1 · VidSrc',    url: (id) => `https://vidsrc.xyz/embed/movie?tmdb=${id}` },
    { name: 'Server 2 · VidSrc Pro', url: (id) => `https://vidsrc.to/embed/movie/${id}` },
    { name: 'Server 3 · AutoEmbed', url: (id) => `https://autoembed.co/movie/tmdb/${id}` },
    { name: 'Server 4 · 2Embed',    url: (id) => `https://www.2embed.cc/embed/${id}` },
    { name: 'Server 5 · VidLink',   url: (id) => `https://vidlink.pro/movie/${id}?autoplay=true` },
    { name: 'Server 6 · EmbedSu',   url: (id) => `https://embed.su/embed/movie/${id}` },
    { name: 'Server 7 · MultiEmbed',url: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1` },
  ],
  tv: [
    { name: 'Server 1 · VidSrc',    url: (id, s, e) => `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${s}&episode=${e}` },
    { name: 'Server 2 · VidSrc Pro', url: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}` },
    { name: 'Server 3 · AutoEmbed', url: (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}` },
    { name: 'Server 4 · 2Embed',    url: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}` },
    { name: 'Server 5 · VidLink',   url: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true` },
    { name: 'Server 6 · EmbedSu',   url: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}` },
    { name: 'Server 7 · MultiEmbed',url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}` },
  ],
};

// ─── Download helper ─────────────────────────────────────────────────────────
// Uses open APIs that return downloadable quality options
export const DOWNLOAD_SOURCES = {
  movie: [
    { name: '720p · Fast', url: (id) => `https://dl.vidsrc.vip/movie/${id}` },
    { name: '1080p · HD',  url: (id) => `https://dl2.vidsrc.vip/movie/${id}` },
  ],
  tv: [
    { name: '720p · Fast', url: (id, s, e) => `https://dl.vidsrc.vip/tv/${id}/${s}/${e}` },
    { name: '1080p · HD',  url: (id, s, e) => `https://dl2.vidsrc.vip/tv/${id}/${s}/${e}` },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const getTitle   = (item) => item?.title || item?.name || 'Unknown';
export const getYear    = (item) => (item?.release_date || item?.first_air_date || '').slice(0, 4);
export const getRating  = (item) => item?.vote_average?.toFixed(1) || '–';
export const getType    = (item) => item?.media_type || (item?.first_air_date !== undefined ? 'tv' : 'movie');
