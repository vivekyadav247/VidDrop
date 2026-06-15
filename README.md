# VidDrop 🚀

VidDrop is a premium web application designed to fetch metadata and download public video or audio from supported platforms (like YouTube, Vimeo, Instagram, TikTok, and more) using `yt-dlp`. 

Featuring a highly polished, responsive **glassmorphism SaaS dark-themed UI** and a custom **Server-Sent Events (SSE) progress system**, this project is built entirely from scratch using pure vanilla technologies.

---

## Key Features

- **Premium SaaS UI**: Vibrant gradient accent colors, smooth element micro-animations, glassmorphic overlays, and fully responsive CSS grid layout.
- **Smart Quality Presets**: Dynamically identifies available resolutions (144p, 360p, 480p, 720p, 1080p) based on video metadata and generates custom format cards.
- **MP3 Audio Extraction**: Extract and convert media files directly to high-quality MP3 audio files on the fly.
- **Real-time SSE Progress System**: Streams percentage completions, downloading speed, ETA, processing, and merging states directly to the client without page reload or polling.
- **Robust Temporary File Sweeper**: Automatically clears media assets immediately after transmission to the client, backed by a 15-minute background filesystem sweep.
- **Enterprise-Grade Security**: Employs strictly bounded URL sanitization (using `new URL()`), rate limiting on API endpoints to prevent server abuse, and runs yt-dlp safely to prevent shell command injection.
- **Extra Client Perks**: Keyboard shortcuts, clipboard auto-paste, drag-and-drop URL drops, localStorage history records, and a light/dark theme toggle.

---

## Tech Stack

### Frontend
- **HTML5**: Semantic tags, drag-and-drop APIs, custom toast containers.
- **CSS3**: Custom HSL variables, fluid Flexbox/Grid layouts, glassmorphism filters, keyframe shimmers, and slide-in animations.
- **JavaScript (Vanilla)**: Modular event-driven architecture, Fetch API, EventSource interface.
- **Lucide Icons**: Modern line icons loaded via CDN.

### Backend
- **Node.js**: Asynchronous file/directory sweeping and child process management.
- **Express.js**: Rate limits, static routes, HTTP streaming headers, and robust error handlers.
- **yt-dlp-exec**: Serves as the wrapper to execute `yt-dlp` commands on the host machine.
- **CORS & Helmet**: Security headers and cross-origin resource protection.

---

## Prerequisites & Installation

### 1. Node.js
Ensure you have **Node.js (v18+)** installed. Check your version with:
```bash
node -v
```

### 2. FFmpeg (Crucial for Video Merging and MP3 Conversion)
FFmpeg is required to merge separate high-definition video and audio streams (like 1080p) or extract audio format conversions. 

