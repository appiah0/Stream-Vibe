import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  trending, popularMovies, topMovies, nowPlaying, popularShows, topShows,
  airingToday, moviesByGenre, showsByGenre, movieGenres, tvGenres,
  movieDetail, showDetail, seasonDetail, search,
  SERVERS, DOWNLOAD_SOURCES,
  IMG, getTitle, getYear, getRating, getType,
} from './utils/tmdb.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';

// ─── CSS-in-JS base styles injected once ─────────────────────────────────────
const GLOBAL_CSS = `
  @keyframes fadeUp   { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
  @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
  @keyframes slideUp  { from { transform:translateY(100%) } to { transform:none } }
  @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes spin     { to { transform:rotate(360deg) } }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes toastPop { 0%{opacity:0;transform:translateX(-50%) scale(.9)} 100%{opacity:1;transform:translateX(-50%) scale(1)} }
  @keyframes ripple   { to { transform:scale(4); opacity:0 } }

  .shimmer {
    background: linear-gradient(90deg,#1c1c1c 25%,#2a2a2a 50%,#1c1c1c 75%);
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
    border-radius: 8px;
  }
  .fade-up  { animation: fadeUp .5s ease both; }
  .fade-in  { animation: fadeIn .3s ease both; }

  .card-wrap { cursor:pointer; transition: transform .25s cubic-bezier(.34,1.56,.64,1); }
  .card-wrap:hover { transform: scale(1.05) translateY(-4px); }
  .card-wrap:active { transform: scale(.97); }

  .btn-press:active { transform: scale(.95); }

  /* Hide scrollbar but keep scroll */
  .scroll-x { overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none; }
  .scroll-x::-webkit-scrollbar { display:none; }

  /* Bottom nav safe area */
  .bottom-nav { padding-bottom: max(12px, env(safe-area-inset-bottom)); }

  /* Iframe fills container */
  .player-frame { width:100%; height:100%; border:none; display:block; background:#000; }

  /* Fullscreen player on mobile */
  .player-container { width:100%; aspect-ratio:16/9; background:#000; position:relative; }
  @media (orientation:landscape) and (max-width:900px) {
    .player-container { aspect-ratio:unset; height:100dvh; }
  }

  .no-api-banner {
    background: linear-gradient(135deg, #1a0a0a, #0d0d0d);
    border: 1px solid rgba(229,9,20,.3);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    margin: 20px;
  }

  input[type=range] { accent-color: #e50914; }

  /* Smooth page transitions */
  .page { animation: fadeUp .4s ease both; }

  .genre-chip {
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid;
    transition: all .2s;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .dl-btn {
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.12);
    color: #fff;
    border-radius: 8px;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    font-family: 'DM Sans', sans-serif;
    transition: background .2s;
    text-decoration: none;
  }
  .dl-btn:hover { background: rgba(229,9,20,.15); border-color: rgba(229,9,20,.4); }

  .server-btn {
    border-radius: 7px;
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.7);
    transition: all .2s;
    font-family: 'DM Sans', sans-serif;
    white-space: nowrap;
  }
  .server-btn.active  { background: #e50914; border-color: #e50914; color: #fff; }
  .server-btn:hover   { background: rgba(229,9,20,.2); border-color: rgba(229,9,20,.5); color: #fff; }

  .ep-btn {
    min-width: 40px;
    padding: 6px 10px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.7);
    transition: all .15s;
    font-family: 'DM Sans', sans-serif;
    text-align: center;
  }
  .ep-btn.active  { background: #e50914; border-color: #e50914; color: #fff; }
  .ep-btn:hover   { border-color: rgba(229,9,20,.5); }
`;

