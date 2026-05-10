import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getTrending, getPopularMovies, getTopRatedMovies, getNowPlaying, getUpcoming,
  getPopularShows, getTopRatedShows, getAiringToday, getMovieDetails, getShowDetails,
  getSeasonDetails, searchMulti, getMovieGenres, getTVGenres,
  getMoviesByGenre, getShowsByGenre,
  POSTER, BACKDROP, POSTER_LG, getEmbedUrl, EMBED_SOURCES
} from './utils/tmdb.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = {
  Play: ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>,
  Plus: () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Check: () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth={2.5}><polyline points="20,6 9,17 4,12"/></svg>,
  Search: () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  X: ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ChevL: () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="15,18 9,12 15,6"/></svg>,
  ChevR: () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="9,18 15,12 9,6"/></svg>,
  Star: () => <svg width={12} height={12} viewBox="0 0 24 24" fill="#f5c518"><polygon points="12,2 15,8 22,9 17,14 18,21 12,18 6,21 7,14 2,9 9,8"/></svg>,
  Film: () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
  Tv: () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17,2 12,7 7,2"/></svg>,
  Home: () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  Heart: ({ f }) => <svg width={20} height={20} viewBox="0 0 24 24" fill={f ? '#e50914' : 'none'} stroke={f ? '#e50914' : 'currentColor'} strokeWidth={2}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Info: () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Server: () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  Globe: () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Download: () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  History: () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/><polyline points="12,7 12,12 16,14"/></svg>,
  Expand: () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15,3 21,3 21,9"/><polyline points="9,21 3,21 3,15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
  Reload: () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const mediaType = (item) => item.media_type || (item.first_air_date ? 'tv' : 'movie');
const title = (item) => item.title || item.name || '';
const year = (item) => (item.release_date || item.first_air_date || '').slice(0, 4);
const rating = (item) => item.vote_average?.toFixed(1) || '–';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 240, r = 10 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#1a1a2e 25%,#252540 50%,#1a1a2e 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: 'rgba(18,18,28,0.98)', border: '1px solid rgba(229,9,20,0.4)', color: '#fff', padding: '11px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, animation: 'toastIn .3s ease', boxShadow: '0 4px 30px rgba(0,0,0,0.6)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#e50914' }}>●</span>{msg}
    </div>
  );
}