- **Windows**:
  1. Download the FFmpeg release build from [Gyan.dev](https://www.gyan.dev/ffmpeg/builds/).
  2. Extract the folder to a permanent path (e.g., `C:\ffmpeg`).
  3. Add the `C:\ffmpeg\bin` folder to your System Environment variables **Path**.
  4. Verify installation by running:
     ```bash
     ffmpeg -version
     ```
- **macOS**:
  ```bash
  brew install ffmpeg
  ```
- **Linux**:
  ```bash
  sudo apt update && sudo apt install ffmpeg
  ```

*Note: If FFmpeg is missing, the server will automatically download a combined pre-merged format or fall back gracefully, streaming raw formats (like `.m4a` or `.webm` audio) to the client with a warning instead of failing.*

### 3. yt-dlp Binary
The `yt-dlp-exec` library handles downloading the `yt-dlp` binary programmatically during the installation process (`npm install`). However, you must make sure Node.js has network/filesystem permissions to execute it.

---

## Getting Started

Follow these two simple steps to run the application locally:

### 1. Install Dependencies
Run this command in the project root directory:
```bash
npm install
```

### 2. Launch the Server
Start the Express server:
```bash
npm start
```
The server will boot up, sweep any orphaned assets inside the downloads directory, and run the server at:
👉 **[http://localhost:5000](http://localhost:5000)**

---

## API Endpoints

### 1. `POST /api/info`
Fetches metadata and formats list for a URL.
- **Request Body**:
  ```json
  { "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
  ```
- **Response**:
  ```json
  {
    "metadata": {
      "title": "Rick Astley - Never Gonna Give You Up (Official Music Video)",
      "uploader": "Rick Astley",
      "duration": "3:33",
      "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "views": "1,524,312,987",
      "platform": "Youtube"
    },
    "formats": [
      { "id": "best", "label": "Best Quality", "type": "video", "ext": "mp4" },
      { "id": "1080p", "label": "1080p Full HD", "type": "video", "ext": "mp4" },
      ...
      { "id": "mp3", "label": "Audio Only (MP3)", "type": "audio", "ext": "mp3" }
    ]
  }
  ```

### 2. `POST /api/download`
Initializes a media download process on the backend.
- **Request Body**:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "quality": "1080p",
    "title": "Rick Astley - Never Gonna Give You Up",
    "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
  }
  ```
- **Response**:
  ```json
  { "downloadId": "4a5bc9-d8e2-411a-88bc-b12e690a" }
  ```

### 3. `GET /api/download/progress/:id`
Establishes a Server-Sent Events (SSE) connection to track download percentage and download speed.
- **Yields events**:
  - `downloading`: `{ "status": "downloading", "progress": 42.5, "speed": "1.2MB/s", "eta": "00:15", "size": "15.4MB" }`
  - `merging`: `{ "status": "merging", "progress": 99 }`
  - `completed`: `{ "status": "completed", "progress": 100, "filename": "Rick_Astley_-_Never_Gonna_Give_You_Up.mp4" }`
  - `error`: `{ "status": "error", "message": "FFmpeg merge failed." }`

### 4. `POST /api/download/cancel/:id`
Stops the `yt-dlp` download process and deletes any partial temporary files.

### 5. `GET /api/download/file/:id`
Streams the completed media download to the client's web browser and deletes it from the server filesystem immediately.

### 6. `GET /health`
Verifies server health, uptime, and system time.

---

## Security Implementations

1. **Strict URL Constraints**: Rejects URLs that fail Javascript `new URL()` validation or use non-http(s) protocols. This blocks potential command injection strings.
2. **Safe Child Processes**: `yt-dlp-exec` utilizes `execFile` arguments underneath instead of invoking a terminal shell environment, completely preventing standard shell token injections.
3. **API Rate Limiting**: Limit general routes to 100 requests every 15 minutes, info metadata lookups to 10 queries per minute, and downloads to 5 sessions per minute per client IP.
4. **No Internal Path Leaks**: All client endpoints interface via UUID tokens (`downloadId`) rather than exposing local server paths, folder names, or environment paths.

---

# 📦 VidDrop — Backend Documentation

Yeh document **VidDrop** ke backend ka poora code explain karta hai. Isko padhke tum samjh sakte ho ki server kaise kaam karta hai, kaunse endpoints hain, aur data ka flow kaisa hai.

---

## 🗂️ Folder Structure

```
VidDrop/
├── client/                       ← React Frontend
├── server/                       ← Express Backend
│   ├── index.js                  ← Server entry point (Express app)
│   ├── routes/
│   │   └── api.js                ← API endpoints define karta hai
│   ├── controllers/
│   │   └── mediaController.js    ← Request handle karta hai (logic)
│   ├── services/
│   │   └── ytDlpService.js       ← yt-dlp binary se baat karta hai
│   ├── utils/
│   │   └── fileHelper.js         ← File operations (create, delete, sweep)
│   └── downloads/                ← Temporary downloaded files yahaan aate hain
└── client/
    ├── index.html                ← Frontend HTML
    ├── style.css                 ← Frontend CSS
    └── app.js                    ← Frontend JS
```

---

## 📄 File-by-File Explanation

---

### 1. `server/index.js` — Server Entry Point

Yeh poore application ka **starting point** hai. `npm start` run karne par yahi file execute hoti hai.

```
User Browser
    │
    ▼
Express App (index.js)
    ├── Helmet (Security headers)
    ├── CORS (Cross-origin allow)
    ├── /health  → Health check endpoint
    ├── /api/*   → API routes (api.js)
    └── /        → Static frontend (client/ folder)
```

**Kya karta hai:**
- Express app banata hai aur port 5000 pe listen karta hai
- `helmet` middleware lagata hai jo HTTP security headers set karta hai (XSS protection, etc.)
- `cors` middleware allow karta hai ki frontend alag port se bhi API call kar sake
- `express.static('client/')` — frontend ke HTML/CSS/JS files serve karta hai
- Server start hote hi `downloads/` folder sweep karta hai (puraane temp files delete)
- Har 15 minute mein ek automated cleanup cron chalata hai jo 10 minute se puraane files delete karta hai

**Key code:**
```js
// Security
app.use(helmet({ contentSecurityPolicy: { ... } }));
app.use(cors());

// API routes
app.use('/api', apiRoutes);

// Frontend serve karo
app.use(express.static(path.join(__dirname, '..', 'client')));

// Startup cleanup
fileHelper.sweepDownloads(0);

// Periodic cleanup — har 15 min
setInterval(() => fileHelper.sweepDownloads(TEN_MINUTES), FIFTEEN_MINUTES);
```

---

### 2. `server/routes/api.js` — Route Definitions

Yeh file decide karti hai ki **kaunsa URL kaunse controller function ko call karega**.

```
POST   /api/info                     → getMediaInfo()
POST   /api/download                 → startDownload()
GET    /api/download/progress/:id    → getDownloadProgress()
POST   /api/download/cancel/:id      → cancelDownload()
GET    /api/download/file/:id        → deliverFile()
```

**Rate Limiting bhi yahan hota hai:**

| Limiter         | Window   | Max Requests | Endpoint          |
|-----------------|----------|--------------|-------------------|
| `generalLimiter`| 15 min   | 100 requests | Saare API routes  |
| `infoLimiter`   | 1 min    | 10 requests  | `/api/info`       |
| `downloadLimiter`| 1 min   | 5 requests   | `/api/download`   |

Rate limiting se koi user server ko spam nahi kar sakta — yeh `express-rate-limit` library se hota hai.

---

### 3. `server/controllers/mediaController.js` — Request Handler

Yeh file **request aur response ke beech ka logic** handle karti hai. Controller pattern: route sirf URL map karta hai, actual kaam controller karta hai.

---

#### `getMediaInfo(req, res)` — POST /api/info

**Kya karta hai:** User ke paste kiye URL ka metadata fetch karta hai.

**Flow:**
```
User sends URL
    ↓
URL validate karo (must be http/https)
    ↓
ytDlpService.fetchMetadata(url) call karo
    ↓
Quick preset formats banao:
  - Best Quality (mp4)
  - 1080p / 720p / 480p / 360p / 144p (jo available ho)
  - Audio Only (MP3)
    ↓
Raw stream list banao (Advanced Streams ke liye)
    ↓
JSON response return karo:
  { metadata, formats, rawFormats, ffmpegAvailable }
```

---

#### `startDownload(req, res)` — POST /api/download

**Kya karta hai:** Background mein download shuru karta hai aur turant ek `downloadId` return karta hai.

**Flow:**
```
User { url, quality, title, thumbnail } bhejta hai
    ↓
Validate URL + quality
    ↓
crypto.randomUUID() se unique downloadId banao
    ↓
EventEmitter banao (progress events ke liye)
    ↓
downloadState object banao aur activeDownloads Map mein store karo
    ↓
ytDlpService.downloadMedia() background mein start karo (async)
    ↓
Turant { downloadId } return karo (download wait nahi karta)
    ↓
Background mein:
  - Progress events emit hote hain
  - Complete hone par state update hoti hai
  - Error aane par state mein error save hoti hai
```

**`activeDownloads` Map:**
Yeh server ki memory mein ek Map hai jo har active download ka state store karta hai:
```js
activeDownloads = Map {
  "abc-123": {
    id, url, quality, status, progress,
    speed, eta, filePath, filename, emitter
  }
}
```

---

#### `getDownloadProgress(req, res)` — GET /api/download/progress/:id

**Kya karta hai:** **Server-Sent Events (SSE)** ke through real-time progress browser ko bhejta hai.

```
Browser SSE connection open karta hai
    ↓
Server headers set karta hai:
  Content-Type: text/event-stream
  Cache-Control: no-cache
  Connection: keep-alive
    ↓
Current state turant bhejo
    ↓
EventEmitter pe 'progress' event listen karo
    ↓
Jab bhi download progress update ho:
  res.write(`data: ${JSON.stringify(data)}\n\n`)
    ↓
Jab download complete/error/cancel ho:
  res.end() — connection band karo
    ↓
Har 15 second mein heartbeat bhejo (connection alive rakhne ke liye)
```

**SSE vs WebSocket:**
SSE one-way hai (server → browser), WebSocket two-way. Download progress ke liye SSE kaafi hai aur zyada simple hai.

---

#### `cancelDownload(req, res)` — POST /api/download/cancel/:id

**Kya karta hai:** Chal rahe download ko force-stop karta hai.

**Flow:**
```
downloadId se activeDownloads mein state dhundo
    ↓
yt-dlp child process ko SIGTERM signal bhejo (kill karo)
    ↓
'cancelled' event emit karo
    ↓
downloads/ folder se us ID ke files delete karo
    ↓
activeDownloads se remove karo
    ↓
{ message: 'Cancelled' } return karo
```

---

#### `deliverFile(req, res)` — GET /api/download/file/:id

**Kya karta hai:** Completed download ko browser ko stream karta hai (file download trigger hoti hai).

**Flow:**
```
downloadId se state lo
    ↓
State check karo: status === 'completed' AND filePath exist kare
    ↓
res.download(filePath, filename) — browser mein Save dialog open hoga
    ↓
File stream complete hone ke baad:
  - Server se temp file delete karo (fileHelper.deleteFile)
  - activeDownloads se remove karo
```

---

### 4. `server/services/ytDlpService.js` — yt-dlp Integration

Yeh file directly **yt-dlp binary se communicate** karti hai. Yeh backend ka sabse important service file hai.

---

#### FFmpeg Detection

```js
// ffmpeg-static npm package se bundled binary use karo
const ffmpegPath = require('ffmpeg-static');
// → C:\...\node_modules\ffmpeg-static\ffmpeg.exe
```

`ffmpeg-static` ek npm package hai jo FFmpeg binary ko bundle karta hai — koi system-level installation nahi chahiye. Yeh path yt-dlp ko `--ffmpeg-location` flag ke through bataya jaata hai.

---

#### `fetchMetadata(url)` — Video Info Fetch

```
yt-dlp --dump-single-json URL
    ↓
JSON parse karo
    ↓
Return: {
  title, uploader, duration, thumbnail,
  views, platform, maxHeight, formats[]
}
```

**Important flags:**
- `dumpSingleJson: true` — ek JSON output mein saari info do
- `noCheckCertificates: true` — SSL errors ignore karo
- `addHeader` — YouTube pe ban na jaao, realistic browser headers bhejo

---

#### `downloadMedia(downloadId, url, quality, emitter, formatType)` — Download

**Format selection logic:**

```
Quality 'mp3' ?
  ├── FFmpeg available → bestaudio + extractAudio mp3
  └── No FFmpeg → bestaudio/best (raw audio)

Quality '1080p'/'720p'/etc ?
  ├── FFmpeg available → bestvideo[height<=N]+bestaudio (merge kar)
  └── No FFmpeg → best[height<=N] (pre-merged stream)

Quality 'best' ?
  ├── FFmpeg available → bestvideo+bestaudio (merge kar)
  └── No FFmpeg → best

Raw format ID (Advanced Streams) ?
  ├── video-only + FFmpeg → formatId+bestaudio (merge)
  └── Otherwise → formatId as-is
```

**Progress parsing:**
yt-dlp stdout pe aise lines aati hain:
```
[download]  42.5% of 150.00MiB at 5.20MiB/s ETA 00:19
```
`parseProgressLine()` function regex se `percent`, `speed`, `eta`, `size` extract karta hai aur EventEmitter ke through controller ko bhejta hai.

**Output pattern:**
```js
output: path.join(DOWNLOADS_DIR, `${downloadId}.%(ext)s`)
// → downloads/abc-123.mp4
```

---

### 5. `server/utils/fileHelper.js` — File Management

Yeh utility file **downloads folder ke lifecycle** manage karti hai.

```
ensureDownloadsDir()  → downloads/ folder exist nahi to banao
deleteFile(filePath)  → ek specific file delete karo (safe)
sweepDownloads(maxAgeMs) → maxAgeMs se puraane saare files delete karo
DOWNLOADS_DIR         → downloads folder ka absolute path (export)
```

**`sweepDownloads(maxAgeMs)`:**
```
downloads/ folder ke saare files read karo
    ↓
Har file ke liye:
  file ki age = (current time) - (file ka mtime)
  age > maxAgeMs → delete karo
    ↓
Server startup pe: sweepDownloads(0) → saare files delete
Har 15 min pe: sweepDownloads(600000) → 10 min se puraane delete
```

---

## 🔄 Complete Download Flow — End to End

```
1. User URL paste karta hai
        │
        ▼
2. POST /api/info
   Controller → ytDlpService.fetchMetadata(url)
   yt-dlp binary run hoti hai → JSON output aata hai
   Response: { metadata, formats, rawFormats }
        │
        ▼
3. User quality select karta hai
        │
        ▼
4. POST /api/download  { url, quality }
   Controller → downloadId generate karo
   Background mein ytDlpService.downloadMedia() start karo
   Response: { downloadId }  ← turant milta hai
        │
        ▼
5. GET /api/download/progress/:downloadId  (SSE)
   Browser connection open rakhta hai
   Jab yt-dlp download karta hai:
     stdout parse → progress events → SSE se browser ko bhejo
   Browser: progress bar update karo
        │
        ▼
6. Download complete
   yt-dlp ne file save kar di: downloads/abc-123.mp4
   'completed' event emit → SSE se browser ko batao
        │
        ▼
7. GET /api/download/file/:downloadId
   Server file stream karta hai → browser mein Save dialog
   File deliver hone ke baad: temp file delete, Map se remove
```

---

## ⚙️ Environment & Config

| Config          | Value / Source         |
|-----------------|------------------------|
| Port            | `5000` (env: `PORT`)   |
| FFmpeg          | `ffmpeg-static` (bundled, koi install nahi chahiye) |
| yt-dlp          | `yt-dlp-exec` (bundled binary) |
| Download folder | `server/downloads/`    |
| Temp file TTL   | 10 minutes             |
| Rate limit (info)| 10 req/min            |
| Rate limit (download)| 5 req/min         |

---

## 📡 API Reference

| Method | Endpoint | Body / Params | Response |
|--------|----------|---------------|----------|
| `POST` | `/api/info` | `{ url }` | `{ metadata, formats, rawFormats, ffmpegAvailable }` |
| `POST` | `/api/download` | `{ url, quality, title, thumbnail, formatType }` | `{ downloadId }` |
| `GET`  | `/api/download/progress/:id` | — | SSE stream `{ status, progress, speed, eta, size }` |
| `POST` | `/api/download/cancel/:id` | — | `{ message }` |
| `GET`  | `/api/download/file/:id` | — | Binary file download |
| `GET`  | `/health` | — | `{ status, uptime, timestamp }` |

---

## 🛡️ Security Features

- **Helmet.js** — XSS, clickjacking, MIME sniffing protection
- **CORS** — controlled cross-origin access
- **URL Validation** — sirf `http://` aur `https://` URLs allow
- **Rate Limiting** — DDoS aur abuse se bachao
- **CSP Headers** — allowed script/style sources whitelist
- **Temp File Cleanup** — server pe files accumulate nahi hone deta

---

## 🚀 Run Karne Ka Tarika

```bash
# Dependencies install karo (ek baar)
npm install

# Server start karo
npm start

# Browser mein kholo
http://localhost:5000
```

> **Note:** FFmpeg aur yt-dlp dono npm packages ke through automatically bundle hote hain — koi alag se install nahi karna.