function injectGlobalCSS() {
  if (document.getElementById('onstream-global')) return;
  const s = document.createElement('style');
  s.id = 'onstream-global';
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Play:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>,
  Plus:     () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Check:    () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>,
  Search:   () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  X:        ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Home:     () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  Film:     () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
  Tv:       () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17,2 12,7 7,2"/></svg>,
  Heart:    ({ f }) => <svg width="22" height="22" viewBox="0 0 24 24" fill={f ? '#e50914' : 'none'} stroke={f ? '#e50914' : 'currentColor'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Download: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Star:     () => <svg width="11" height="11" viewBox="0 0 24 24" fill="#f5c518"><polygon points="12,2 15,8 22,9 17,14 18,21 12,18 6,21 7,14 2,9 9,8"/></svg>,
  ChevL:    () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>,
  ChevR:    () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>,
  Info:     () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Server:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/></svg>,
  Wifi:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  WifiOff:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a11 11 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  Back:     () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>,
  Refresh:  () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Fullscreen:() => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,3 21,3 21,9"/><polyline points="9,21 3,21 3,15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const css = (obj) => obj; // identity – used inline
const clamp = (text, n=120) => text?.length > n ? text.slice(0, n) + '…' : text;

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skel = ({ h=200, w='100%', r=8 }) => (
  <div className="shimmer" style={{ height: h, width: w, borderRadius: r }} />
);

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', zIndex: 9999,
      transform: 'translateX(-50%)',
      background: '#1a1a1a', border: '1px solid rgba(229,9,20,.35)',
      color: '#fff', padding: '10px 20px', borderRadius: 10,
      fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
      boxShadow: '0 8px 30px rgba(0,0,0,.7)',
      animation: 'toastPop .3s ease both',
      display: 'flex', alignItems: 'center', gap: 8,
      maxWidth: '90vw', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>
      <span style={{ color: '#e50914', fontSize: 8 }}>●</span>{msg}
    </div>
  );
}

// ─── Offline Banner ───────────────────────────────────────────────────────────
function OfflineBanner({ offline }) {
  if (!offline) return null;
  return (
    <div style={{
      position: 'fixed', top: 56, left: 0, right: 0, zIndex: 800,
      background: 'rgba(229,9,20,.9)', padding: '6px 16px',
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 12, fontWeight: 700, justifyContent: 'center',
    }}>
      <Icon.WifiOff /> You're offline – showing cached content
    </div>
  );
}

// ─── No API Key Warning ───────────────────────────────────────────────────────
function NoApiKey() {
  return (
    <div className="no-api-banner fade-up">
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔑</div>
      <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 1, marginBottom: 8 }}>
        TMDB API Key Required
      </h3>
      <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
        To load real movies and shows, you need a free TMDB API key.
      </p>
      <div style={{ background: 'rgba(0,0,0,.4)', borderRadius: 8, padding: 14, textAlign: 'left', fontSize: 12, color: 'rgba(255,255,255,.7)', lineHeight: 1.8 }}>
        <b style={{ color: '#fff' }}>How to add your API key on Vercel:</b><br/>
        1. Go to <b>themoviedb.org</b> → sign up free<br/>
        2. Settings → API → Create → Developer<br/>
        3. Copy your <b>v3 API Key</b><br/>
        4. In <b>Vercel</b>: Project → Settings → Environment Variables<br/>
        5. Add: <code style={{ color: '#e50914', background: 'rgba(229,9,20,.1)', padding: '1px 5px', borderRadius: 4 }}>VITE_TMDB_KEY</code> = your key<br/>
        6. Redeploy ✅
      </div>
    </div>
  );
}