// ─── Video Player Modal ────────────────────────────────────────────────────────
function PlayerModal({ item, onClose }) {
  const type = mediaType(item);
  const [server, setServer] = useState(0);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [loadingEps, setLoadingEps] = useState(false);
  const iframeRef = useRef(null);

  const totalServers = type === 'movie' ? EMBED_SOURCES.movie.length : EMBED_SOURCES.tv.length;
  const embedUrl = getEmbedUrl(type, item.id, season, episode, server);

  // Load seasons & episodes for TV
  useEffect(() => {
    if (type !== 'tv') return;
    const s = item.number_of_seasons || item.seasons?.length || 1;
    setSeasons(Array.from({ length: s }, (_, i) => i + 1));
  }, [item, type]);

  useEffect(() => {
    if (type !== 'tv' || !seasons.length) return;
    setLoadingEps(true);
    getSeasonDetails(item.id, season).then(data => {
      const eps = data?.episodes || Array.from({ length: 10 }, (_, i) => ({ episode_number: i + 1, name: `Episode ${i + 1}` }));
      setEpisodes(eps);
      setEpisode(1);
      setLoadingEps(false);
    });
  }, [item.id, season, type]);

  const toggleFS = () => {
    if (!document.fullscreenElement) iframeRef.current?.parentElement?.requestFullscreen?.();
    else document.exitFullscreen?.();
    setFullscreen(f => !f);
  };

  const serverNames = ['VidSrc', 'VidSrc2', '2Embed', '2Embed Alt', 'AutoEmbed', 'VidLink', 'EmbedSu'];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button onClick={onClose} style={btnStyle('#1a1a2e')}><I.ChevL /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title(item)}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
            {type === 'tv' ? `Season ${season} · Ep ${episode}` : year(item)} · {rating(item)} ⭐
          </div>
        </div>
        <button onClick={toggleFS} style={btnStyle('#1a1a2e')} title="Fullscreen"><I.Expand /></button>
        <button onClick={onClose} style={btnStyle('#1a1a2e')}><I.X /></button>
      </div>

      {/* iframe player */}
      <div ref={iframeRef} style={{ flex: 1, background: '#000', position: 'relative' }}>
        <iframe
          key={embedUrl}
          src={embedUrl}
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          title={`${title(item)} player`}
        />
      </div>

      {/* Controls */}
      <div style={{ background: '#0a0a0f', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        {/* Server selector */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <I.Server /> Source / Server {server + 1} of {totalServers}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Array.from({ length: totalServers }, (_, i) => (
              <button key={i} onClick={() => setServer(i)}
                style={{ ...btnStyle(server === i ? '#e50914' : 'rgba(255,255,255,0.06)'), border: `1px solid ${server === i ? '#e50914' : 'rgba(255,255,255,0.1)'}`, fontSize: 12, padding: '5px 11px' }}>
                {serverNames[i] || `Server ${i + 1}`}
              </button>
            ))}
            <button onClick={() => setServer((server + 1) % totalServers)}
              style={{ ...btnStyle('rgba(229,9,20,0.15)'), border: '1px solid rgba(229,9,20,0.3)', fontSize: 12, padding: '5px 11px', color: '#e50914' }}>
              <I.Reload /> Try Next
            </button>
          </div>
        </div>

        {/* Season / Episode selector for TV */}
        {type === 'tv' && (
          <div style={{ padding: '10px 16px', display: 'flex', gap: 20, overflowX: 'auto' }}>
            <div style={{ flexShrink: 0 }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Season</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {seasons.map(s => (
                  <button key={s} onClick={() => setSeason(s)}
                    style={{ ...btnStyle(season === s ? '#e50914' : 'rgba(255,255,255,0.06)'), border: `1px solid ${season === s ? '#e50914' : 'rgba(255,255,255,0.1)'}`, fontSize: 13, padding: '5px 12px', minWidth: 40, fontWeight: 700 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flexShrink: 0, maxWidth: '60vw' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Episode</div>
              {loadingEps ? <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Loading…</div> :
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', maxWidth: '100%' }}>
                  {episodes.map(ep => (
                    <button key={ep.episode_number} onClick={() => setEpisode(ep.episode_number)}
                      title={ep.name}
                      style={{ ...btnStyle(episode === ep.episode_number ? '#e50914' : 'rgba(255,255,255,0.06)'), border: `1px solid ${episode === ep.episode_number ? '#e50914' : 'rgba(255,255,255,0.1)'}`, fontSize: 12, padding: '5px 11px', flexShrink: 0, fontWeight: 700 }}>
                      {ep.episode_number}
                    </button>
                  ))}
                </div>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ item, onClose, onPlay, onToggleFav, isFav }) {
  const type = mediaType(item);
  const [details, setDetails] = useState(null);
  const [tab, setTab] = useState('info');

  useEffect(() => {
    const fn = type === 'tv' ? getShowDetails : getMovieDetails;
    fn(item.id).then(setDetails);
  }, [item.id, type]);

  const d = details || item;
  const cast = d.credits?.cast?.slice(0, 8) || [];
  const trailer = d.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const similar = (d.similar?.results || d.recommendations?.results || []).slice(0, 8);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1500, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxHeight: '92vh', background: '#111118', borderRadius: '20px 20px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'slideUp .35s cubic-bezier(.16,1,.3,1)' }}>
        {/* Backdrop */}
        <div style={{ position: 'relative', flexShrink: 0, height: 220 }}>
          <img src={BACKDROP(d.backdrop_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #111118, rgba(0,0,0,0.3))' }} />
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, ...btnStyle('rgba(0,0,0,0.6)'), backdropFilter: 'blur(8px)' }}><I.X /></button>
          {/* Play button overlay */}
          <button onClick={() => { onClose(); onPlay(item); }}
            style={{ position: 'absolute', bottom: 16, left: 16, background: '#e50914', border: 'none', color: '#fff', borderRadius: 10, padding: '10px 22px', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(229,9,20,0.5)' }}>
            <I.Play s={16} /> Watch Now
          </button>
          <button onClick={() => onToggleFav(item)}
            style={{ position: 'absolute', bottom: 16, right: 16, ...btnStyle('rgba(0,0,0,0.6)'), backdropFilter: 'blur(8px)', padding: '10px 16px' }}>
            {isFav ? <I.Check /> : <I.Plus />}
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 16px 32px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>{title(d)}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><I.Star /><b style={{ color: '#f5c518' }}>{rating(d)}</b></span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{year(d)}</span>
            {d.runtime && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{Math.floor(d.runtime / 60)}h {d.runtime % 60}m</span>}
            {d.number_of_seasons && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{d.number_of_seasons} Season{d.number_of_seasons > 1 ? 's' : ''}</span>}
            <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 10, padding: '2px 7px', borderRadius: 4 }}>HD</span>
          </div>

          {/* Genres */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {(d.genres || []).map(g => (
              <span key={g.id} style={{ background: 'rgba(229,9,20,0.12)', border: '1px solid rgba(229,9,20,0.25)', color: '#e5a0a0', fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600 }}>{g.name}</span>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 }}>
            {['info', 'cast', 'similar'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ background: 'none', border: 'none', color: tab === t ? '#e50914' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 700, padding: '8px 16px', cursor: 'pointer', borderBottom: tab === t ? '2px solid #e50914' : '2px solid transparent', textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'info' && (
            <>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 1.65, marginBottom: 14 }}>{d.overview}</p>
              {trailer && (
                <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#e50914', fontSize: 13, fontWeight: 700, textDecoration: 'none', background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)', padding: '7px 14px', borderRadius: 8 }}>
                  ▶ Watch Trailer
                </a>
              )}
            </>
          )}

          {tab === 'cast' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 12 }}>
              {cast.map(c => (
                <div key={c.id} style={{ textAlign: 'center' }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: '#1a1a2e', margin: '0 auto 6px' }}>
                    {c.profile_path ? <img src={`https://image.tmdb.org/t/p/w92${c.profile_path}`} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👤</div>}
                  </div>
                  <div style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1.2 }}>{c.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, lineHeight: 1.2 }}>{c.character}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'similar' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
              {similar.map(s => (
                <div key={s.id} style={{ cursor: 'pointer' }} onClick={() => { onClose(); setTimeout(() => onPlay(s), 100); }}>
                  <div style={{ aspectRatio: '2/3', borderRadius: 8, overflow: 'hidden', background: '#1a1a2e', marginBottom: 5 }}>
                    <img src={POSTER(s.poster_path)} alt={title(s)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title(s)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Movie Card ───────────────────────────────────────────────────────────────
function Card({ item, onPlay, onDetail, onToggleFav, isFav }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: 140, cursor: 'pointer' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '2/3', background: '#1a1a2e', position: 'relative', transition: 'transform .3s, box-shadow .3s', transform: hov ? 'scale(1.05) translateY(-4px)' : 'scale(1)', boxShadow: hov ? '0 20px 40px rgba(0,0,0,0.8)' : '0 4px 12px rgba(0,0,0,0.4)' }}>
        <img src={POSTER(item.poster_path)} alt={title(item)} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
        <div style={{ display: 'none', position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, padding: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 32 }}>🎬</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{title(item)}</div>
        </div>
        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)', opacity: hov ? 1 : 0, transition: 'opacity .25s', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 8 }}>
          <button onClick={() => onPlay(item)} style={{ background: '#e50914', border: 'none', color: '#fff', borderRadius: 7, padding: '6px 0', cursor: 'pointer', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 5 }}>
            <I.Play s={12} /> Play
          </button>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => onDetail(item)} style={{ flex: 1, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: 6, padding: '5px 0', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}><I.Info /> Info</button>
            <button onClick={() => onToggleFav(item)} style={{ flex: 1, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', borderRadius: 6, padding: '5px 0', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              {isFav ? <I.Check /> : <I.Plus />}
            </button>
          </div>
        </div>
        {/* Quality badge */}
        <div style={{ position: 'absolute', top: 5, left: 5, background: '#e50914', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 3, letterSpacing: .5 }}>HD</div>
        {isFav && <div style={{ position: 'absolute', top: 5, right: 5 }}><I.Check /></div>}
      </div>
      <div style={{ padding: '7px 2px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title(item)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
          <I.Star /><span style={{ color: '#f5c518', fontSize: 11, fontWeight: 700 }}>{rating(item)}</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{year(item)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Horizontal Row ───────────────────────────────────────────────────────────
function Row({ label, items, loading, onPlay, onDetail, onToggleFav, favorites }) {
  const ref = useRef(null);
  const scroll = d => ref.current?.scrollBy({ left: d * 320, behavior: 'smooth' });
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 1.5, color: '#fff', margin: 0 }}>{label}</h2>
        <div style={{ display: 'flex', gap: 5 }}>
          {[<I.ChevL />, <I.ChevR />].map((ic, i) => (
            <button key={i} onClick={() => scroll(i === 0 ? -1 : 1)} style={{ ...btnStyle('rgba(255,255,255,0.07)'), border: '1px solid rgba(255,255,255,0.1)', width: 30, height: 30, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ic}</button>
          ))}
        </div>
      </div>
      <div ref={ref} style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none' }}>
        {loading
          ? Array(8).fill(0).map((_, i) => <div key={i} style={{ flexShrink: 0, width: 140 }}><Skeleton h={210} /><Skeleton h={14} w="80%" r={4} /></div>)
          : (items || []).map(it => <Card key={it.id} item={it} onPlay={onPlay} onDetail={onDetail} onToggleFav={onToggleFav} isFav={favorites.some(f => f.id === it.id)} />)
        }
      </div>
    </div>
  );
}

// ─── Search Results ───────────────────────────────────────────────────────────
function SearchResults({ results, loading, query, onPlay, onDetail, onToggleFav, favorites }) {
  if (!query) return null;
  return (
    <div style={{ padding: '0 5% 60px' }}>
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 1.5, marginBottom: 20 }}>
        {loading ? 'Searching…' : `Results for "${query}" · ${results.length} found`}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
        {loading
          ? Array(12).fill(0).map((_, i) => <Skeleton key={i} h={200} />)
          : results.filter(r => r.poster_path && (r.media_type === 'movie' || r.media_type === 'tv')).map(r =>
            <Card key={r.id} item={r} onPlay={onPlay} onDetail={onDetail} onToggleFav={onToggleFav} isFav={favorites.some(f => f.id === r.id)} />
          )
        }
        {!loading && results.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p>No results found for "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hero Banner ──────────────────────────────────────────────────────────────
function Hero({ item, onPlay, onDetail, onToggleFav, isFav }) {
  if (!item) return <div style={{ height: '85vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;
  const t = mediaType(item);
  return (
    <div style={{ position: 'relative', height: '85vh', overflow: 'hidden' }}>
      <img src={BACKDROP(item.backdrop_path)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.1) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0f 0%, transparent 40%)' }} />

      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 5% 80px', maxWidth: 700, animation: 'heroIn .8s ease' }}>
        <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ background: '#e50914', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 4, letterSpacing: 1 }}>🔥 TRENDING</span>
          <span style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 10, padding: '3px 9px', borderRadius: 4 }}>FHD 1080p</span>
          <span style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 10, padding: '3px 9px', borderRadius: 4 }}>{t === 'tv' ? '📺 TV Show' : '🎬 Movie'}</span>
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(42px, 6vw, 72px)', margin: '0 0 10px', lineHeight: 1, letterSpacing: 2 }}>{title(item)}</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><I.Star /><b style={{ color: '#f5c518', fontSize: 15 }}>{rating(item)}</b><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>/10</span></span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{year(item)}</span>
          {(item.genres || item.genre_ids || []).slice(0, 3).map((g, i) => <span key={i} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{g.name || g}</span>)}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14, lineHeight: 1.65, maxWidth: 520, marginBottom: 24, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.overview}</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => onPlay(item)} style={{ background: '#e50914', border: 'none', color: '#fff', padding: '13px 30px', borderRadius: 10, fontSize: 15, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 4px 20px rgba(229,9,20,0.5)', transition: 'transform .15s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <I.Play s={18} /> Watch Now
          </button>
          <button onClick={() => onDetail(item)} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '13px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
            <I.Info /> More Info
          </button>
          <button onClick={() => onToggleFav(item)} style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '13px 18px', borderRadius: 10, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700 }}>
            {isFav ? <I.Check /> : <I.Plus />}{isFav ? 'Saved' : 'My List'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Genre Grid ───────────────────────────────────────────────────────────────
function GenreGrid({ genres, activeId, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
      <button onClick={() => onSelect(null)} style={{ ...chipStyle(!activeId), transition: 'all .2s' }}>All</button>
      {genres.map(g => <button key={g.id} onClick={() => onSelect(g.id)} style={{ ...chipStyle(activeId === g.id), transition: 'all .2s' }}>{g.name}</button>)}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const btnStyle = (bg) => ({ background: bg, border: 'none', color: '#fff', padding: '7px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 });
const chipStyle = (active) => ({ background: active ? '#e50914' : 'rgba(255,255,255,0.06)', border: `1px solid ${active ? '#e50914' : 'rgba(255,255,255,0.12)'}`, color: active ? '#fff' : 'rgba(255,255,255,0.65)', padding: '6px 15px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 700 });

// ─── PWA Install Banner ───────────────────────────────────────────────────────
function InstallBanner({ prompt, onDismiss }) {
  if (!prompt) return null;
  return (
    <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 900, background: '#111118', border: '1px solid rgba(229,9,20,0.4)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 8px 40px rgba(0,0,0,0.6)', maxWidth: 360, width: '90vw', animation: 'toastIn .4s ease' }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e50914', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>▶</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>Install OnStream</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Add to home screen for the best experience</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={onDismiss} style={{ ...btnStyle('rgba(255,255,255,0.08)'), fontSize: 12, padding: '6px 10px' }}>Later</button>
        <button onClick={() => { prompt.prompt(); onDismiss(); }} style={{ ...btnStyle('#e50914'), fontSize: 12, padding: '6px 12px', fontWeight: 800 }}>Install</button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('home');
  const [playing, setPlaying] = useState(null);
  const [detail, setDetail] = useState(null);
  const [favorites, setFavorites] = useLocalStorage('onstream_favs', []);
  const [history, setHistory] = useLocalStorage('onstream_history', []);
  const [toast, setToast] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const searchRef = useRef(null);

  // Data state
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [popularShows, setPopularShows] = useState([]);
  const [topShows, setTopShows] = useState([]);
  const [airing, setAiring] = useState([]);
  const [movieGenres, setMovieGenres] = useState([]);
  const [tvGenres, setTvGenres] = useState([]);
  const [genreMovies, setGenreMovies] = useState([]);
  const [genreShows, setGenreShows] = useState([]);
  const [activeMovieGenre, setActiveMovieGenre] = useState(null);
  const [activeTvGenre, setActiveTvGenre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // PWA Install prompt
  useEffect(() => {
    const handler = e => { e.preventDefault(); setInstallPrompt(e); setTimeout(() => setShowInstall(true), 3000); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Load home data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getTrending('all', 'week'),
      getPopularMovies(),
      getTopRatedMovies(),
      getNowPlaying(),
      getPopularShows(),
      getTopRatedShows(),
      getAiringToday(),
      getMovieGenres(),
      getTVGenres(),
    ]).then(([tr, pop, top, np, ps, ts, at, mg, tg]) => {
      setTrending(tr?.results || []);
      setPopular(pop?.results || []);
      setTopRated(top?.results || []);
      setNowPlaying(np?.results || []);
      setPopularShows(ps?.results || []);
      setTopShows(ts?.results || []);
      setAiring(at?.results || []);
      setMovieGenres(mg?.genres || []);
      setTvGenres(tg?.genres || []);
      setLoading(false);
    });
  }, []);

  // Genre-based fetch for movies tab
  useEffect(() => {
    if (tab !== 'movies') return;
    setLoading(true);
    const fn = activeMovieGenre ? () => getMoviesByGenre(activeMovieGenre, page) : () => getPopularMovies(page);
    fn().then(d => { setGenreMovies(d?.results || []); setTotalPages(d?.total_pages || 1); setLoading(false); });
  }, [tab, activeMovieGenre, page]);

  // Genre-based fetch for shows tab
  useEffect(() => {
    if (tab !== 'shows') return;
    setLoading(true);
    const fn = activeTvGenre ? () => getShowsByGenre(activeTvGenre, page) : () => getPopularShows(page);
    fn().then(d => { setGenreShows(d?.results || []); setTotalPages(d?.total_pages || 1); setLoading(false); });
  }, [tab, activeTvGenre, page]);

  // Search with debounce
  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    const t = setTimeout(() => {
      searchMulti(searchQ).then(d => { setSearchResults(d?.results || []); setSearchLoading(false); });
    }, 400);
    return () => clearTimeout(t);
  }, [searchQ]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handlePlay = useCallback((item) => {
    setPlaying(item);
    setHistory(h => { const next = [item, ...h.filter(x => x.id !== item.id)].slice(0, 30); return next; });
  }, [setHistory]);

  const toggleFav = useCallback((item) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === item.id);
      showToast(exists ? `Removed "${title(item)}"` : `Added "${title(item)}" to My List`);
      return exists ? prev.filter(f => f.id !== item.id) : [item, ...prev];
    });
  }, [setFavorites]);

  const hero = trending[0];
  const isSearching = searchQ.length > 0;
  const showBottomNav = !playing;

  const navItems = [
    { id: 'home', label: 'Home', icon: <I.Home /> },
    { id: 'movies', label: 'Movies', icon: <I.Film /> },
    { id: 'shows', label: 'Shows', icon: <I.Tv /> },
    { id: 'mylist', label: 'My List', icon: <I.Heart f={false} /> },
    { id: 'history', label: 'History', icon: <I.History /> },
  ];

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#fff', fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes heroIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:none} }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .spinner { width:40px;height:40px;border:3px solid rgba(229,9,20,0.2);border-top-color:#e50914;border-radius:50%;animation:spin 0.8s linear infinite; }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
        button { -webkit-tap-highlight-color: transparent; }
        @media (max-width: 600px) {
          .desktop-nav { display: none !important; }
        }
        @media (min-width: 601px) {
          .mobile-bottom-nav { display: none !important; }
        }
      `}</style>

      {/* ── Player Modal ── */}
      {playing && <PlayerModal item={playing} onClose={() => setPlaying(null)} />}

      {/* ── Detail Modal ── */}
      {detail && !playing && (
        <DetailModal item={detail} onClose={() => setDetail(null)} onPlay={handlePlay} onToggleFav={toggleFav} isFav={favorites.some(f => f.id === detail.id)} />
      )}

      {/* ── Toast ── */}
      <Toast msg={toast} />

      {/* ── PWA Install Banner ── */}
      {showInstall && <InstallBanner prompt={installPrompt} onDismiss={() => setShowInstall(false)} />}

      {/* ── Top Navbar (desktop) ── */}
      <nav className="desktop-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500, background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', height: 60, display: 'flex', alignItems: 'center', padding: '0 5%', gap: 24, justifyContent: 'space-between' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, background: '#e50914', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(229,9,20,0.5)' }}>
            <I.Play s={14} />
          </div>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 3 }}>ON<span style={{ color: '#e50914' }}>STREAM</span></span>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', gap: 2 }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => { setTab(n.id); setSearchQ(''); }}
              style={{ background: tab === n.id ? 'rgba(229,9,20,0.12)' : 'none', border: 'none', color: tab === n.id ? '#e50914' : 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s' }}>
              {n.icon} {n.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '7px 12px', gap: 8, width: 220, transition: 'all .2s' }}>
            <I.Search />
            <input ref={searchRef} value={searchQ} onChange={e => { setSearchQ(e.target.value); if (!isSearching) setTab('search'); }}
              onFocus={() => setTab('search')}
              placeholder="Search movies, shows…"
              style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: 13, width: '100%' }} />
            {searchQ && <button onClick={() => { setSearchQ(''); setTab('home'); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, display: 'flex' }}><I.X s={16} /></button>}
          </div>
        </div>

        <div style={{ background: 'rgba(229,9,20,0.12)', border: '1px solid rgba(229,9,20,0.3)', color: '#e50914', fontSize: 11, fontWeight: 800, padding: '5px 11px', borderRadius: 20, letterSpacing: .5, flexShrink: 0 }}>FREE · NO LOGIN</div>
      </nav>

      {/* ── Mobile Top Bar ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500, background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', height: 56, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3 }}>ON<span style={{ color: '#e50914' }}>STREAM</span></span>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', gap: 7 }}>
          <I.Search />
          <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setTab('search'); }}
            onFocus={() => setTab('search')}
            placeholder="Search…"
            style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: 13, width: '100%' }} />
          {searchQ && <button onClick={() => { setSearchQ(''); setTab('home'); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, display: 'flex' }}><I.X s={15} /></button>}
        </div>
      </div>

      {/* ── Main Content ── */}
      <main style={{ paddingTop: 56, paddingBottom: playing ? 0 : 70 }}>

        {/* ── SEARCH TAB ── */}
        {tab === 'search' && (
          <div style={{ padding: '20px 5% 0' }}>
            <SearchResults results={searchResults} loading={searchLoading} query={searchQ} onPlay={handlePlay} onDetail={setDetail} onToggleFav={toggleFav} favorites={favorites} />
            {!searchQ && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🔍</div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Search across millions of movies and TV shows</p>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, marginTop: 6 }}>Powered by TMDB</p>
              </div>
            )}
          </div>
        )}

        {/* ── HOME TAB ── */}
        {tab === 'home' && !isSearching && (
          <>
            <Hero item={hero} onPlay={handlePlay} onDetail={setDetail} onToggleFav={toggleFav} isFav={favorites.some(f => f.id === hero?.id)} />
            <div style={{ padding: '0 5% 60px', marginTop: -70, position: 'relative', zIndex: 5 }}>
              {/* Feature Pills */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
                {[['🆓', 'Free', 'No subscription'], ['🔐', 'No Login', 'Start instantly'], ['📺', 'HD/FHD', 'Up to 1080p'], ['🌍', 'Subtitles', 'Multi-language'], ['🖥️', 'Multi-server', '7 sources'], ['⚡', 'Auto-play', 'Instant stream']].map(([e, l, d]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px', flex: '1 1 130px' }}>
                    <span style={{ fontSize: 18 }}>{e}</span>
                    <div><div style={{ fontWeight: 800, fontSize: 12, color: '#fff' }}>{l}</div><div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{d}</div></div>
                  </div>
                ))}
              </div>
              <Row label="🔥 Trending This Week" items={trending} loading={loading} onPlay={handlePlay} onDetail={setDetail} onToggleFav={toggleFav} favorites={favorites} />
              <Row label="🎬 Popular Movies" items={popular} loading={loading} onPlay={handlePlay} onDetail={setDetail} onToggleFav={toggleFav} favorites={favorites} />
              <Row label="📺 Popular TV Shows" items={popularShows} loading={loading} onPlay={handlePlay} onDetail={setDetail} onToggleFav={toggleFav} favorites={favorites} />
              <Row label="⭐ Top Rated Movies" items={topRated} loading={loading} onPlay={handlePlay} onDetail={setDetail} onToggleFav={toggleFav} favorites={favorites} />
              <Row label="🏆 Top Rated Shows" items={topShows} loading={loading} onPlay={handlePlay} onDetail={setDetail} onToggleFav={toggleFav} favorites={favorites} />
              <Row label="🎞️ Now Playing in Theaters" items={nowPlaying} loading={loading} onPlay={handlePlay} onDetail={setDetail} onToggleFav={toggleFav} favorites={favorites} />
              <Row label="📡 Airing Today" items={airing} loading={loading} onPlay={handlePlay} onDetail={setDetail} onToggleFav={toggleFav} favorites={favorites} />
              {history.length > 0 && <Row label="🕐 Continue Watching" items={history} loading={false} onPlay={handlePlay} onDetail={setDetail} onToggleFav={toggleFav} favorites={favorites} />}
            </div>
          </>
        )}

        {/* ── MOVIES TAB ── */}
        {tab === 'movies' && (
          <div style={{ padding: '28px 5% 60px' }}>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, letterSpacing: 2, marginBottom: 6 }}><span style={{ color: '#e50914' }}>FREE</span> MOVIES</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20 }}>{genreMovies.length > 0 ? `${genreMovies.length} movies loaded · Page ${page} of ${Math.min(totalPages, 50)}` : 'Browse thousands of free movies'}</p>
            <GenreGrid genres={movieGenres} activeId={activeMovieGenre} onSelect={(id) => { setActiveMovieGenre(id); setPage(1); }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16, marginBottom: 28 }}>
              {loading ? Array(20).fill(0).map((_, i) => <Skeleton key={i} h={200} />) :
                genreMovies.filter(m => m.poster_path).map(m => <Card key={m.id} item={m} onPlay={handlePlay} onDetail={setDetail} onToggleFav={toggleFav} isFav={favorites.some(f => f.id === m.id)} />)
              }
            </div>
            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ ...btnStyle('rgba(255,255,255,0.07)'), border: '1px solid rgba(255,255,255,0.1)', opacity: page === 1 ? 0.4 : 1 }}><I.ChevL /> Prev</button>
              <span style={{ padding: '7px 16px', background: '#e50914', borderRadius: 8, fontWeight: 800, fontSize: 14 }}>Page {page}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ ...btnStyle('rgba(255,255,255,0.07)'), border: '1px solid rgba(255,255,255,0.1)' }}>Next <I.ChevR /></button>
            </div>
          </div>
        )}

        {/* ── SHOWS TAB ── */}
        {tab === 'shows' && (
          <div style={{ padding: '28px 5% 60px' }}>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, letterSpacing: 2, marginBottom: 6 }}><span style={{ color: '#e50914' }}>FREE</span> TV SHOWS</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20 }}>Browse thousands of free TV shows</p>
            <GenreGrid genres={tvGenres} activeId={activeTvGenre} onSelect={(id) => { setActiveTvGenre(id); setPage(1); }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16, marginBottom: 28 }}>
              {loading ? Array(20).fill(0).map((_, i) => <Skeleton key={i} h={200} />) :
                genreShows.filter(s => s.poster_path).map(s => <Card key={s.id} item={s} onPlay={handlePlay} onDetail={setDetail} onToggleFav={toggleFav} isFav={favorites.some(f => f.id === s.id)} />)
              }
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ ...btnStyle('rgba(255,255,255,0.07)'), border: '1px solid rgba(255,255,255,0.1)', opacity: page === 1 ? 0.4 : 1 }}><I.ChevL /> Prev</button>
              <span style={{ padding: '7px 16px', background: '#e50914', borderRadius: 8, fontWeight: 800, fontSize: 14 }}>Page {page}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ ...btnStyle('rgba(255,255,255,0.07)'), border: '1px solid rgba(255,255,255,0.1)' }}>Next <I.ChevR /></button>
            </div>
          </div>
        )}

        {/* ── MY LIST TAB ── */}
        {tab === 'mylist' && (
          <div style={{ padding: '28px 5% 60px' }}>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, letterSpacing: 2, marginBottom: 6 }}>MY <span style={{ color: '#e50914' }}>LIST</span></h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>{favorites.length} saved titles</p>
            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: 56, marginBottom: 12 }}>🎬</div>
                <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Your list is empty</h3>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, marginBottom: 20 }}>Tap + on any movie or show to save it here</p>
                <button onClick={() => setTab('home')} style={{ background: '#e50914', border: 'none', color: '#fff', padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Browse Content</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
                {favorites.map(m => <Card key={m.id} item={m} onPlay={handlePlay} onDetail={setDetail} onToggleFav={toggleFav} isFav={true} />)}
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div style={{ padding: '28px 5% 60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, letterSpacing: 2 }}>WATCH <span style={{ color: '#e50914' }}>HISTORY</span></h1>
              {history.length > 0 && <button onClick={() => setHistory([])} style={{ ...btnStyle('rgba(255,0,0,0.1)'), border: '1px solid rgba(255,0,0,0.2)', color: '#e57a7a', fontSize: 12 }}>Clear All</button>}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>{history.length} titles watched</p>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🕐</div>
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nothing watched yet</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
                {history.map(m => <Card key={m.id} item={m} onPlay={handlePlay} onDetail={setDetail} onToggleFav={toggleFav} isFav={favorites.some(f => f.id === m.id)} />)}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Bottom Navigation (Mobile) ── */}
      {showBottomNav && (
        <nav className="mobile-bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 500, background: 'rgba(10,10,15,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', padding: '8px 0 env(safe-area-inset-bottom)', height: 70 }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => { setTab(n.id); if (n.id !== 'search') setSearchQ(''); }}
              style={{ flex: 1, background: 'none', border: 'none', color: tab === n.id ? '#e50914' : 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 0', transition: 'color .2s' }}>
              {n.icon}
              <span style={{ fontSize: 10, fontWeight: tab === n.id ? 800 : 500 }}>{n.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
