// TMDB API Utility
// Get a free API key at https://www.themoviedb.org/settings/api

const API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'YOUR_TMDB_API_KEY_HERE';
const BASE_URL = 'https://api.themoviedb.org/3';
export const IMG_BASE = 'https://image.tmdb.org/t/p';
export const POSTER = (p) => p ? `${IMG_BASE}/w342${p}` : '/placeholder.png';
export const BACKDROP = (b) => b ? `${IMG_BASE}/w1280${b}` : '/placeholder-wide.png';
export const POSTER_LG = (p) => p ? `${IMG_BASE}/w500${p}` : '/placeholder.png';

const cache = new Map();

async function tmdb(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const key = url.toString();
  if (cache.has(key)) return cache.get(key);
  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    cache.set(key, data);
    return data;
  } catch (e) {
    console.error('TMDB fetch failed:', e);
    return null;
  }
}

// ── Movies ──────────────────────────────────────────────
export const getTrending = (type = 'all', window = 'week') =>
  tmdb(`/trending/${type}/${window}`);

export const getPopularMovies = (page = 1) =>
  tmdb('/movie/popular', { page });

export const getTopRatedMovies = (page = 1) =>
  tmdb('/movie/top_rated', { page });

export const getNowPlaying = (page = 1) =>
  tmdb('/movie/now_playing', { page });

export const getUpcoming = (page = 1) =>
  tmdb('/movie/upcoming', { page });

export const getMoviesByGenre = (genreId, page = 1) =>
  tmdb('/discover/movie', { with_genres: genreId, sort_by: 'popularity.desc', page });

export const getMovieDetails = (id) =>
  tmdb(`/movie/${id}`, { append_to_response: 'videos,credits,similar,recommendations,watch/providers' });

// ── TV Shows ─────────────────────────────────────────────
export const getPopularShows = (page = 1) =>
  tmdb('/tv/popular', { page });

export const getTopRatedShows = (page = 1) =>
  tmdb('/tv/top_rated', { page });

export const getAiringToday = (page = 1) =>
  tmdb('/tv/airing_today', { page });

export const getOnTheAir = (page = 1) =>
  tmdb('/tv/on_the_air', { page });

export const getShowsByGenre = (genreId, page = 1) =>
  tmdb('/discover/tv', { with_genres: genreId, sort_by: 'popularity.desc', page });

export const getShowDetails = (id) =>
  tmdb(`/tv/${id}`, { append_to_response: 'videos,credits,similar,recommendations' });

export const getSeasonDetails = (showId, season) =>
  tmdb(`/tv/${showId}/season/${season}`);

// ── Search ───────────────────────────────────────────────
export const searchMulti = (query, page = 1) =>
  tmdb('/search/multi', { query, page, include_adult: false });

export const searchMovies = (query, page = 1) =>
  tmdb('/search/movie', { query, page });

export const searchShows = (query, page = 1) =>
  tmdb('/search/tv', { query, page });

// ── Genres ───────────────────────────────────────────────
export const getMovieGenres = () => tmdb('/genre/movie/list');
export const getTVGenres = () => tmdb('/genre/tv/list');

// ── Embed Sources (Multi-server like Onstream) ───────────
// These are publicly-available embed aggregators — for educational/demo use
export const EMBED_SOURCES = {
  movie: [
    (id) => `https://vidsrc.xyz/embed/movie/${id}`,
    (id) => `https://vidsrc.to/embed/movie/${id}`,
    (id) => `https://2embed.org/embed/${id}`,
    (id) => `https://www.2embed.cc/embed/${id}`,
    (id) => `https://autoembed.co/movie/tmdb/${id}`,
    (id) => `https://vidlink.pro/movie/${id}`,
    (id) => `https://embed.su/embed/movie/${id}`,
  ],
  tv: [
    (id, s, e) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`,
    (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
    (id, s, e) => `https://2embed.org/embed/tv?id=${id}&s=${s}&e=${e}`,
    (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`,
    (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
    (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  ]
};

export const getEmbedUrl = (type, id, season = 1, episode = 1, serverIndex = 0) => {
  if (type === 'movie') {
    return EMBED_SOURCES.movie[serverIndex % EMBED_SOURCES.movie.length](id);
  }
  return EMBED_SOURCES.tv[serverIndex % EMBED_SOURCES.tv.length](id, season, episode);
};