// ─── Movie Card ───────────────────────────────────────────────────────────────
function Card({ item, onSelect, onToggleFav, isFav }) {
  const [imgErr, setImgErr] = useState(false);
  const poster = IMG.poster(item.poster_path);
  const t = getTitle(item);
  const y = getYear(item);
  const r = getRating(item);

  return (
    <div className="card-wrap" style={{ flexShrink: 0, width: 130 }} onClick={() => onSelect(item)}>
      <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '2/3', background: '#1a1a1a' }}>
        {poster && !imgErr ? (
          <img src={poster} alt={t} loading="lazy" onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8, textAlign: 'center' }}>
            <span style={{ fontSize: 28 }}>🎬</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', lineHeight: 1.3 }}>{t}</span>
          </div>
        )}
        {/* Gradient bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, background: 'linear-gradient(to top, rgba(0,0,0,.9), transparent)' }} />
        {/* HD badge */}
        <div style={{ position: 'absolute', top: 6, left: 6, background: '#e50914', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 3, letterSpacing: .5 }}>HD</div>
        {/* Fav badge */}
        {isFav && (
          <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.6)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.Heart f={true} />
          </div>
        )}
        {/* Play overlay */}
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(229,9,20,.9)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon.Play />
        </div>
      </div>
      <div style={{ padding: '7px 2px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
          <Icon.Star /><span style={{ color: '#f5c518', fontSize: 11, fontWeight: 700 }}>{r}</span>
          <span style={{ color: 'rgba(255,255,255,.35)', fontSize: 11 }}>{y}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Horizontal Row ───────────────────────────────────────────────────────────
function Row({ label, items, loading, onSelect, onToggleFav, favorites }) {
  const ref = useRef(null);
  const scroll = (d) => ref.current?.scrollBy({ left: d * 300, behavior: 'smooth' });
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
        <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 1.2, color: '#fff' }}>{label}</h2>
        <div style={{ display: 'flex', gap: 4 }}>
          {[<Icon.ChevL />, <Icon.ChevR />].map((ic, i) => (
            <button key={i} onClick={() => scroll(i === 0 ? -1 : 1)} style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{ic}</button>
          ))}
        </div>
      </div>
      <div ref={ref} className="scroll-x" style={{ display: 'flex', gap: 12, padding: '0 16px 4px' }}>
        {loading
          ? Array(8).fill(0).map((_, i) => (
              <div key={i} style={{ flexShrink: 0, width: 130 }}>
                <Skel h={195} /><Skel h={12} w="70%" r={4} />
              </div>
            ))
          : (items || []).map(it => (
              <Card key={`${it.id}-${it.media_type}`} item={it} onSelect={onSelect} onToggleFav={onToggleFav}
                isFav={(favorites || []).some(f => f.id === it.id)} />
            ))
        }
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ item, onSelect, onToggleFav, isFav }) {
  if (!item) return <div style={{ height: '60vw', maxHeight: 420, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 36, height: 36, border: '3px solid rgba(229,9,20,.3)', borderTopColor: '#e50914', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /></div>;
  const backdrop = IMG.backdrop(item.backdrop_path);
  return (
    <div style={{ position: 'relative', height: 'clamp(280px, 55vw, 480px)', overflow: 'hidden', flexShrink: 0 }}>
      {backdrop && <img src={backdrop} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0d0d0d 0%, rgba(13,13,13,.7) 40%, rgba(13,13,13,.1) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(13,13,13,.8) 0%, transparent 60%)' }} />
      <div className="fade-up" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 16px 20px', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ background: '#e50914', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, letterSpacing: .8 }}>🔥 TRENDING</span>
          <span style={{ background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(6px)', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 4 }}>HD</span>
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 'clamp(28px,7vw,52px)', letterSpacing: 1.5, lineHeight: 1, marginBottom: 6, textShadow: '0 2px 12px rgba(0,0,0,.8)' }}>{getTitle(item)}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon.Star /><b style={{ color: '#f5c518', fontSize: 13 }}>{getRating(item)}</b></span>
          <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>{getYear(item)}</span>
        </div>
        {item.overview && <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, lineHeight: 1.55, maxWidth: 340, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.overview}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-press" onClick={() => onSelect(item)} style={{ background: '#e50914', border: 'none', color: '#fff', borderRadius: 9, padding: '10px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'DM Sans'", boxShadow: '0 4px 16px rgba(229,9,20,.5)' }}>
            <Icon.Play /> Watch Now
          </button>
          <button className="btn-press" onClick={() => onToggleFav(item)} style={{ background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: 9, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans'" }}>
            {isFav ? <Icon.Check /> : <Icon.Plus />}{isFav ? 'Saved' : 'My List'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── IN-APP PLAYER (iframe, no redirect) ─────────────────────────────────────
function Player({ item, onClose, onToggleFav, isFav }) {
  const type = getType(item);
  const isTV = type === 'tv';
  const [serverIdx, setServerIdx] = useState(0);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEps, setLoadingEps] = useState(false);
  const [details, setDetails] = useState(null);
  const [showDL, setShowDL] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const containerRef = useRef(null);
  const servers = SERVERS[isTV ? 'tv' : 'movie'];
  const dlSources = DOWNLOAD_SOURCES[isTV ? 'tv' : 'movie'];

  // Build embed URL – plays INSIDE the app
  const embedUrl = useMemo(() => {
    if (isTV) return servers[serverIdx].url(item.id, season, episode);
    return servers[serverIdx].url(item.id);
  }, [isTV, serverIdx, season, episode, item.id, servers]);

  // Load show details for seasons count
  useEffect(() => {
    if (!isTV) return;
    showDetail(item.id).then(d => {
      if (!d) return;
      setDetails(d);
      const count = d.number_of_seasons || 1;
      setSeasons(Array.from({ length: count }, (_, i) => i + 1));
    });
  }, [item.id, isTV]);

  // Load episodes when season changes
  useEffect(() => {
    if (!isTV) return;
    setLoadingEps(true);
    seasonDetail(item.id, season).then(d => {
      const eps = d?.episodes?.map(e => ({ num: e.episode_number, name: e.name })) ||
        Array.from({ length: 10 }, (_, i) => ({ num: i + 1, name: `Episode ${i + 1}` }));
      setEpisodes(eps);
      setEpisode(1);
      setLoadingEps(false);
    });
  }, [item.id, season, isTV]);

  const goFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: '#000', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(0,0,0,.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0, zIndex: 10 }}>
        <button className="btn-press" onClick={onClose} style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', display: 'flex' }}>
          <Icon.Back />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getTitle(item)}</div>
          <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 11 }}>
            {isTV ? `S${season} E${episode}` : getYear(item)} · {servers[serverIdx].name.split('·')[0].trim()}
          </div>
        </div>
        <button className="btn-press" onClick={() => onToggleFav(item)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 6, display: 'flex' }}>
          <Icon.Heart f={isFav} />
        </button>
        <button className="btn-press" onClick={() => setShowDL(v => !v)} style={{ background: showDL ? 'rgba(229,9,20,.2)' : 'rgba(255,255,255,.08)', border: `1px solid ${showDL ? 'rgba(229,9,20,.5)' : 'rgba(255,255,255,.1)'}`, color: '#fff', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans'" }}>
          <Icon.Download /> DL
        </button>
      </div>

      {/* ── Video iframe (plays in-app) ── */}
      <div ref={containerRef} className="player-container" style={{ flexShrink: 0, position: 'relative' }}>
        {iframeLoading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#000', zIndex: 5 }}>
            <div style={{ width: 44, height: 44, border: '3px solid rgba(229,9,20,.2)', borderTopColor: '#e50914', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13 }}>Loading {servers[serverIdx].name}…</p>
          </div>
        )}
        <iframe
          key={embedUrl}
          src={embedUrl}
          className="player-frame"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          title={getTitle(item)}
          onLoad={() => setIframeLoading(false)}
          referrerPolicy="no-referrer"
          scrolling="no"
        />
        {/* Fullscreen btn overlay */}
        <button onClick={goFullscreen} style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.5)', border: 'none', color: '#fff', borderRadius: 6, padding: 6, cursor: 'pointer', display: 'flex', zIndex: 6 }}>
          <Icon.Fullscreen />
        </button>
      </div>

      {/* ── Download panel ── */}
      {showDL && (
        <div className="fade-in" style={{ padding: '14px 14px 6px', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
          <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon.Download /> Download Options
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {(isTV ? dlSources.map(s => ({ ...s, fullUrl: s.url(item.id, season, episode) })) : dlSources.map(s => ({ ...s, fullUrl: s.url(item.id) }))).map((src, i) => (
              <a key={i} href={src.fullUrl} target="_blank" rel="noopener noreferrer" className="dl-btn" download>
                <Icon.Download />
                <span style={{ flex: 1 }}>{src.name}</span>
                <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 11 }}>↗ Tap to Download</span>
              </a>
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,.25)', fontSize: 10, marginTop: 8, lineHeight: 1.5 }}>
            Downloads open in your browser's download manager. For best results, long-press the link and select "Download".
          </p>
        </div>
      )}

      {/* ── Server switcher ── */}
      <div style={{ padding: '14px 14px 6px', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon.Server /> Sources — if one fails, try the next
        </div>
        <div className="scroll-x" style={{ display: 'flex', gap: 7, paddingBottom: 4 }}>
          {servers.map((s, i) => (
            <button key={i} className={`server-btn${serverIdx === i ? ' active' : ''}`} onClick={() => { setServerIdx(i); setIframeLoading(true); }}>
              {s.name.split('·')[1]?.trim() || `S${i + 1}`}
            </button>
          ))}
          <button className="server-btn" onClick={() => { setServerIdx((serverIdx + 1) % servers.length); setIframeLoading(true); }} style={{ color: '#e50914', borderColor: 'rgba(229,9,20,.3)' }}>
            <Icon.Refresh /> Next
          </button>
        </div>
      </div>

      {/* ── Season / Episode picker (TV only) ── */}
      {isTV && (
        <div style={{ padding: '14px 14px 6px', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
          {seasons.length > 0 && (
            <>
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Season</div>
              <div className="scroll-x" style={{ display: 'flex', gap: 7, marginBottom: 14, paddingBottom: 4 }}>
                {seasons.map(s => (
                  <button key={s} className={`ep-btn${season === s ? ' active' : ''}`} onClick={() => { setSeason(s); setIframeLoading(true); }}>S{s}</button>
                ))}
              </div>
            </>
          )}
          {loadingEps ? (
            <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 12, animation: 'pulse 1s infinite' }}>Loading episodes…</div>
          ) : (
            <>
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Episode</div>
              <div className="scroll-x" style={{ display: 'flex', gap: 7, paddingBottom: 4 }}>
                {episodes.map(ep => (
                  <button key={ep.num} className={`ep-btn${episode === ep.num ? ' active' : ''}`}
                    title={ep.name} onClick={() => { setEpisode(ep.num); setIframeLoading(true); }}>
                    {ep.num}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Movie info ── */}
      <div style={{ padding: '16px 14px', flexShrink: 0 }}>
        <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 1, marginBottom: 6 }}>{getTitle(item)}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon.Star /><b style={{ color: '#f5c518', fontSize: 13 }}>{getRating(item)}</b></span>
          <span style={{ color: 'rgba(255,255,255,.45)', fontSize: 12 }}>{getYear(item)}</span>
          <span style={{ background: '#e50914', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4 }}>HD</span>
          <span style={{ background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.6)', fontSize: 10, padding: '2px 7px', borderRadius: 4 }}>{isTV ? 'TV Show' : 'Movie'}</span>
        </div>
        {item.overview && <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 13, lineHeight: 1.65 }}>{item.overview}</p>}
      </div>

      {/* ── Tip ── */}
      <div style={{ margin: '0 14px 20px', padding: '10px 14px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10 }}>
        <p style={{ color: 'rgba(255,255,255,.35)', fontSize: 11, lineHeight: 1.6 }}>
          💡 <b style={{ color: 'rgba(255,255,255,.5)' }}>Tip:</b> If video doesn't load, try a different server above. Tap fullscreen for the best experience. Rotate your phone to landscape for widescreen.
        </p>
      </div>
    </div>
  );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, onClear }) {
  return (
    <div style={{ position: 'relative', padding: '8px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '9px 12px', gap: 8 }}>
        <Icon.Search />
        <input
          value={value} onChange={e => onChange(e.target.value)}
          placeholder="Search movies, shows…"
          style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', fontSize: 14, width: '100%', fontFamily: "'DM Sans'" }}
        />
        {value && (
          <button onClick={onClear} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', display: 'flex', padding: 0 }}>
            <Icon.X s={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Genre Chips ──────────────────────────────────────────────────────────────
function GenreChips({ genres, active, onSelect }) {
  return (
    <div className="scroll-x" style={{ display: 'flex', gap: 8, padding: '0 16px 4px' }}>
      <button className="genre-chip" onClick={() => onSelect(null)}
        style={{ background: !active ? '#e50914' : 'rgba(255,255,255,.06)', borderColor: !active ? '#e50914' : 'rgba(255,255,255,.12)', color: '#fff' }}>
        All
      </button>
      {genres.map(g => (
        <button key={g.id} className="genre-chip" onClick={() => onSelect(g.id)}
          style={{ background: active === g.id ? '#e50914' : 'rgba(255,255,255,.06)', borderColor: active === g.id ? '#e50914' : 'rgba(255,255,255,.12)', color: active === g.id ? '#fff' : 'rgba(255,255,255,.7)' }}>
          {g.name}
        </button>
      ))}
    </div>
  );
}

// ─── Grid view ────────────────────────────────────────────────────────────────
function Grid({ items, loading, onSelect, onToggleFav, favorites }) {
  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 14, padding: '0 16px' }}>
      {Array(16).fill(0).map((_, i) => <Skel key={i} h={175} />)}
    </div>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 14, padding: '0 16px' }}>
      {(items || []).filter(it => it.poster_path).map(it => (
        <div key={`${it.id}-${it.media_type}`} className="card-wrap" style={{ cursor: 'pointer' }} onClick={() => onSelect(it)}>
          <div style={{ borderRadius: 9, overflow: 'hidden', aspectRatio: '2/3', background: '#1a1a1a', position: 'relative' }}>
            <img src={IMG.poster(it.poster_path)} alt={getTitle(it)} loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => e.target.style.display = 'none'} />
            <div style={{ position: 'absolute', top: 5, left: 5, background: '#e50914', color: '#fff', fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: 3 }}>HD</div>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.7), transparent)', display: 'flex', alignItems: 'flex-end', padding: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Icon.Star /><span style={{ color: '#f5c518', fontSize: 10, fontWeight: 700 }}>{getRating(it)}</span>
              </div>
            </div>
          </div>
          <div style={{ padding: '5px 0 0', fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getTitle(it)}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)' }}>{getYear(it)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Page: Home ───────────────────────────────────────────────────────────────
function HomePage({ onSelect, onToggleFav, favorites, hasKey }) {
  const [hero, setHero] = useState(null);
  const [rows, setRows] = useState({ trending: [], popular: [], topRated: [], nowPlaying: [], shows: [], topShows: [], airing: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasKey) { setLoading(false); return; }
    Promise.all([
      trending('week'), popularMovies(), topMovies(), nowPlaying(), popularShows(), topShows(), airingToday()
    ]).then(([tr, pop, top, np, ps, ts, at]) => {
      const all = tr?.results || [];
      setHero(all.find(r => r.backdrop_path) || all[0] || null);
      setRows({
        trending: all,
        popular: pop?.results || [],
        topRated: top?.results || [],
        nowPlaying: np?.results || [],
        shows: ps?.results || [],
        topShows: ts?.results || [],
        airing: at?.results || [],
      });
      setLoading(false);
    });
  }, [hasKey]);

  if (!hasKey) return <NoApiKey />;

  return (
    <div className="page">
      <Hero item={hero} onSelect={onSelect} onToggleFav={onToggleFav} isFav={(favorites || []).some(f => f.id === hero?.id)} />
      <div style={{ paddingTop: 8 }}>
        <Row label="🔥 Trending" items={rows.trending} loading={loading} onSelect={onSelect} onToggleFav={onToggleFav} favorites={favorites} />
        <Row label="🎬 Popular Movies" items={rows.popular} loading={loading} onSelect={onSelect} onToggleFav={onToggleFav} favorites={favorites} />
        <Row label="📺 Popular TV Shows" items={rows.shows} loading={loading} onSelect={onSelect} onToggleFav={onToggleFav} favorites={favorites} />
        <Row label="⭐ Top Rated Movies" items={rows.topRated} loading={loading} onSelect={onSelect} onToggleFav={onToggleFav} favorites={favorites} />
        <Row label="🏆 Top Rated Shows" items={rows.topShows} loading={loading} onSelect={onSelect} onToggleFav={onToggleFav} favorites={favorites} />
        <Row label="🎞️ Now Playing" items={rows.nowPlaying} loading={loading} onSelect={onSelect} onToggleFav={onToggleFav} favorites={favorites} />
        <Row label="📡 Airing Today" items={rows.airing} loading={loading} onSelect={onSelect} onToggleFav={onToggleFav} favorites={favorites} />
      </div>
    </div>
  );
}

// ─── Page: Movies ─────────────────────────────────────────────────────────────
function MoviesPage({ onSelect, onToggleFav, favorites, hasKey }) {
  const [genres, setGenres] = useState([]);
  const [activeGenre, setActiveGenre] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (hasKey) movieGenres().then(d => setGenres(d?.genres || [])); }, [hasKey]);

  useEffect(() => {
    if (!hasKey) { setLoading(false); return; }
    setLoading(true);
    const fn = activeGenre ? () => moviesByGenre(activeGenre, page) : () => popularMovies(page);
    fn().then(d => { setItems(d?.results || []); setTotalPages(Math.min(d?.total_pages || 1, 50)); setLoading(false); });
  }, [hasKey, activeGenre, page]);

  if (!hasKey) return <NoApiKey />;

  return (
    <div className="page">
      <div style={{ padding: '16px 16px 8px' }}>
        <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 1.5, marginBottom: 12 }}>
          <span style={{ color: '#e50914' }}>FREE</span> MOVIES
        </h1>
        <GenreChips genres={genres} active={activeGenre} onSelect={(id) => { setActiveGenre(id); setPage(1); }} />
      </div>
      <div style={{ padding: '12px 0 16px' }}>
        <Grid items={items} loading={loading} onSelect={onSelect} onToggleFav={onToggleFav} favorites={favorites} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '0 16px 24px' }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans'", opacity: page === 1 ? .4 : 1, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon.ChevL /> Prev
        </button>
        <span style={{ background: '#e50914', color: '#fff', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 800 }}>Page {page}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans'", display: 'flex', alignItems: 'center', gap: 5 }}>
          Next <Icon.ChevR />
        </button>
      </div>
    </div>
  );
}

// ─── Page: TV Shows ───────────────────────────────────────────────────────────
function ShowsPage({ onSelect, onToggleFav, favorites, hasKey }) {
  const [genres, setGenres] = useState([]);
  const [activeGenre, setActiveGenre] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (hasKey) tvGenres().then(d => setGenres(d?.genres || [])); }, [hasKey]);

  useEffect(() => {
    if (!hasKey) { setLoading(false); return; }
    setLoading(true);
    const fn = activeGenre ? () => showsByGenre(activeGenre, page) : () => popularShows(page);
    fn().then(d => { setItems(d?.results || []); setTotalPages(Math.min(d?.total_pages || 1, 50)); setLoading(false); });
  }, [hasKey, activeGenre, page]);

  if (!hasKey) return <NoApiKey />;

  return (
    <div className="page">
      <div style={{ padding: '16px 16px 8px' }}>
        <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 1.5, marginBottom: 12 }}>
          <span style={{ color: '#e50914' }}>FREE</span> TV SHOWS
        </h1>
        <GenreChips genres={genres} active={activeGenre} onSelect={(id) => { setActiveGenre(id); setPage(1); }} />
      </div>
      <div style={{ padding: '12px 0 16px' }}>
        <Grid items={items} loading={loading} onSelect={onSelect} onToggleFav={onToggleFav} favorites={favorites} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '0 16px 24px' }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans'", opacity: page === 1 ? .4 : 1, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon.ChevL /> Prev
        </button>
        <span style={{ background: '#e50914', color: '#fff', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 800 }}>Page {page}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans'", display: 'flex', alignItems: 'center', gap: 5 }}>
          Next <Icon.ChevR />
        </button>
      </div>
    </div>
  );
}

