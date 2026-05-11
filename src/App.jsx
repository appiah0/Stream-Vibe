import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  getTrending, getPopularMovies, getTopMovies, getNowPlaying,
  getPopularShows, getTopShows, getAiringToday,
  getMoviesByGenre, getShowsByGenre,
  getMovieGenres, getTVGenres,
  getMovieDetail, getShowDetail, getSeasonDetail,
  searchAll, SERVERS, DOWNLOAD, SUBTITLE_LANGS,
  IMG, getTitle, getYear, getRating, getType,
} from './utils/tmdb.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';

// ─── Global styles ────────────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById('os-styles')) return;
  const el = document.createElement('style');
  el.id = 'os-styles';
  el.textContent = `
    @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
    @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
    @keyframes slideUp { from{transform:translateY(100%)} to{transform:none} }
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

    .shimmer {
      background:linear-gradient(90deg,#1c1c26 25%,#252535 50%,#1c1c26 75%);
      background-size:200% 100%;
      animation:shimmer 1.5s infinite;
    }
    .card { cursor:pointer; transition:transform .22s cubic-bezier(.34,1.56,.64,1); }
    .card:hover  { transform:scale(1.06) translateY(-3px); }
    .card:active { transform:scale(.96); }
    .btn  { cursor:pointer; transition:all .15s; font-family:'DM Sans',sans-serif; }
    .btn:active { transform:scale(.93); }
    .scroll-x { overflow-x:auto; scrollbar-width:none; }
    .scroll-x::-webkit-scrollbar { display:none; }
    .tab-active  { color:#e50914 !important; border-bottom:2px solid #e50914 !important; }
    .tab-inactive{ color:rgba(255,255,255,.42); border-bottom:2px solid transparent; }
    .chip-active   { background:#e50914 !important; border-color:#e50914 !important; color:#fff !important; }
    .chip-inactive { background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.12); color:rgba(255,255,255,.65); }
    .srv-active    { background:#e50914 !important; border-color:#e50914 !important; color:#fff !important; }
    .srv-inactive  { background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.1); color:rgba(255,255,255,.65); }
    .srv-inactive:hover { border-color:rgba(229,9,20,.5); color:#fff; }
    .ep-active     { background:#e50914 !important; border-color:#e50914 !important; color:#fff !important; }
    .ep-inactive   { background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.1); color:rgba(255,255,255,.65); }
    .ep-inactive:hover { border-color:rgba(229,9,20,.4); }
    .dl-row { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:9px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); text-decoration:none; color:#fff; font-family:'DM Sans',sans-serif; transition:background .18s; }
    .dl-row:hover { background:rgba(229,9,20,.12); border-color:rgba(229,9,20,.3); }
    .sub-pill { padding:5px 11px; border-radius:20px; font-size:11px; font-weight:700; cursor:pointer; border:1px solid; transition:all .15s; font-family:'DM Sans',sans-serif; white-space:nowrap; }
    .sub-active   { background:#e50914; border-color:#e50914; color:#fff; }
    .sub-inactive { background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.1); color:rgba(255,255,255,.6); }

    /* Subtitle overlay on top of iframe */
    .sub-overlay {
      position:absolute; bottom:56px; left:0; right:0;
      display:flex; justify-content:center; pointer-events:none; z-index:20; padding:0 12px;
    }
    .sub-text {
      background:rgba(0,0,0,.82); color:#fff;
      font-size:clamp(14px,3.5vw,18px); font-weight:600; line-height:1.45;
      padding:5px 14px; border-radius:6px; text-align:center; max-width:90%;
      text-shadow:0 1px 3px rgba(0,0,0,.9);
    }

    /* Popup blocker overlay — sits on top of iframe, invisible, intercepts tap-to-open-new-tab */
    .popup-block {
      position:absolute; inset:0; z-index:10;
      /* Transparent but captures pointer events that would escape iframe */
      pointer-events:none;
    }

    @media (orientation:landscape) and (max-height:500px) {
      .player-wrap { aspect-ratio:unset !important; height:100dvh !important; }
    }
  `;
  document.head.appendChild(el);
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ic = {
  Play:    ({s=18})=><svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>,
  Plus:    ()=><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Check:   ()=><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>,
  X:       ({s=20})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Back:    ()=><svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>,
  Home:    ()=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  Film:    ()=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
  Tv:      ()=><svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17,2 12,7 7,2"/></svg>,
  Heart:   ({f})=><svg width={21} height={21} viewBox="0 0 24 24" fill={f?'#e50914':'none'} stroke={f?'#e50914':'currentColor'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Star:    ()=><svg width={11} height={11} viewBox="0 0 24 24" fill="#f5c518"><polygon points="12,2 15,8 22,9 17,14 18,21 12,18 6,21 7,14 2,9 9,8"/></svg>,
  DL:      ()=><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Sub:     ()=><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Next:    ()=><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>,
  Refresh: ()=><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  FS:      ()=><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,3 21,3 21,9"/><polyline points="9,21 3,21 3,15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
  ChevL:   ()=><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>,
  ChevR:   ()=><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>,
  Shield:  ()=><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Clock:   ()=><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  WifiOff: ()=><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a11 11 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
  Gear:    ()=><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Palette: ()=><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>,
  Text:    ()=><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4,7 4,4 20,4 20,7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  Video:   ()=><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23,7 16,12 23,17 23,7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
};

// ─── Micro components ─────────────────────────────────────────────────────────
const Skel = ({h=200,w='100%',r=9}) => <div className="shimmer" style={{height:h,width:w,borderRadius:r}} />;

const Spinner = ({s=36}) => (
  <div style={{width:s,height:s,border:`3px solid rgba(229,9,20,.2)`,borderTopColor:'#e50914',borderRadius:'50%',animation:'spin .8s linear infinite'}} />
);

function Toast({msg, clear}) {
  useEffect(()=>{ if(!msg) return; const t=setTimeout(clear,2800); return ()=>clearTimeout(t); },[msg,clear]);
  if (!msg) return null;
  return (
    <div style={{position:'fixed',bottom:88,left:'50%',zIndex:9999,animation:'toastIn .3s ease',
      background:'#181824',border:'1px solid rgba(229,9,20,.3)',color:'#fff',
      padding:'10px 18px',borderRadius:10,fontSize:13,fontWeight:600,
      boxShadow:'0 6px 28px rgba(0,0,0,.7)',whiteSpace:'nowrap',
      display:'flex',alignItems:'center',gap:8,maxWidth:'88vw',overflow:'hidden',textOverflow:'ellipsis'}}>
      <span style={{color:'#e50914',fontSize:8}}>●</span>{msg}
    </div>
  );
}

// ─── Ad & Redirect Blocker (JS-only, no sandbox) ─────────────────────────────
// Blocks popup ads and redirects purely through JavaScript interception.
// No sandbox attribute is used — that was breaking the players on mobile.
function usePopupBlocker() {
  useEffect(() => {
    // 1. Kill window.open() — the #1 way ad networks open new tabs
    const origOpen = window.open;
    window.open = (...args) => {
      console.warn('[OnStream] Blocked window.open:', args[0]);
      return null;
    };

    // 2. Block any attempt to navigate the top-level page away
    //    (iframes sometimes do window.top.location = 'ad-url')
    const origTopDesc = Object.getOwnPropertyDescriptor(window, 'top');
    try {
      const fakeTop = new Proxy(window, {
        set(t, prop, val) {
          if (prop === 'location') {
            console.warn('[OnStream] Blocked top.location redirect:', val);
            return true; // swallow it
          }
          return Reflect.set(t, prop, val);
        }
      });
      // Only override if we can
      Object.defineProperty(window, 'top', { get: () => fakeTop, configurable: true });
    } catch(_) {}

    // 3. Intercept location changes on the parent window itself
    const origAssign   = window.location.assign.bind(window.location);
    const origReplace  = window.location.replace.bind(window.location);
    try {
      window.location.assign  = (url) => { console.warn('[OnStream] Blocked location.assign:', url); };
      window.location.replace = (url) => { console.warn('[OnStream] Blocked location.replace:', url); };
    } catch(_) {}

    // 4. Block link clicks that came from inside iframes (target=_blank etc.)
    const onLinkClick = (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      // If the click target is inside an iframe — block it
      if (a.target === '_blank' || a.target === '_top' || a.target === '_parent') {
        // Only block if it looks like an ad (not same-origin)
        try {
          const href = a.href || '';
          const isSameOrigin = href.startsWith(window.location.origin) || href.startsWith('/') || href === '';
          if (!isSameOrigin) {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.warn('[OnStream] Blocked external link click:', href);
          }
        } catch(_) {}
      }
    };
    document.addEventListener('click', onLinkClick, true);

    // 5. Watch for any new <script> tags injected by the iframe that try to navigate
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.tagName === 'SCRIPT') {
            const src = node.src || '';
            // Block known ad script domains
            const adDomains = ['doubleclick', 'googlesyndication', 'adservice', 'popads', 'popcash', 'propellerads', 'mgid', 'trafficjunky', 'exoclick'];
            if (adDomains.some(d => src.includes(d))) {
              node.remove();
              console.warn('[OnStream] Removed ad script:', src);
            }
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    return () => {
      window.open = origOpen;
      window.location.assign  = origAssign;
      window.location.replace = origReplace;
      document.removeEventListener('click', onLinkClick, true);
      observer.disconnect();
      try {
        if (origTopDesc) Object.defineProperty(window, 'top', origTopDesc);
      } catch(_) {}
    };
  }, []);
}

// ─── Subtitle engine ─────────────────────────────────────────────────────────
// Displays subtitles as an overlay ON TOP of the iframe.
// Since we can't access the iframe's internal player, we fetch VTT from
// open subtitle sources and render lines ourselves via a timed engine.
function useSubtitleEngine(vttUrl, delay) {
  const [cues, setCues] = useState([]);
  const [currentCue, setCurrentCue] = useState('');
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const cuesRef = useRef([]);

  // Parse VTT
  useEffect(() => {
    if (!vttUrl) { setCues([]); setCurrentCue(''); return; }
    fetch(vttUrl)
      .then(r => r.text())
      .then(text => {
        const lines = text.split('\n');
        const parsed = [];
        let i = 0;
        while (i < lines.length) {
          if (lines[i]?.includes('-->')) {
            const times = lines[i].split('-->').map(t => {
              const parts = t.trim().replace(',','.').split(':');
              return parseFloat(parts[0])*3600 + parseFloat(parts[1])*60 + parseFloat(parts[2]);
            });
            const textLines = [];
            i++;
            while (i < lines.length && lines[i]?.trim() !== '') {
              textLines.push(lines[i].replace(/<[^>]+>/g,''));
              i++;
            }
            if (textLines.length) parsed.push({ start:times[0], end:times[1], text:textLines.join('\n') });
          }
          i++;
        }
        cuesRef.current = parsed;
        setCues(parsed);
      })
      .catch(() => { cuesRef.current = []; setCues([]); });
  }, [vttUrl]);

  // Tick engine — runs from when player opens, syncing to elapsed time
  useEffect(() => {
    if (!cues.length) { setCurrentCue(''); return; }
    startRef.current = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000 - delay;
      const active = cuesRef.current.find(c => elapsed >= c.start && elapsed <= c.end);
      setCurrentCue(active?.text || '');
    };
    timerRef.current = setInterval(tick, 250);
    return () => clearInterval(timerRef.current);
  }, [cues, delay]);

  return currentCue;
}

