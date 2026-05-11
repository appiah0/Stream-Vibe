// ─── TMDB API ────────────────────────────────────────────────────────────────
const KEY  = import.meta.env.VITE_TMDB_KEY || '';
const BASE = 'https://api.themoviedb.org/3';

export const IMG = {
  poster:   (p) => p ? `https://image.tmdb.org/t/p/w342${p}`  : null,
  posterLg: (p) => p ? `https://image.tmdb.org/t/p/w500${p}`  : null,
  backdrop: (b) => b ? `https://image.tmdb.org/t/p/w1280${b}` : null,
  face:     (f) => f ? `https://image.tmdb.org/t/p/w92${f}`   : null,
};

const _cache = new Map();
export async function tmdb(path, params = {}) {
  if (!KEY) return null;
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('api_key', KEY);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, String(v)));
  const k = url.toString();
  if (_cache.has(k)) return _cache.get(k);
  try {
    const r = await fetch(k);
    if (!r.ok) return null;
    const d = await r.json();
    _cache.set(k, d);
    return d;
  } catch { return null; }
}

// Movies
export const getPopularMovies  = (p=1)   => tmdb('/movie/popular',    { page:p });
export const getTopMovies      = (p=1)   => tmdb('/movie/top_rated',  { page:p });
export const getNowPlaying     = (p=1)   => tmdb('/movie/now_playing',{ page:p });
export const getUpcoming       = (p=1)   => tmdb('/movie/upcoming',   { page:p });
export const getMoviesByGenre  = (id,p=1)=> tmdb('/discover/movie',   { with_genres:id, sort_by:'popularity.desc', page:p });
export const getMovieDetail    = (id)    => tmdb(`/movie/${id}`,      { append_to_response:'videos,credits,similar' });

// TV
export const getPopularShows   = (p=1)   => tmdb('/tv/popular',       { page:p });
export const getTopShows       = (p=1)   => tmdb('/tv/top_rated',     { page:p });
export const getAiringToday    = (p=1)   => tmdb('/tv/airing_today',  { page:p });
export const getShowsByGenre   = (id,p=1)=> tmdb('/discover/tv',      { with_genres:id, sort_by:'popularity.desc', page:p });
export const getShowDetail     = (id)    => tmdb(`/tv/${id}`,         { append_to_response:'videos,credits,similar' });
export const getSeasonDetail   = (id,s)  => tmdb(`/tv/${id}/season/${s}`);
export const getTrending       = (w='week')=> tmdb(`/trending/all/${w}`);

// Genres
export const getMovieGenres    = ()      => tmdb('/genre/movie/list');
export const getTVGenres       = ()      => tmdb('/genre/tv/list');

// Search
export const searchAll         = (q,p=1) => tmdb('/search/multi', { query:q, page:p, include_adult:false });

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const getTitle  = (i) => i?.title || i?.name || '';
export const getYear   = (i) => (i?.release_date || i?.first_air_date || '').slice(0,4);
export const getRating = (i) => i?.vote_average?.toFixed(1) || '–';
export const getType   = (i) => i?.media_type || (i?.first_air_date !== undefined ? 'tv' : 'movie');

