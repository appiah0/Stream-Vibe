# 🎬 OnStream v2 – Free Streaming PWA

Watch movies & TV shows **inside the app** (no redirects), download them, and use it offline — installable as a home screen app on Android & iOS.

---

## ✨ What's New in v2

- ▶️ **In-app player** — video plays inside OnStream, never redirects you elsewhere
- ⬇️ **Download button** — download any movie in 720p or 1080p
- 📱 **4 clean tabs** — Home · Movies · TV Shows · My List
- 🔌 **Offline support** — cached content works without internet
- 🔀 **7 servers** — auto-switch if one is down
- 📺 **Season/Episode picker** — full TV show episode navigation

---

## 🚀 Deploy (Mobile-friendly steps)

### 1. Get your FREE TMDB API key

1. Open [themoviedb.org](https://www.themoviedb.org) on your phone
2. Sign up (free) → tap your avatar → **Settings → API**
3. Tap **Create → Developer** → fill the short form
4. Copy your **API Key (v3 auth)** — a long string of letters/numbers

### 2. Upload to GitHub (from your phone)

1. Go to [github.com](https://github.com) → sign in → tap **+** → **New repository**
2. Name it `onstream` → tap **Create repository**
3. Unzip `onstream.zip` on your phone
4. In the repo, tap **Add file → Upload files**
5. Upload everything from the unzipped folder — all files and folders

### 3. Deploy on Vercel (from your phone)

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. Tap **Add New Project** → select `onstream` → tap **Import**
3. Find the **Environment Variables** section
4. Tap **Add** and enter:
   - **Name:** `VITE_TMDB_KEY`
   - **Value:** *(your TMDB API key)*
5. Tap **Deploy** 🚀

### 4. Install on your phone as an app

**Android (Chrome):**
- Open your Vercel URL
- Tap ⋮ menu → **Add to Home screen**
- Or tap the banner that auto-appears

**iPhone (Safari):**
- Open your Vercel URL in **Safari** (must be Safari, not Chrome)
- Tap the **Share** button (box with arrow)
- Scroll down → tap **Add to Home Screen**
- Tap **Add**

---

## 📁 Correct Folder Structure

```
onstream/
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   ├── icon-180.png
│   │   ├── icon-167.png
│   │   └── icon-152.png
│   └── favicon.ico
├── src/
│   ├── hooks/
│   │   └── useLocalStorage.js
│   ├── utils/
│   │   └── tmdb.js
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── README.md
├── vercel.json
└── vite.config.js
```

> ⚠️ Do NOT upload `node_modules/` or `.env` to GitHub

---

## ▶️ How the In-App Player Works

The player uses **iframe embeds** — the video loads inside the app, not in a new tab. If a server doesn't work:
1. Tap a different server button (VidSrc, AutoEmbed, 2Embed, etc.)
2. Or tap **"Next"** to cycle automatically

For TV shows, select the **Season** then the **Episode** below the player.

---

## ⬇️ How Downloads Work

1. While playing, tap the **DL** button (top right)
2. Choose **720p** or **1080p**
3. Tap the link → your browser's download manager handles it
4. On mobile, **long-press** the link and select **"Download link"**

---

## 📦 Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 | UI |
| Vite 5 | Build |
| vite-plugin-pwa | Service worker + manifest |
| Workbox | Offline caching |
| TMDB API | Movie/TV metadata |
| VidSrc/AutoEmbed/etc | In-app video embeds |

---

## 🔑 Environment Variables

| Variable | Where to set | Description |
|----------|-------------|-------------|
| `VITE_TMDB_KEY` | Vercel dashboard | Your free TMDB v3 API key |

Never put your API key in a file you upload to GitHub.