// ─── Settings defaults ────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS = {
  // Subtitle appearance
  subFont:      'DM Sans',
  subSize:      18,           // px
  subColor:     '#ffffff',
  subBg:        'rgba(0,0,0,0.82)',
  subBold:      false,
  subItalic:    false,
  subPosition:  'bottom',     // 'bottom' | 'top' | 'middle'
  subShadow:    true,
  // Player defaults
  defServer:    'vidlink',    // server id
  defQuality:   'auto',       // 'auto'|'1080p'|'720p'|'480p'|'360p'
  defResize:    'contain',    // 'contain'|'cover'|'fill'|'16:9'|'4:3'|'21:9'
};

const FONTS    = ['DM Sans','Arial','Georgia','Courier New','Trebuchet MS','Impact','Verdana','Times New Roman'];
const QUALITIES= ['auto','1080p','720p','480p','360p'];
const RESIZES  = [
  {id:'contain', label:'Contain (letterbox)'},
  {id:'cover',   label:'Cover (crop)'},
  {id:'fill',    label:'Fill (stretch)'},
  {id:'16:9',    label:'Force 16:9'},
  {id:'4:3',     label:'Force 4:3'},
  {id:'21:9',    label:'Force 21:9 (cinema)'},
];

// Map resize mode → CSS aspect-ratio + object-fit for iframe container
function resizeStyle(mode) {
  const map = {
    'contain': { aspectRatio:'16/9', objectFit:'contain' },
    'cover':   { aspectRatio:'16/9', objectFit:'cover' },
    'fill':    { aspectRatio:'16/9', objectFit:'fill' },
    '16:9':    { aspectRatio:'16/9' },
    '4:3':     { aspectRatio:'4/3' },
    '21:9':    { aspectRatio:'21/9' },
  };
  return map[mode] || map['contain'];
}

// ─── SettingRow helper ────────────────────────────────────────────────────────
function SLabel({children}) {
  return <div style={{color:'rgba(255,255,255,.4)',fontSize:10,fontWeight:700,letterSpacing:1.3,textTransform:'uppercase',marginBottom:7,marginTop:14}}>{children}</div>;
}
function SRow({children}) {
  return <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>{children}</div>;
}
function SChip({active,onClick,children}) {
  return (
    <button className="btn" onClick={onClick}
      style={{border:'1px solid',borderRadius:7,padding:'5px 12px',fontSize:12,fontWeight:700,
        background:active?'#e50914':'rgba(255,255,255,.06)',
        borderColor:active?'#e50914':'rgba(255,255,255,.12)',
        color:active?'#fff':'rgba(255,255,255,.65)',whiteSpace:'nowrap'}}>
      {children}
    </button>
  );
}

