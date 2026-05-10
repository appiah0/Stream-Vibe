# 🎬 OnStream – Free Streaming PWA

A full-featured streaming discovery app built with **React + Vite**, deployable to **Vercel**, installable as a **PWA** (Progressive Web App) — works like a native app on Android & iOS.

> **Disclaimer:** This project is for educational/demo purposes only. It uses the free TMDB API for metadata and embeds publicly available third-party player services. It does not host any video content.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔍 **Universal Search** | Searches across all movies & TV shows via TMDB API |
| 📡 **7 Embed Servers** | VidSrc, VidSrc2, 2Embed, AutoEmbed, VidLink, EmbedSu + auto-retry |
| 🎬 **Movies & TV Shows** | Trending, Popular, Top Rated, Now Playing, Airing Today |
| 📺 **Season/Episode Selector** | Full episode picker for every TV show |
| 🎭 **Genre Filtering** | Filter by any genre with pagination |
| ❤️ **My List** | Save favorites (persisted in localStorage) |
| 🕐 **Watch History** | Auto-tracks what you've watched |
| 🎞️ **Detail Modal** | Cast, trailers, similar titles, full info |
| 📲 **PWA / Install to Home Screen** | Works on Android, iOS, Desktop |
| 🌙 **Offline Support** | Caches API & images via Service Worker |
| 📱 **Mobile-first UI** | Bottom nav, safe areas, touch-optimized |

---

## 🚀 Quick Start

### 1. Get a free TMDB API key

1. Go to [https://www.themoviedb.org/signup](https://www.themoviedb.org/signup) and create a free account
2. Visit [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
3. Click **"Create"** → select **"Developer"** → fill the form
4. Copy your **API Key (v3 auth)**

### 2. Clone & run locally

```bash
git clone https://github.com/YOUR_USERNAME/onstream.git
cd onstream
npm install

# Create your env file
cp .env.example .env
# Edit .env and paste your TMDB key:
# VITE_TMDB_API_KEY=your_key_here

npm run dev
# → Open http://localhost:5173
```

---

## 📤 Deploy to GitHub + Vercel

### Step 1 – Push to GitHub

```bash
# In your project folder
git init
git add .
git commit -m "🎬 Initial OnStream PWA"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/onstream.git
git branch -M main
git push -u origin main
```

### Step 2 – Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `onstream` repository
4. In **"Environment Variables"**, add:
   - **Name:** `VITE_TMDB_API_KEY`
   - **Value:** `your_tmdb_api_key_here`
5. Click **"Deploy"** 🚀

Vercel auto-detects Vite. Your app will be live at `https://onstream-xxx.vercel.app`

### Step 3 – Custom Domain (optional)

In Vercel → Project → Settings → Domains → Add your domain.

---

## 📲 Install as App (PWA)

### Android (Chrome)
1. Open your deployed URL in Chrome
2. Tap the **⋮ menu** → **"Add to Home screen"**
3. Or tap the **install banner** that appears automatically

### iOS (Safari)
1. Open your deployed URL in Safari
2. Tap the **Share button** (box with arrow)
3. Scroll down → tap **"Add to Home Screen"**
4. Tap **"Add"**

### Desktop (Chrome/Edge)
- Click the **install icon** in the address bar
- Or: Menu → "Install OnStream"

---

## 🗂️ Project Structure

```
onstream/
├── public/
│   ├── icon.svg            # App icon source
│   ├── icon-192.png        # PWA icon (replace with real PNG)
│   ├── icon-512.png        # PWA icon (replace with real PNG)
│   └── apple-touch-icon.png
├── src/
│   ├── App.jsx             # Main app (all UI + logic)
│   ├── main.jsx            # React entry point
│   ├── utils/
│   │   └── tmdb.js         # TMDB API + embed sources
│   └── hooks/
│       └── useLocalStorage.js
├── index.html              # HTML shell + PWA meta tags
├── vite.config.js          # Vite + PWA plugin config
├── vercel.json             # Vercel SPA routing
├── .env.example            # Environment variable template
└── package.json
```

---

## 🎭 Embed Servers

The app tries these servers in order. If one fails, tap **"Try Next"**:

| # | Server | Movie URL Pattern |
|---|---|---|
| 1 | VidSrc | `vidsrc.xyz/embed/movie/{id}` |
| 2 | VidSrc2 | `vidsrc.to/embed/movie/{id}` |
| 3 | 2Embed | `2embed.org/embed/{id}` |
| 4 | 2Embed Alt | `2embed.cc/embed/{id}` |
| 5 | AutoEmbed | `autoembed.co/movie/tmdb/{id}` |
| 6 | VidLink | `vidlink.pro/movie/{id}` |
| 7 | EmbedSu | `embed.su/embed/movie/{id}` |

---

## 🔧 Adding Real PWA Icons

Replace the placeholder SVG with real PNG icons for best results:

1. Design a 1024×1024 PNG icon
2. Use [https://www.pwabuilder.com/imageGenerator](https://www.pwabuilder.com/imageGenerator) to generate all sizes
3. Place the generated files in `/public/`:
   - `icon-192.png`
   - `icon-512.png`
   - `apple-touch-icon.png` (180×180)

---

## 📦 Tech Stack

- **React 18** – UI framework
- **Vite 5** – Build tool
- **vite-plugin-pwa** – Service worker + manifest generation
- **Workbox** – Offline caching strategies
- **TMDB API** – Movie/TV metadata (free tier)
- **VidSrc / 2Embed / AutoEmbed** – Third-party embed players

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_TMDB_API_KEY` | ✅ Yes | Your TMDB v3 API key |

---

## 📄 License

MIT — Free to use and modify for personal/educational purposes.

Movie data provided by [TMDb](https://www.themoviedb.org/). This product uses the TMDb API but is not endorsed or certified by TMDb.