// ─── Embed Servers ────────────────────────────────────────────────────────────
// ALL servers (including VidLink) are sandboxed via the iframe sandbox attribute.
// sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
// This BLOCKS: window.open() ads, top-level redirects, new-tab navigation.
// The sandbox is what prevents redirects — not removing the server.
export const SERVERS = {
  movie: [
    { id:'vidlink',    name:'VidLink',     url:(id)      => `https://vidlink.pro/movie/${id}?autoplay=true&title=true` },
    { id:'vidsrc',     name:'VidSrc',      url:(id)      => `https://vidsrc.xyz/embed/movie?tmdb=${id}` },
    { id:'vidsrc2',    name:'VidSrc 2',    url:(id)      => `https://vidsrc.to/embed/movie/${id}` },
    { id:'autoembed',  name:'AutoEmbed',   url:(id)      => `https://autoembed.co/movie/tmdb/${id}` },
    { id:'2embed',     name:'2Embed',      url:(id)      => `https://www.2embed.cc/embed/${id}` },
    { id:'embedsu',    name:'EmbedSu',     url:(id)      => `https://embed.su/embed/movie/${id}` },
    { id:'multiembed', name:'MultiEmbed',  url:(id)      => `https://multiembed.mov/?video_id=${id}&tmdb=1` },
    { id:'smashystream',name:'SmashyStream',url:(id)     => `https://embed.smashystream.com/playere.php?tmdb=${id}` },
  ],
  tv: [
    { id:'vidlink',    name:'VidLink',     url:(id,s,e)  => `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true&title=true` },
    { id:'vidsrc',     name:'VidSrc',      url:(id,s,e)  => `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${s}&episode=${e}` },
    { id:'vidsrc2',    name:'VidSrc 2',    url:(id,s,e)  => `https://vidsrc.to/embed/tv/${id}/${s}/${e}` },
    { id:'autoembed',  name:'AutoEmbed',   url:(id,s,e)  => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}` },
    { id:'2embed',     name:'2Embed',      url:(id,s,e)  => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}` },
    { id:'embedsu',    name:'EmbedSu',     url:(id,s,e)  => `https://embed.su/embed/tv/${id}/${s}/${e}` },
    { id:'multiembed', name:'MultiEmbed',  url:(id,s,e)  => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}` },
    { id:'smashystream',name:'SmashyStream',url:(id,s,e) => `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}` },
  ],
};

// ─── Download Sources ─────────────────────────────────────────────────────────
// Opens a direct download URL. User long-presses on mobile to save.
export const DOWNLOAD = {
  movie: [
    { name:'360p  · Fast',   url:(id)     => `https://dl.vidsrc.vip/movie/${id}?quality=360p` },
    { name:'720p  · HD',     url:(id)     => `https://dl.vidsrc.vip/movie/${id}?quality=720p` },
    { name:'1080p · Full HD',url:(id)     => `https://dl.vidsrc.vip/movie/${id}?quality=1080p` },
    { name:'Subtitle (SRT)', url:(id)     => `https://dl.vidsrc.vip/movie/${id}/subtitles/en.srt`, isSub:true },
    { name:'Subtitle (VTT)', url:(id)     => `https://dl.vidsrc.vip/movie/${id}/subtitles/en.vtt`, isSub:true },
  ],
  tv: [
    { name:'360p  · Fast',   url:(id,s,e) => `https://dl.vidsrc.vip/tv/${id}/${s}/${e}?quality=360p` },
    { name:'720p  · HD',     url:(id,s,e) => `https://dl.vidsrc.vip/tv/${id}/${s}/${e}?quality=720p` },
    { name:'1080p · Full HD',url:(id,s,e) => `https://dl.vidsrc.vip/tv/${id}/${s}/${e}?quality=1080p` },
    { name:'Subtitle (SRT)', url:(id,s,e) => `https://dl.vidsrc.vip/tv/${id}/${s}/${e}/subtitles/en.srt`, isSub:true },
    { name:'Subtitle (VTT)', url:(id,s,e) => `https://dl.vidsrc.vip/tv/${id}/${s}/${e}/subtitles/en.vtt`, isSub:true },
  ],
};

// ─── Subtitle languages for in-app display ────────────────────────────────────
export const SUBTITLE_LANGS = [
  { code:'off', label:'Off' },
  { code:'en',  label:'English' },
  { code:'es',  label:'Spanish' },
  { code:'fr',  label:'French' },
  { code:'de',  label:'German' },
  { code:'ar',  label:'Arabic' },
  { code:'hi',  label:'Hindi' },
  { code:'pt',  label:'Portuguese' },
  { code:'it',  label:'Italian' },
  { code:'ja',  label:'Japanese' },
  { code:'ko',  label:'Korean' },
  { code:'zh',  label:'Chinese' },
  { code:'ru',  label:'Russian' },
  { code:'tr',  label:'Turkish' },
];