// ─── Player ───────────────────────────────────────────────────────────────────
function Player({ item, onClose, onToggleFav, isFav, settings, onSaveSettings }) {
  usePopupBlocker();
  const isTV    = getType(item) === 'tv';
  const servers = SERVERS[isTV ? 'tv' : 'movie'];
  const dlSrcs  = DOWNLOAD[isTV ? 'tv' : 'movie'];

  // Find initial server index from settings default
  const initSrvIdx = Math.max(0, servers.findIndex(s => s.id === settings.defServer));

  const [srvIdx,   setSrvIdx]   = useState(initSrvIdx);
  const [season,   setSeason]   = useState(1);
  const [episode,  setEpisode]  = useState(1);
  const [seasons,  setSeasons]  = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loadEps,  setLoadEps]  = useState(false);
  const [ifrLoad,  setIfrLoad]  = useState(true);
  const [panel,    setPanel]    = useState('servers');
  const [subLang,  setSubLang]  = useState('off');
  const [subDelay, setSubDelay] = useState(0);
  const [vttUrl,   setVttUrl]   = useState(null);
  // Local copy of settings for live editing inside player
  const [localSets, setLocalSets] = useState({ ...settings });
  const ifrRef  = useRef(null);
  const wrapRef = useRef(null);

  const set = (k, v) => setLocalSets(p => ({ ...p, [k]: v }));
  const saveAndClose = () => { onSaveSettings(localSets); };

  const embedUrl = useMemo(() => {
    const srv = servers[srvIdx];
    let base = isTV ? srv.url(item.id, season, episode) : srv.url(item.id);
    const sep = base.includes('?') ? '&' : '?';
    // Pass quality hint where supported
    if (localSets.defQuality !== 'auto') base += `${sep}quality=${localSets.defQuality}`;
    // Pass subtitle lang hint
    if (subLang !== 'off') base += `${base.includes('?')?'&':'?'}sub_lang=${subLang}`;
    return base;
  }, [servers, srvIdx, item.id, isTV, season, episode, subLang, localSets.defQuality]);

  useEffect(() => {
    if (subLang === 'off') { setVttUrl(null); return; }
    setVttUrl(isTV
      ? `https://vidsrc.xyz/subs/tv?tmdb=${item.id}&season=${season}&episode=${episode}&lang=${subLang}`
      : `https://vidsrc.xyz/subs/movie?tmdb=${item.id}&lang=${subLang}`);
  }, [subLang, item.id, isTV, season, episode]);

  const subtitleText = useSubtitleEngine(vttUrl, subDelay);

  useEffect(() => {
    const guard = (e) => { if (e.target !== window) e.stopImmediatePropagation(); };
    window.addEventListener('click', guard, true);
    return () => window.removeEventListener('click', guard, true);
  }, []);

  useEffect(() => {
    if (!isTV) return;
    getShowDetail(item.id).then(d => {
      if (!d) return;
      setSeasons(Array.from({ length: d.number_of_seasons || 1 }, (_,i) => i+1));
    });
  }, [item.id, isTV]);

  useEffect(() => {
    if (!isTV || !seasons.length) return;
    setLoadEps(true);
    getSeasonDetail(item.id, season).then(d => {
      const eps = d?.episodes?.map(e => ({num:e.episode_number, name:e.name}))
        || Array.from({length:10},(_,i) => ({num:i+1, name:`Episode ${i+1}`}));
      setEpisodes(eps); setEpisode(1); setLoadEps(false);
    });
  }, [item.id, season, isTV, seasons]);

  const goFS = () => {
    const el = wrapRef.current;
    if (!el) return;
    (el.requestFullscreen||el.webkitRequestFullscreen||el.mozRequestFullScreen)?.call(el);
  };
  const switchServer = (i) => { setSrvIdx(i); setIfrLoad(true); };
  const nextServer   = () => switchServer((srvIdx + 1) % servers.length);

  // Subtitle overlay position
  const subPositionStyle = {
    bottom: { bottom:56, top:'auto' },
    top:    { top:14,    bottom:'auto' },
    middle: { top:'50%', bottom:'auto', transform:'translateY(-50%)' },
  }[localSets.subPosition] || { bottom:56 };

  // Build subtitle text style from settings
  const subTextStyle = {
    fontFamily:  `'${localSets.subFont}', sans-serif`,
    fontSize:    `${localSets.subSize}px`,
    color:       localSets.subColor,
    background:  localSets.subBg,
    fontWeight:  localSets.subBold   ? 900 : 600,
    fontStyle:   localSets.subItalic ? 'italic' : 'normal',
    textShadow:  localSets.subShadow ? '0 1px 4px rgba(0,0,0,1)' : 'none',
    lineHeight:  1.45,
    padding:     '5px 14px',
    borderRadius: 6,
    textAlign:   'center',
    maxWidth:    '92%',
  };

  const containerStyle = {
    flexShrink: 0, position: 'relative', width: '100%', background: '#000',
    ...resizeStyle(localSets.defResize),
  };

  const PANEL_TABS = [
    {id:'servers',   label:'Servers',   icon:<Ic.Refresh/>},
    {id:'subtitles', label:'Subtitles', icon:<Ic.Sub/>},
    {id:'download',  label:'Download',  icon:<Ic.DL/>},
    {id:'settings',  label:'Settings',  icon:<Ic.Gear/>},
  ];

  return (
    <div style={{position:'fixed',inset:0,zIndex:3000,background:'#000',display:'flex',flexDirection:'column',overflowY:'auto',overflowX:'hidden'}}>

      {/* ── Top bar ── */}
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'rgba(10,10,15,.97)',backdropFilter:'blur(14px)',borderBottom:'1px solid rgba(255,255,255,.07)',flexShrink:0,position:'sticky',top:0,zIndex:10}}>
        <button className="btn" onClick={()=>{saveAndClose();onClose();}} style={{background:'rgba(255,255,255,.08)',border:'none',color:'#fff',borderRadius:8,padding:'8px 10px',display:'flex'}}>
          <Ic.Back />
        </button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:800,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{getTitle(item)}</div>
          <div style={{color:'rgba(255,255,255,.4)',fontSize:11,display:'flex',alignItems:'center',gap:6}}>
            <Ic.Shield /><span style={{color:'#4ade80',fontSize:11,fontWeight:600}}>Ad popups blocked</span>
            {isTV && <span>· S{season}E{episode}</span>}
          </div>
        </div>
        <button className="btn" onClick={()=>onToggleFav(item)} style={{background:'none',border:'none',color:'#fff',padding:6,display:'flex'}}>
          <Ic.Heart f={isFav} />
        </button>
      </div>

      {/* ── Video iframe — SANDBOXED ── */}
      <div ref={wrapRef} className="player-wrap" style={containerStyle}>
        {ifrLoad && (
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,background:'#000',zIndex:5}}>
            <Spinner />
            <p style={{color:'rgba(255,255,255,.4)',fontSize:12}}>Loading {servers[srvIdx].name}…</p>
          </div>
        )}
        <iframe
          key={embedUrl}
          ref={ifrRef}
          src={embedUrl}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
          allowFullScreen
          style={{width:'100%',height:'100%',border:'none',display:'block',background:'#000'}}
          title={getTitle(item)}
          onLoad={()=>setIfrLoad(false)}
          referrerPolicy="no-referrer"
          scrolling="no"
        />
        {/* Subtitle overlay */}
        {subtitleText && (
          <div style={{position:'absolute',left:0,right:0,display:'flex',justifyContent:'center',pointerEvents:'none',zIndex:20,padding:'0 12px',...subPositionStyle}}>
            <div style={subTextStyle}>{subtitleText}</div>
          </div>
        )}
        {/* Fullscreen btn */}
        <button className="btn" onClick={goFS} style={{position:'absolute',bottom:8,right:8,background:'rgba(0,0,0,.55)',border:'none',color:'#fff',borderRadius:6,padding:6,display:'flex',zIndex:15}}>
          <Ic.FS />
        </button>
        {/* CC indicator */}
        {subLang !== 'off' && (
          <div style={{position:'absolute',top:8,left:8,background:'rgba(229,9,20,.85)',color:'#fff',fontSize:10,fontWeight:800,padding:'3px 8px',borderRadius:20,zIndex:15,display:'flex',alignItems:'center',gap:4}}>
            <Ic.Sub /> CC {subLang.toUpperCase()}
          </div>
        )}
        {/* Quality badge */}
        {localSets.defQuality !== 'auto' && (
          <div style={{position:'absolute',top:8,right:8,background:'rgba(0,0,0,.7)',color:'#fff',fontSize:10,fontWeight:800,padding:'3px 8px',borderRadius:20,zIndex:15}}>
            {localSets.defQuality}
          </div>
        )}
      </div>

      {/* ── Panel tabs ── */}
      <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,.07)',flexShrink:0,background:'rgba(10,10,15,.98)'}}>
        {PANEL_TABS.map(p => (
          <button key={p.id} className="btn" onClick={()=>setPanel(p.id)}
            style={{flex:1,background:'none',border:'none',color:panel===p.id?'#e50914':'rgba(255,255,255,.45)',padding:'10px 2px',display:'flex',flexDirection:'column',alignItems:'center',gap:3,borderBottom:panel===p.id?'2px solid #e50914':'2px solid transparent',fontWeight:panel===p.id?800:500,fontSize:10}}>
            {p.icon}{p.label}
          </button>
        ))}
      </div>

      {/* ── Servers panel ── */}
      {panel === 'servers' && (
        <div style={{padding:'12px 14px',flexShrink:0}}>
          <p style={{color:'rgba(255,255,255,.35)',fontSize:11,marginBottom:10,display:'flex',alignItems:'center',gap:5}}>
            <Ic.Shield /> window.open() and ad redirects are blocked via JavaScript
          </p>
          <div className="scroll-x" style={{display:'flex',gap:7,paddingBottom:4}}>
            {servers.map((s,i) => (
              <button key={s.id} className={`btn ${srvIdx===i?'srv-active':'srv-inactive'}`}
                onClick={()=>switchServer(i)}
                style={{border:'1px solid',borderRadius:8,padding:'7px 13px',fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>
                {s.name}
              </button>
            ))}
          </div>
          <button className="btn" onClick={nextServer}
            style={{marginTop:10,display:'flex',alignItems:'center',gap:6,background:'rgba(229,9,20,.12)',border:'1px solid rgba(229,9,20,.3)',color:'#e50914',borderRadius:8,padding:'8px 14px',fontSize:12,fontWeight:700}}>
            <Ic.Next /> Try Next Server
          </button>
          {isTV && (
            <div style={{marginTop:14}}>
              {seasons.length > 0 && (<>
                <div style={{color:'rgba(255,255,255,.4)',fontSize:10,fontWeight:700,letterSpacing:1.4,textTransform:'uppercase',marginBottom:7}}>Season</div>
                <div className="scroll-x" style={{display:'flex',gap:6,marginBottom:12,paddingBottom:4}}>
                  {seasons.map(s => (
                    <button key={s} className={`btn ${season===s?'ep-active':'ep-inactive'}`}
                      onClick={()=>{setSeason(s);setIfrLoad(true);}}
                      style={{border:'1px solid',borderRadius:7,padding:'6px 11px',fontSize:12,fontWeight:700}}>S{s}</button>
                  ))}
                </div>
              </>)}
              <div style={{color:'rgba(255,255,255,.4)',fontSize:10,fontWeight:700,letterSpacing:1.4,textTransform:'uppercase',marginBottom:7}}>Episode</div>
              {loadEps
                ? <p style={{color:'rgba(255,255,255,.3)',fontSize:12,animation:'pulse 1s infinite'}}>Loading…</p>
                : <div className="scroll-x" style={{display:'flex',gap:6,paddingBottom:4}}>
                    {episodes.map(ep => (
                      <button key={ep.num} className={`btn ${episode===ep.num?'ep-active':'ep-inactive'}`}
                        title={ep.name} onClick={()=>{setEpisode(ep.num);setIfrLoad(true);}}
                        style={{border:'1px solid',borderRadius:7,padding:'6px 10px',fontSize:12,fontWeight:700,minWidth:36}}>
                        {ep.num}
                      </button>
                    ))}
                  </div>
              }
            </div>
          )}
        </div>
      )}

      {/* ── Subtitles panel ── */}
      {panel === 'subtitles' && (
        <div style={{padding:'12px 14px',flexShrink:0}}>
          <SLabel>Language</SLabel>
          <div className="scroll-x" style={{display:'flex',gap:7,paddingBottom:8}}>
            {SUBTITLE_LANGS.map(l => (
              <button key={l.code} className={`sub-pill btn ${subLang===l.code?'sub-active':'sub-inactive'}`}
                onClick={()=>setSubLang(l.code)}>{l.label}</button>
            ))}
          </div>

          <SLabel><Ic.Clock /> Subtitle Delay</SLabel>
          <div style={{display:'flex',alignItems:'center',gap:12,background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:10,padding:'10px 14px'}}>
            <button className="btn" onClick={()=>setSubDelay(d=>+(d-0.5).toFixed(1))}
              style={{background:'rgba(255,255,255,.08)',border:'none',color:'#fff',borderRadius:7,padding:'6px 12px',fontSize:16,fontWeight:800}}>−</button>
            <div style={{flex:1,textAlign:'center'}}>
              <span style={{fontSize:20,fontWeight:900,color:subDelay===0?'#fff':subDelay>0?'#4ade80':'#f87171'}}>{subDelay>0?'+':''}{subDelay.toFixed(1)}s</span>
              <div style={{color:'rgba(255,255,255,.35)',fontSize:11,marginTop:2}}>{subDelay===0?'No delay':subDelay>0?'Delayed (subs come later)':'Early (subs come sooner)'}</div>
            </div>
            <button className="btn" onClick={()=>setSubDelay(d=>+(d+0.5).toFixed(1))}
              style={{background:'rgba(255,255,255,.08)',border:'none',color:'#fff',borderRadius:7,padding:'6px 12px',fontSize:16,fontWeight:800}}>+</button>
          </div>
          <button className="btn" onClick={()=>setSubDelay(0)}
            style={{marginTop:7,background:'none',border:'none',color:'rgba(255,255,255,.4)',fontSize:12,padding:'4px 0',display:'flex',alignItems:'center',gap:5}}>
            <Ic.Refresh /> Reset to 0
          </button>

          {/* Live preview */}
          {subLang !== 'off' && (
            <div style={{marginTop:14,padding:'12px',background:'rgba(0,0,0,.6)',borderRadius:10,border:'1px solid rgba(255,255,255,.07)'}}>
              <div style={{color:'rgba(255,255,255,.4)',fontSize:10,fontWeight:700,letterSpacing:1.3,textTransform:'uppercase',marginBottom:8}}>Preview</div>
              <div style={{display:'flex',justifyContent:'center'}}>
                <div style={subTextStyle}>The quick brown fox jumps over the lazy dog.</div>
              </div>
            </div>
          )}
          <div style={{marginTop:12,padding:'10px 12px',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',borderRadius:9}}>
            <p style={{color:'rgba(255,255,255,.35)',fontSize:11,lineHeight:1.6}}>
              💡 Appearance settings (font, size, color, position) are in the <b style={{color:'rgba(255,255,255,.5)'}}>Settings</b> tab. They're saved for all future videos.
            </p>
          </div>
        </div>
      )}

      {/* ── Download panel ── */}
      {panel === 'download' && (
        <div style={{padding:'12px 14px',flexShrink:0}}>
          <p style={{color:'rgba(255,255,255,.5)',fontSize:12,marginBottom:12,lineHeight:1.5}}>
            On mobile: <b style={{color:'#fff'}}>long-press a link → "Download"</b> to save to your device.
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {(isTV ? dlSrcs.map(s=>({...s,href:s.url(item.id,season,episode)})) : dlSrcs.map(s=>({...s,href:s.url(item.id)}))).map((src,i)=>(
              <a key={i} href={src.href} className="dl-row" target="_blank" rel="noopener noreferrer" download>
                {src.isSub ? <Ic.Sub /> : <Ic.DL />}
                <span style={{flex:1,fontWeight:600,fontSize:13}}>{src.name}</span>
                <span style={{color:'rgba(255,255,255,.35)',fontSize:11}}>↗</span>
              </a>
            ))}
          </div>
          <div style={{marginTop:14,padding:'10px 12px',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',borderRadius:9}}>
            <p style={{color:'rgba(255,255,255,.35)',fontSize:11,lineHeight:1.65}}>
              📱 <b style={{color:'rgba(255,255,255,.5)'}}>Android:</b> Download manager opens automatically.<br/>
              🍎 <b style={{color:'rgba(255,255,255,.5)'}}>iPhone:</b> Long-press → "Download Linked File".<br/>
              💾 <b style={{color:'rgba(255,255,255,.5)'}}>Once saved:</b> Watch offline in VLC or Files app.
            </p>
          </div>
        </div>
      )}

      {/* ── Settings panel ── */}
      {panel === 'settings' && (
        <div style={{padding:'12px 14px 28px',flexShrink:0}}>

          {/* ── SUBTITLE APPEARANCE ── */}
          <div style={{padding:'12px 14px',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4,color:'rgba(255,255,255,.8)',fontWeight:700,fontSize:13}}>
              <Ic.Sub /> Subtitle Appearance
            </div>
            <div style={{color:'rgba(255,255,255,.35)',fontSize:11,marginBottom:12}}>Changes apply live to the subtitle overlay</div>

            {/* Font family */}
            <SLabel><Ic.Text /> Font</SLabel>
            <div className="scroll-x" style={{display:'flex',gap:7,paddingBottom:4}}>
              {FONTS.map(f => (
                <SChip key={f} active={localSets.subFont===f} onClick={()=>set('subFont',f)}>
                  <span style={{fontFamily:f}}>{f}</span>
                </SChip>
              ))}
            </div>

            {/* Font size */}
            <SLabel>Text Size</SLabel>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <button className="btn" onClick={()=>set('subSize',Math.max(10,localSets.subSize-2))}
                style={{background:'rgba(255,255,255,.08)',border:'none',color:'#fff',borderRadius:7,padding:'6px 12px',fontSize:15,fontWeight:800}}>A−</button>
              <div style={{flex:1,textAlign:'center',fontSize:22,fontWeight:900}}>{localSets.subSize}px</div>
              <button className="btn" onClick={()=>set('subSize',Math.min(48,localSets.subSize+2))}
                style={{background:'rgba(255,255,255,.08)',border:'none',color:'#fff',borderRadius:7,padding:'6px 12px',fontSize:15,fontWeight:800}}>A+</button>
            </div>

            {/* Text color */}
            <SLabel><Ic.Palette /> Text Color</SLabel>
            <SRow>
              {['#ffffff','#ffff00','#00ff00','#00bfff','#ff6b6b','#ffa500','#ff69b4','#e0e0e0'].map(c=>(
                <button key={c} className="btn" onClick={()=>set('subColor',c)}
                  style={{width:30,height:30,borderRadius:'50%',background:c,border:localSets.subColor===c?'3px solid #e50914':'3px solid transparent',padding:0,flexShrink:0}}/>
              ))}
              <input type="color" value={localSets.subColor} onChange={e=>set('subColor',e.target.value)}
                style={{width:30,height:30,borderRadius:'50%',border:'2px solid rgba(255,255,255,.2)',padding:0,cursor:'pointer',background:'none'}} title="Custom color"/>
            </SRow>

            {/* Background color */}
            <SLabel>Background</SLabel>
            <SRow>
              {[
                {label:'Black',  val:'rgba(0,0,0,0.82)'},
                {label:'Dark',   val:'rgba(20,20,20,0.9)'},
                {label:'Red',    val:'rgba(180,0,0,0.75)'},
                {label:'Blue',   val:'rgba(0,0,180,0.75)'},
                {label:'None',   val:'transparent'},
              ].map(b=>(
                <SChip key={b.label} active={localSets.subBg===b.val} onClick={()=>set('subBg',b.val)}>{b.label}</SChip>
              ))}
            </SRow>

            {/* Style toggles */}
            <SLabel>Style</SLabel>
            <SRow>
              <SChip active={localSets.subBold}   onClick={()=>set('subBold',  !localSets.subBold)}>  <b>Bold</b></SChip>
              <SChip active={localSets.subItalic} onClick={()=>set('subItalic',!localSets.subItalic)}><i>Italic</i></SChip>
              <SChip active={localSets.subShadow} onClick={()=>set('subShadow',!localSets.subShadow)}>Shadow</SChip>
            </SRow>

            {/* Position */}
            <SLabel>Position</SLabel>
            <SRow>
              {['bottom','middle','top'].map(p=>(
                <SChip key={p} active={localSets.subPosition===p} onClick={()=>set('subPosition',p)}>
                  {p.charAt(0).toUpperCase()+p.slice(1)}
                </SChip>
              ))}
            </SRow>

            {/* Live preview */}
            <div style={{marginTop:14,padding:'14px',background:'rgba(0,0,0,.7)',borderRadius:10,border:'1px solid rgba(255,255,255,.07)',display:'flex',justifyContent:'center'}}>
              <div style={subTextStyle}>Subtitle preview text — 見本テキスト</div>
            </div>
          </div>

          {/* ── PLAYER DEFAULTS ── */}
          <div style={{padding:'12px 14px',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4,color:'rgba(255,255,255,.8)',fontWeight:700,fontSize:13}}>
              <Ic.Video /> Player Defaults
            </div>
            <div style={{color:'rgba(255,255,255,.35)',fontSize:11,marginBottom:12}}>These apply when you open a new video</div>

            {/* Default server */}
            <SLabel>Default Server</SLabel>
            <div className="scroll-x" style={{display:'flex',gap:7,paddingBottom:4}}>
              {SERVERS.movie.map(s=>(
                <SChip key={s.id} active={localSets.defServer===s.id} onClick={()=>set('defServer',s.id)}>{s.name}</SChip>
              ))}
            </div>

            {/* Default quality */}
            <SLabel>Default Quality</SLabel>
            <SRow>
              {QUALITIES.map(q=>(
                <SChip key={q} active={localSets.defQuality===q} onClick={()=>set('defQuality',q)}>
                  {q==='auto'?'Auto':q}
                </SChip>
              ))}
            </SRow>
            <p style={{color:'rgba(255,255,255,.3)',fontSize:11,marginTop:6,lineHeight:1.5}}>
              Quality is passed as a hint to servers that support it. Not all servers honour this setting.
            </p>

            {/* Default resize mode */}
            <SLabel>Default Resize / Aspect Ratio</SLabel>
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {RESIZES.map(r=>(
                <button key={r.id} className="btn" onClick={()=>set('defResize',r.id)}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:9,
                    background:localSets.defResize===r.id?'rgba(229,9,20,.15)':'rgba(255,255,255,.04)',
                    border:`1px solid ${localSets.defResize===r.id?'rgba(229,9,20,.5)':'rgba(255,255,255,.08)'}`,
                    color:'#fff',textAlign:'left'}}>
                  <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${localSets.defResize===r.id?'#e50914':'rgba(255,255,255,.3)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {localSets.defResize===r.id && <div style={{width:8,height:8,borderRadius:'50%',background:'#e50914'}}/>}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13}}>{r.id==='contain'?'Contain':''}
                      {r.id==='cover'?'Cover':''}
                      {r.id==='fill'?'Fill':''}
                      {r.id==='16:9'?'16:9':''}
                      {r.id==='4:3'?'4:3':''}
                      {r.id==='21:9'?'21:9 Cinema':''}
                    </div>
                    <div style={{color:'rgba(255,255,255,.4)',fontSize:11}}>{r.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button className="btn" onClick={()=>{onSaveSettings(localSets); setPanel('servers');}}
            style={{width:'100%',background:'#e50914',border:'none',color:'#fff',borderRadius:10,padding:'13px',fontSize:14,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            ✓ Save Settings
          </button>
          <button className="btn" onClick={()=>{ setLocalSets({...DEFAULT_SETTINGS}); onSaveSettings({...DEFAULT_SETTINGS}); }}
            style={{width:'100%',marginTop:8,background:'none',border:'1px solid rgba(255,255,255,.1)',color:'rgba(255,255,255,.4)',borderRadius:10,padding:'11px',fontSize:13,fontWeight:700}}>
            Reset to Defaults
          </button>
        </div>
      )}

      {/* ── Info ── */}
      <div style={{padding:'14px 14px 28px',flexShrink:0}}>
        <h2 style={{fontFamily:"'Bebas Neue'",fontSize:22,letterSpacing:1,marginBottom:6}}>{getTitle(item)}</h2>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,flexWrap:'wrap'}}>
          <span style={{display:'flex',alignItems:'center',gap:4}}><Ic.Star /><b style={{color:'#f5c518',fontSize:13}}>{getRating(item)}</b></span>
          <span style={{color:'rgba(255,255,255,.4)',fontSize:12}}>{getYear(item)}</span>
          <span style={{background:'#e50914',color:'#fff',fontSize:10,fontWeight:800,padding:'2px 7px',borderRadius:4}}>HD</span>
        </div>
        {item.overview && <p style={{color:'rgba(255,255,255,.6)',fontSize:13,lineHeight:1.65}}>{item.overview}</p>}
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ item, onSelect, isFav }) {
  const [err, setErr] = useState(false);
  const poster = IMG.poster(item.poster_path);
  return (
    <div className="card" style={{flexShrink:0,width:130}} onClick={()=>onSelect(item)}>
      <div style={{position:'relative',borderRadius:10,overflow:'hidden',aspectRatio:'2/3',background:'#181824'}}>
        {poster && !err
          ? <img src={poster} alt={getTitle(item)} loading="lazy" onError={()=>setErr(true)} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
          : <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,padding:8,textAlign:'center'}}><span style={{fontSize:28}}>🎬</span><span style={{fontSize:10,color:'rgba(255,255,255,.4)',lineHeight:1.3}}>{getTitle(item)}</span></div>
        }
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,.85) 0%,transparent 55%)'}}/>
        <div style={{position:'absolute',top:5,left:5,background:'#e50914',color:'#fff',fontSize:8,fontWeight:800,padding:'2px 5px',borderRadius:3}}>HD</div>
        {isFav && <div style={{position:'absolute',top:5,right:5}}><Ic.Heart f={true}/></div>}
        <div style={{position:'absolute',bottom:8,left:'50%',transform:'translateX(-50%)',background:'rgba(229,9,20,.9)',borderRadius:'50%',width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center'}}><Ic.Play s={14}/></div>
      </div>
      <div style={{padding:'6px 2px 0'}}>
        <div style={{fontSize:12,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{getTitle(item)}</div>
        <div style={{display:'flex',alignItems:'center',gap:5,marginTop:2}}>
          <Ic.Star /><span style={{color:'#f5c518',fontSize:11,fontWeight:700}}>{getRating(item)}</span>
          <span style={{color:'rgba(255,255,255,.35)',fontSize:11}}>{getYear(item)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function Row({ label, items, loading, onSelect, favorites }) {
  const ref = useRef(null);
  const scroll = d => ref.current?.scrollBy({left:d*300,behavior:'smooth'});
  return (
    <div style={{marginBottom:30}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 16px',marginBottom:10}}>
        <h2 style={{fontFamily:"'Bebas Neue'",fontSize:19,letterSpacing:1.2}}>{label}</h2>
        <div style={{display:'flex',gap:4}}>
          {[<Ic.ChevL/>,<Ic.ChevR/>].map((ic,i)=>(
            <button key={i} className="btn" onClick={()=>scroll(i?1:-1)} style={{background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',color:'#fff',borderRadius:6,width:27,height:27,display:'flex',alignItems:'center',justifyContent:'center'}}>{ic}</button>
          ))}
        </div>
      </div>
      <div ref={ref} className="scroll-x" style={{display:'flex',gap:11,padding:'0 16px 4px'}}>
        {loading
          ? Array(7).fill(0).map((_,i)=><div key={i} style={{flexShrink:0,width:130,display:'flex',flexDirection:'column',gap:6}}><Skel h={195}/><Skel h={12} w="70%" r={4}/></div>)
          : (items||[]).map(it=><Card key={`${it.id}-${it.media_type||''}`} item={it} onSelect={onSelect} isFav={(favorites||[]).some(f=>f.id===it.id)}/>)
        }
      </div>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ item, onSelect, onToggleFav, isFav }) {
  if (!item) return <div style={{height:'clamp(220px,50vw,400px)',display:'flex',alignItems:'center',justifyContent:'center'}}><Spinner/></div>;
  const bd = IMG.backdrop(item.backdrop_path);
  return (
    <div style={{position:'relative',height:'clamp(240px,52vw,420px)',overflow:'hidden',flexShrink:0}}>
      {bd && <img src={bd} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 20%'}}/>}
      <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,#0a0a0f 0%,rgba(10,10,15,.7) 45%,rgba(10,10,15,.15) 100%)'}}/>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(to right,rgba(10,10,15,.85) 0%,transparent 65%)'}}/>
      <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'18px 16px 18px',zIndex:2,animation:'fadeUp .6s ease'}}>
        <div style={{display:'flex',gap:6,marginBottom:7}}>
          <span style={{background:'#e50914',color:'#fff',fontSize:10,fontWeight:800,padding:'2px 8px',borderRadius:4,letterSpacing:.8}}>🔥 TRENDING</span>
          <span style={{background:'rgba(255,255,255,.1)',backdropFilter:'blur(6px)',color:'#fff',fontSize:10,padding:'2px 8px',borderRadius:4}}>HD</span>
        </div>
        <h1 style={{fontFamily:"'Bebas Neue'",fontSize:'clamp(26px,7vw,52px)',letterSpacing:1.5,lineHeight:1,marginBottom:6,textShadow:'0 2px 10px rgba(0,0,0,.9)'}}>{getTitle(item)}</h1>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,flexWrap:'wrap'}}>
          <span style={{display:'flex',alignItems:'center',gap:4}}><Ic.Star/><b style={{color:'#f5c518',fontSize:13}}>{getRating(item)}</b></span>
          <span style={{color:'rgba(255,255,255,.5)',fontSize:12}}>{getYear(item)}</span>
        </div>
        {item.overview && <p style={{color:'rgba(255,255,255,.68)',fontSize:12,lineHeight:1.55,maxWidth:340,marginBottom:14,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{item.overview}</p>}
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="btn" onClick={()=>onSelect(item)} style={{background:'#e50914',border:'none',color:'#fff',borderRadius:9,padding:'10px 22px',fontSize:13,fontWeight:800,display:'flex',alignItems:'center',gap:7,boxShadow:'0 4px 16px rgba(229,9,20,.5)'}}>
            <Ic.Play s={15}/> Watch Now
          </button>
          <button className="btn" onClick={()=>onToggleFav(item)} style={{background:'rgba(255,255,255,.1)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,.2)',color:'#fff',borderRadius:9,padding:'10px 16px',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:6}}>
            {isFav?<Ic.Check/>:<Ic.Plus/>}{isFav?'Saved':'My List'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────
function Grid({ items, loading, onSelect, favorites }) {
  if (loading) return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(108px,1fr))',gap:13,padding:'0 16px'}}>
      {Array(18).fill(0).map((_,i)=><Skel key={i} h={168}/>)}
    </div>
  );
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(108px,1fr))',gap:13,padding:'0 16px'}}>
      {(items||[]).filter(i=>i.poster_path).map(it=>(
        <Card key={`${it.id}-${it.media_type||''}`} item={it} onSelect={onSelect} isFav={(favorites||[]).some(f=>f.id===it.id)}/>
      ))}
    </div>
  );
}

// ─── Genre chips ──────────────────────────────────────────────────────────────
function Chips({ genres, active, onSelect }) {
  return (
    <div className="scroll-x" style={{display:'flex',gap:7,padding:'0 16px 4px'}}>
      <button className={`btn ${!active?'chip-active':'chip-inactive'}`} onClick={()=>onSelect(null)} style={{border:'1px solid',borderRadius:20,padding:'5px 14px',fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>All</button>
      {genres.map(g=>(
        <button key={g.id} className={`btn ${active===g.id?'chip-active':'chip-inactive'}`} onClick={()=>onSelect(g.id)} style={{border:'1px solid',borderRadius:20,padding:'5px 14px',fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}>{g.name}</button>
      ))}
    </div>
  );
}

// ─── No API key banner ────────────────────────────────────────────────────────
function NoKey() {
  return (
    <div style={{margin:20,padding:22,background:'linear-gradient(135deg,#1a0808,#0d0d14)',border:'1px solid rgba(229,9,20,.25)',borderRadius:14,animation:'fadeUp .5s ease'}}>
      <div style={{fontSize:34,marginBottom:10}}>🔑</div>
      <h3 style={{fontFamily:"'Bebas Neue'",fontSize:22,letterSpacing:1,marginBottom:8}}>TMDB API Key Required</h3>
      <p style={{color:'rgba(255,255,255,.55)',fontSize:13,lineHeight:1.65,marginBottom:16}}>Add your free TMDB key to load real movies & shows.</p>
      <div style={{background:'rgba(0,0,0,.4)',borderRadius:9,padding:14,fontSize:12,color:'rgba(255,255,255,.65)',lineHeight:1.9}}>
        <b style={{color:'#fff'}}>Steps (from your phone):</b><br/>
        1. Visit <b>themoviedb.org</b> → sign up free<br/>
        2. Settings → API → Create → Developer<br/>
        3. Copy your <b>v3 API Key</b><br/>
        4. Vercel → Project → Settings → <b>Environment Variables</b><br/>
        5. Add: <code style={{color:'#e50914',background:'rgba(229,9,20,.12)',padding:'1px 6px',borderRadius:4}}>VITE_TMDB_KEY</code> = your key<br/>
        6. Click <b>Redeploy</b> ✅
      </div>
    </div>
  );
}

// ─── Paginator ────────────────────────────────────────────────────────────────
function Pager({ page, totalPages, onPrev, onNext }) {
  return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:10,padding:'16px 16px 28px'}}>
      <button className="btn" onClick={onPrev} disabled={page===1} style={{background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',color:'#fff',borderRadius:8,padding:'8px 14px',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:5,opacity:page===1?.4:1}}><Ic.ChevL/> Prev</button>
      <span style={{background:'#e50914',color:'#fff',borderRadius:8,padding:'8px 14px',fontSize:13,fontWeight:800}}>Page {page}</span>
      <button className="btn" onClick={onNext} disabled={page>=totalPages} style={{background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',color:'#fff',borderRadius:8,padding:'8px 14px',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:5,opacity:page>=totalPages?.4:1}}>Next <Ic.ChevR/></button>
    </div>
  );
}

// ─── Pages ────────────────────────────────────────────────────────────────────
function HomePage({ onSelect, onToggleFav, favorites, hasKey }) {
  const [hero,     setHero]  = useState(null);
  const [data,     setData]  = useState({});
  const [loading,  setLoad]  = useState(true);
  useEffect(()=>{
    if (!hasKey) { setLoad(false); return; }
    Promise.all([getTrending('week'),getPopularMovies(),getTopMovies(),getNowPlaying(),getPopularShows(),getTopShows(),getAiringToday()])
      .then(([tr,pm,tm,np,ps,ts,at])=>{
        const all = tr?.results||[];
        setHero(all.find(r=>r.backdrop_path)||all[0]||null);
        setData({ trending:all, movies:pm?.results||[], topMovies:tm?.results||[], nowPlaying:np?.results||[], shows:ps?.results||[], topShows:ts?.results||[], airing:at?.results||[] });
        setLoad(false);
      });
  },[hasKey]);
  if (!hasKey) return <NoKey/>;
  return (
    <div style={{animation:'fadeUp .4s ease'}}>
      <Hero item={hero} onSelect={onSelect} onToggleFav={onToggleFav} isFav={(favorites||[]).some(f=>f.id===hero?.id)}/>
      <div style={{paddingTop:16}}>
        <Row label="🔥 Trending"            items={data.trending}   loading={loading} onSelect={onSelect} favorites={favorites}/>
        <Row label="🎬 Popular Movies"      items={data.movies}     loading={loading} onSelect={onSelect} favorites={favorites}/>
        <Row label="📺 Popular TV Shows"    items={data.shows}      loading={loading} onSelect={onSelect} favorites={favorites}/>
        <Row label="⭐ Top Rated Movies"    items={data.topMovies}  loading={loading} onSelect={onSelect} favorites={favorites}/>
        <Row label="🏆 Top Rated Shows"     items={data.topShows}   loading={loading} onSelect={onSelect} favorites={favorites}/>
        <Row label="🎞️ Now Playing"         items={data.nowPlaying} loading={loading} onSelect={onSelect} favorites={favorites}/>
        <Row label="📡 Airing Today"        items={data.airing}     loading={loading} onSelect={onSelect} favorites={favorites}/>
      </div>
    </div>
  );
}

function MoviesPage({ onSelect, favorites, hasKey }) {
  const [genres,  setGenres] = useState([]);
  const [genre,   setGenre]  = useState(null);
  const [items,   setItems]  = useState([]);
  const [page,    setPage]   = useState(1);
  const [total,   setTotal]  = useState(1);
  const [loading, setLoad]   = useState(true);
  useEffect(()=>{ if(hasKey) getMovieGenres().then(d=>setGenres(d?.genres||[])); },[hasKey]);
  useEffect(()=>{
    if (!hasKey) { setLoad(false); return; }
    setLoad(true);
    (genre ? getMoviesByGenre(genre,page) : getPopularMovies(page)).then(d=>{ setItems(d?.results||[]); setTotal(Math.min(d?.total_pages||1,50)); setLoad(false); });
  },[hasKey,genre,page]);
  if (!hasKey) return <NoKey/>;
  return (
    <div style={{animation:'fadeUp .4s ease',paddingTop:16}}>
      <div style={{padding:'0 16px 12px'}}><h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:1.5}}><span style={{color:'#e50914'}}>FREE</span> MOVIES</h1></div>
      <div style={{marginBottom:14}}><Chips genres={genres} active={genre} onSelect={g=>{setGenre(g);setPage(1);}}/></div>
      <Grid items={items} loading={loading} onSelect={onSelect} favorites={favorites}/>
      <Pager page={page} totalPages={total} onPrev={()=>setPage(p=>Math.max(1,p-1))} onNext={()=>setPage(p=>Math.min(total,p+1))}/>
    </div>
  );
}

function ShowsPage({ onSelect, favorites, hasKey }) {
  const [genres,  setGenres] = useState([]);
  const [genre,   setGenre]  = useState(null);
  const [items,   setItems]  = useState([]);
  const [page,    setPage]   = useState(1);
  const [total,   setTotal]  = useState(1);
  const [loading, setLoad]   = useState(true);
  useEffect(()=>{ if(hasKey) getTVGenres().then(d=>setGenres(d?.genres||[])); },[hasKey]);
  useEffect(()=>{
    if (!hasKey) { setLoad(false); return; }
    setLoad(true);
    (genre ? getShowsByGenre(genre,page) : getPopularShows(page)).then(d=>{ setItems(d?.results||[]); setTotal(Math.min(d?.total_pages||1,50)); setLoad(false); });
  },[hasKey,genre,page]);
  if (!hasKey) return <NoKey/>;
  return (
    <div style={{animation:'fadeUp .4s ease',paddingTop:16}}>
      <div style={{padding:'0 16px 12px'}}><h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:1.5}}><span style={{color:'#e50914'}}>FREE</span> TV SHOWS</h1></div>
      <div style={{marginBottom:14}}><Chips genres={genres} active={genre} onSelect={g=>{setGenre(g);setPage(1);}}/></div>
      <Grid items={items} loading={loading} onSelect={onSelect} favorites={favorites}/>
      <Pager page={page} totalPages={total} onPrev={()=>setPage(p=>Math.max(1,p-1))} onNext={()=>setPage(p=>Math.min(total,p+1))}/>
    </div>
  );
}

function MyListPage({ onSelect, onToggleFav, favorites }) {
  return (
    <div style={{animation:'fadeUp .4s ease',paddingTop:16}}>
      <div style={{padding:'0 16px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:1.5}}>MY <span style={{color:'#e50914'}}>LIST</span></h1>
        <span style={{color:'rgba(255,255,255,.4)',fontSize:13}}>{favorites.length} saved</span>
      </div>
      {favorites.length===0
        ? <div style={{textAlign:'center',padding:'70px 20px'}}>
            <div style={{fontSize:50,marginBottom:12}}>🎬</div>
            <h3 style={{fontWeight:700,fontSize:17,marginBottom:8}}>Nothing saved yet</h3>
            <p style={{color:'rgba(255,255,255,.4)',fontSize:13,lineHeight:1.6}}>Tap <b>+</b> on any movie or show to save it here</p>
          </div>
        : <Grid items={favorites} loading={false} onSelect={onSelect} favorites={favorites}/>
      }
    </div>
  );
}

// ─── Install banner ───────────────────────────────────────────────────────────
function InstallBanner({ prompt, onDismiss }) {
  if (!prompt) return null;
  return (
    <div style={{position:'fixed',bottom:16,left:12,right:12,zIndex:800,background:'#181824',border:'1px solid rgba(229,9,20,.35)',borderRadius:14,padding:'13px 14px',display:'flex',alignItems:'center',gap:12,boxShadow:'0 8px 36px rgba(0,0,0,.75)',animation:'fadeUp .4s ease'}}>
      <img src="/icons/icon-72.png" alt="OnStream" style={{width:46,height:46,borderRadius:10,flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:800,fontSize:14}}>Install OnStream</div>
        <div style={{color:'rgba(255,255,255,.5)',fontSize:12}}>Add to home screen · Works offline</div>
      </div>
      <div style={{display:'flex',gap:6,flexShrink:0}}>
        <button className="btn" onClick={onDismiss} style={{background:'rgba(255,255,255,.08)',border:'none',color:'#fff',borderRadius:7,padding:'7px 10px',fontSize:12}}>Later</button>
        <button className="btn" onClick={()=>{prompt.prompt();onDismiss();}} style={{background:'#e50914',border:'none',color:'#fff',borderRadius:7,padding:'7px 14px',fontSize:12,fontWeight:800}}>Install</button>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  injectStyles();

  const [tab,       setTab]    = useState('home');
  const [playing,   setPlaying]= useState(null);
  const [favorites, setFavs]   = useLocalStorage('onstream_favs_v3', []);
  const [toast,     setToast]  = useState('');
  const [searchQ,   setSearchQ]= useState('');
  const [searchRes, setSearchR]= useState([]);
  const [searchLoad,setSrchLd] = useState(false);
  const [offline,   setOffline]= useState(!navigator.onLine);
  const [installP,  setInstallP]= useState(null);
  const [showInst,  setShowInst]= useState(false);

  const hasKey = Boolean(import.meta.env.VITE_TMDB_KEY);
  const [playerSettings, setPlayerSettings] = useLocalStorage('onstream_settings_v1', DEFAULT_SETTINGS);

  // Online/offline
  useEffect(()=>{
    const on=()=>setOffline(false), off=()=>setOffline(true);
    window.addEventListener('online',on); window.addEventListener('offline',off);
    return ()=>{ window.removeEventListener('online',on); window.removeEventListener('offline',off); };
  },[]);

  // PWA install
  useEffect(()=>{
    const h=e=>{e.preventDefault();setInstallP(e);setTimeout(()=>setShowInst(true),5000);};
    window.addEventListener('beforeinstallprompt',h);
    return ()=>window.removeEventListener('beforeinstallprompt',h);
  },[]);

  // Search debounce
  useEffect(()=>{
    if (!searchQ.trim()||!hasKey){setSearchR([]);return;}
    setSrchLd(true);
    const t=setTimeout(()=>{ searchAll(searchQ).then(d=>{setSearchR(d?.results||[]);setSrchLd(false);}); },380);
    return ()=>clearTimeout(t);
  },[searchQ,hasKey]);

  const toast_ = useCallback((msg)=>setToast(msg),[]);

  const toggleFav = useCallback((item)=>{
    setFavs(prev=>{
      const has=prev.some(f=>f.id===item.id);
      toast_(has?'Removed from My List':'Added to My List');
      return has ? prev.filter(f=>f.id!==item.id) : [{...item,media_type:getType(item)},...prev];
    });
  },[setFavs,toast_]);

  const handleSelect = useCallback((item)=>setPlaying({...item,media_type:getType(item)}),[]);
  const isSearching  = searchQ.length > 1;

  const TABS = [
    {id:'home',   label:'Home',     icon:<Ic.Home/>},
    {id:'movies', label:'Movies',   icon:<Ic.Film/>},
    {id:'shows',  label:'TV Shows', icon:<Ic.Tv/>},
    {id:'mylist', label:'My List',  icon:<Ic.Heart f={favorites.length>0}/>},
  ];

  return (
    <div style={{background:'#0a0a0f',minHeight:'100dvh',color:'#fff',fontFamily:"'DM Sans',sans-serif",display:'flex',flexDirection:'column'}}>

      {playing && <Player item={playing} onClose={()=>setPlaying(null)} onToggleFav={toggleFav} isFav={favorites.some(f=>f.id===playing.id)} settings={playerSettings} onSaveSettings={setPlayerSettings}/>}

      <Toast msg={toast} clear={()=>setToast('')}/>

      {/* Offline bar */}
      {offline && (
        <div style={{background:'rgba(220,38,38,.9)',padding:'5px 14px',display:'flex',alignItems:'center',justifyContent:'center',gap:7,fontSize:12,fontWeight:700,flexShrink:0}}>
          <Ic.WifiOff/> Offline — showing cached content
        </div>
      )}

      {/* Header */}
      <header style={{position:'sticky',top:0,zIndex:500,background:'rgba(10,10,15,.97)',backdropFilter:'blur(18px)',borderBottom:'1px solid rgba(255,255,255,.07)',flexShrink:0}}>
        {/* Logo row */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 16px 0'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <img src="/icons/icon-72.png" alt="OnStream" style={{width:26,height:26,borderRadius:6}} onError={e=>e.target.style.display='none'}/>
            <span style={{fontFamily:"'Bebas Neue'",fontSize:21,letterSpacing:3}}>ON<span style={{color:'#e50914'}}>STREAM</span></span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            {offline && <Ic.WifiOff/>}
            <span style={{background:'rgba(74,222,128,.1)',border:'1px solid rgba(74,222,128,.25)',color:'#4ade80',fontSize:10,fontWeight:800,padding:'3px 8px',borderRadius:20,display:'flex',alignItems:'center',gap:4}}>
              <Ic.Shield/> Ad-free
            </span>
          </div>
        </div>

        {/* Search */}
        <div style={{padding:'8px 16px 0'}}>
          <div style={{display:'flex',alignItems:'center',background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,padding:'8px 12px',gap:8}}>
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={searchQ} onChange={e=>{setSearchQ(e.target.value);}}
              placeholder="Search movies & shows…"
              style={{background:'none',border:'none',color:'#fff',outline:'none',fontSize:14,width:'100%',fontFamily:"'DM Sans'"}}/>
            {searchQ && <button className="btn" onClick={()=>setSearchQ('')} style={{background:'none',border:'none',color:'rgba(255,255,255,.4)',padding:0,display:'flex'}}><Ic.X s={15}/></button>}
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',marginTop:2}}>
          {TABS.map(t=>(
            <button key={t.id} className={`btn ${tab===t.id?'tab-active':'tab-inactive'}`}
              onClick={()=>{setTab(t.id);setSearchQ('');}}
              style={{flex:1,background:'none',border:'none',color:'inherit',padding:'9px 4px 11px',display:'flex',flexDirection:'column',alignItems:'center',gap:3,fontSize:10,fontWeight:tab===t.id?800:500}}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main */}
      <main style={{flex:1,overflowY:'auto',overflowX:'hidden',paddingBottom:20}}>
        {/* Search results */}
        {isSearching && (
          <div style={{padding:'14px 0',animation:'fadeUp .3s ease'}}>
            <div style={{padding:'0 16px 10px'}}>
              <h2 style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:1}}>
                {searchLoad?'Searching…':`"${searchQ}" · ${searchRes.filter(r=>r.poster_path&&(r.media_type==='movie'||r.media_type==='tv')).length} results`}
              </h2>
            </div>
            <Grid items={searchRes.filter(r=>r.poster_path&&(r.media_type==='movie'||r.media_type==='tv'))} loading={searchLoad} onSelect={handleSelect} favorites={favorites}/>
          </div>
        )}

        {!isSearching && tab==='home'   && <HomePage   onSelect={handleSelect} onToggleFav={toggleFav} favorites={favorites} hasKey={hasKey}/>}
        {!isSearching && tab==='movies' && <MoviesPage onSelect={handleSelect} onToggleFav={toggleFav} favorites={favorites} hasKey={hasKey}/>}
        {!isSearching && tab==='shows'  && <ShowsPage  onSelect={handleSelect} onToggleFav={toggleFav} favorites={favorites} hasKey={hasKey}/>}
        {!isSearching && tab==='mylist' && <MyListPage onSelect={handleSelect} onToggleFav={toggleFav} favorites={favorites}/>}
      </main>

      {/* PWA install banner */}
      {showInst && <InstallBanner prompt={installP} onDismiss={()=>setShowInst(false)}/>}
    </div>
  );
}