// ─── Page: My List ────────────────────────────────────────────────────────────
function MyListPage({ onSelect, onToggleFav, favorites }) {
  return (
    <div className="page">
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 1.5 }}>
          MY <span style={{ color: '#e50914' }}>LIST</span>
        </h1>
        <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 13 }}>{favorites.length} saved</span>
      </div>
      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🎬</div>
          <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Nothing saved yet</h3>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 14, lineHeight: 1.6 }}>Tap the <b>+</b> button on any movie or show to add it to your list</p>
        </div>
      ) : (
        <Grid items={favorites} loading={false} onSelect={onSelect} onToggleFav={onToggleFav} favorites={favorites} />
      )}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  injectGlobalCSS();

  const [tab, setTab] = useState('home');
  const [playing, setPlaying] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [favorites, setFavorites] = useLocalStorage('onstream_mylist', []);
  const [toast, setToast] = useState('');
  const [offline, setOffline] = useState(!navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  const hasKey = Boolean(import.meta.env.VITE_TMDB_KEY);

  // Offline detection
  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // PWA install prompt
  useEffect(() => {
    const h = (e) => { e.preventDefault(); setInstallPrompt(e); setTimeout(() => setShowInstall(true), 4000); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  // Search debounce
  useEffect(() => {
    if (!searchQ.trim() || !hasKey) { setSearchResults([]); return; }
    setSearchLoading(true);
    const t = setTimeout(() => {
      search(searchQ).then(d => { setSearchResults(d?.results || []); setSearchLoading(false); });
    }, 380);
    return () => clearTimeout(t);
  }, [searchQ, hasKey]);

  const showToast = useCallback((msg) => { setToast(msg); }, []);

  const toggleFav = useCallback((item) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === item.id);
      showToast(exists ? `Removed from My List` : `Added to My List`);
      return exists ? prev.filter(f => f.id !== item.id) : [{ ...item, media_type: getType(item) }, ...prev];
    });
  }, [setFavorites, showToast]);

  const handleSelect = useCallback((item) => {
    setPlaying({ ...item, media_type: getType(item) });
  }, []);

  const isSearching = searchQ.length > 1;
  const navItems = [
    { id: 'home',   label: 'Home',     icon: <Icon.Home /> },
    { id: 'movies', label: 'Movies',   icon: <Icon.Film /> },
    { id: 'shows',  label: 'TV Shows', icon: <Icon.Tv /> },
    { id: 'mylist', label: 'My List',  icon: <Icon.Heart f={favorites.length > 0} /> },
  ];

  return (
    <div style={{ background: '#0d0d0d', minHeight: '100dvh', color: '#fff', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* ── In-App Player (fullscreen) ── */}
      {playing && (
        <Player
          item={playing}
          onClose={() => setPlaying(null)}
          onToggleFav={toggleFav}
          isFav={favorites.some(f => f.id === playing.id)}
        />
      )}

      {/* ── Toast ── */}
      <Toast msg={toast} onDone={() => setToast('')} />

      {/* ── Offline Banner ── */}
      <OfflineBanner offline={offline} />

      {/* ── Top bar ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 500, background: 'rgba(13,13,13,.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 0' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 28, height: 28, background: '#e50914', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(229,9,20,.5)' }}>
              <Icon.Play />
            </div>
            <span style={{ fontFamily: "'Bebas Neue'", fontSize: 22, letterSpacing: 3 }}>
              ON<span style={{ color: '#e50914' }}>STREAM</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {offline ? <Icon.WifiOff /> : null}
            <span style={{ background: 'rgba(229,9,20,.12)', border: '1px solid rgba(229,9,20,.25)', color: '#e50914', fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 20, letterSpacing: .5 }}>FREE</span>
          </div>
        </div>

        {/* Search bar */}
        <SearchBar value={searchQ} onChange={(v) => { setSearchQ(v); }} onClear={() => setSearchQ('')} />

        {/* Nav tabs */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,.05)' }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => { setTab(n.id); setSearchQ(''); }}
              style={{ flex: 1, background: 'none', border: 'none', color: tab === n.id ? '#e50914' : 'rgba(255,255,255,.45)', cursor: 'pointer', padding: '10px 4px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, borderBottom: tab === n.id ? '2px solid #e50914' : '2px solid transparent', transition: 'all .2s', fontFamily: "'DM Sans'" }}>
              {n.icon}
              <span style={{ fontSize: 10, fontWeight: tab === n.id ? 800 : 500 }}>{n.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 20 }}>

        {/* Search Results */}
        {isSearching && (
          <div className="page" style={{ padding: '16px 0' }}>
            <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 1 }}>
                {searchLoading ? 'Searching…' : `"${searchQ}" · ${searchResults.filter(r => r.poster_path).length} results`}
              </h2>
            </div>
            <Grid items={searchResults.filter(r => r.poster_path && (r.media_type === 'movie' || r.media_type === 'tv'))}
              loading={searchLoading} onSelect={handleSelect} onToggleFav={toggleFav} favorites={favorites} />
          </div>
        )}

        {/* Tab pages */}
        {!isSearching && tab === 'home'   && <HomePage   onSelect={handleSelect} onToggleFav={toggleFav} favorites={favorites} hasKey={hasKey} />}
        {!isSearching && tab === 'movies' && <MoviesPage onSelect={handleSelect} onToggleFav={toggleFav} favorites={favorites} hasKey={hasKey} />}
        {!isSearching && tab === 'shows'  && <ShowsPage  onSelect={handleSelect} onToggleFav={toggleFav} favorites={favorites} hasKey={hasKey} />}
        {!isSearching && tab === 'mylist' && <MyListPage onSelect={handleSelect} onToggleFav={toggleFav} favorites={favorites} />}
      </main>

      {/* ── PWA Install Banner ── */}
      {showInstall && installPrompt && (
        <div className="fade-in" style={{ position: 'fixed', bottom: 20, left: 16, right: 16, zIndex: 800, background: '#1a1a1a', border: '1px solid rgba(229,9,20,.35)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 40px rgba(0,0,0,.7)' }}>
          <div style={{ width: 42, height: 42, background: '#e50914', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>▶</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Install OnStream</div>
            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>Add to home screen for offline access</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowInstall(false)} style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: '#fff', borderRadius: 7, padding: '7px 10px', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans'" }}>Later</button>
            <button onClick={() => { installPrompt.prompt(); setShowInstall(false); }} style={{ background: '#e50914', border: 'none', color: '#fff', borderRadius: 7, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: "'DM Sans'" }}>Install</button>
          </div>
        </div>
      )}
    </div>
  );
}
