# Mangadex Reader

A minimalist web application for reading manga from the MangaDex API with support for multiple languages.

[//]: # (**[🌐 Live Demo]&#40;https://mangadex-reader.onrender.com&#41;** • **[📱 Mobile Friendly]&#40;#interface&#41;** • **[🌍 Multilingual]&#40;#languages&#41;**)
# Mangadex Reader

A minimalist web application for reading manga from the MangaDex API with support for multiple languages.
**[🌐 Live Demo](https://mangadex-reader.onrender.com)** • **[📱 Mobile Friendly](#interface)** • **[🌍 Multilingual](#languages)**

---

## ✨ Features

- 🔍 **Real-time Search** — Search manga by title
- ⭐ **Popular** — Browse the most followed manga
- 📖 **Built-in Reader** — Two reading modes (page/scroll)
- 🎨 **Dark Mode** — Modern dark interface
- 🌍 **Multilingual** — Support for EN, PT-BR (easy to add more)
- 💾 **Local Persistence** — Resume where you left off
- 📱 **Responsive** — Works on desktop, tablet, and mobile
- ⌨️ **Keyboard Navigation** — Use arrow keys to switch pages

---

## 🚀 Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla JavaScript (zero dependencies)
- **API:** MangaDex v5
- **Deploy:** Render (free tier available)

---

## 🎯 How to Use

### Online (Recommended)
Visit: **https://mangadex-reader.onrender.com**

### Local

**Requirements:**
- Node.js 16+
- MangaDex credentials (username + password)

**Setup:**

```bash
# 1. Clone
git clone https://github.com/your-username/mangadex-reader.git
cd mangadex-reader

# 2. Install
npm install

# 3. Environment variables
cat > .env << EOF
MANGADEX_USER=your_username
MANGADEX_PASS=your_password
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
EOF

# 4. Run
npm start

# Open http://localhost:3000
```

---

## ⚙️ Configuration

### Environment Variables

```env
MANGADEX_USER      # Your MangaDex username
MANGADEX_PASS      # Your MangaDex password
CLIENT_ID          # Application ID (from MangaDex dev console)
CLIENT_SECRET      # Application secret
```

**How to get credentials:**
1. Create an account at https://mangadex.org
2. Go to Settings → Apps (if available) or use default credentials

---

## 📚 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /popular` | 24 most popular manga |
| `GET /search?q=term` | Search manga by title |
| `GET /chapters/:mangaId` | List chapters of a manga |
| `GET /pages/:chapterId` | Links to chapter pages |

---

## 🎨 Interface

### Reading Modes

- **Page Mode:** Click/arrows to navigate between pages
- **Scroll Mode:** Scroll normally (all pages loaded)

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` | Previous page |
| `→` | Next page |
| `Ctrl+F` | Search (browser) |

---

## 🌍 Languages

Supported:
- 🇬🇧 English
- 🇧🇷 Portuguese (Brazil)

**Add a new language:**

1. Create `public/locales/xx.json`:
```json
{
  "search_placeholder": "Search...",
  "search_button": "Search",
  "popular_title": "Popular",
  "loading": "Loading...",
  "chapter": "Chapter",
  "previous_button": "Previous",
  "next_button": "Next",
  "page_of": "Page {{current}} of {{total}}",
  "mode_page": "Page mode",
  "mode_scroll": "Scroll mode",
  "back_button": "Back",
  "chapters_button": "Chapters",
  "loading_chapters": "Loading chapters...",
  "chapters_title": "Chapters",
  "results_title": "Results",
  "error_loading": "Error loading",
  "no_title": "No title"
}
```

2. Update the select dropdown in HTML with the new option
3. Deploy!

---

## 🐛 Troubleshooting

### "Authentication failed"
- Check your MangaDex credentials in .env
- MangaDex might be offline (check mangadex.org status)

### Manga won't load
- It might be blocked in your country
- Try another manga first

### Scroll mode is slow
- Some chapters have 100+ pages
- Page mode is faster for those cases

---

## 📊 Performance

- **Frontend:** Zero dependencies (Vanilla JS)
- **Bundle size:** ~30KB (minified)
- **Load time:** <2s on 4G connection
- **Token cache:** Reduces authentication requests

---

## 📝 License

MIT — Use freely, give credit

---

## 🤝 Contributing

Issues and PRs are welcome!

```bash
git checkout -b feature/your-feature
git commit -am "Add: new feature"
git push origin feature/your-feature
```

---

## 📞 Contact

- GitHub Issues: For bugs and suggestions
- Discussions: For questions

---

## ⚡ Roadmap

- [ ] Automatic dark mode (by time)
- [ ] Synced favorites
- [ ] Cloud reading history
- [ ] Dual-page reader (spread)
- [ ] Chapter downloads

---

## 🙏 Acknowledgments

- [MangaDex API](https://api.mangadex.org) — Manga data
- [Render](https://render.com) — Free hosting

---

---

## ✨ Features

- 🔍 **Real-time Search** — Search manga by title
- ⭐ **Popular** — Browse the most followed manga
- 📖 **Built-in Reader** — Two reading modes (page/scroll)
- 🎨 **Dark Mode** — Modern dark interface
- 🌍 **Multilingual** — Support for EN, PT-BR (easy to add more)
- 💾 **Local Persistence** — Resume where you left off
- 📱 **Responsive** — Works on desktop, tablet, and mobile
- ⌨️ **Keyboard Navigation** — Use arrow keys to switch pages

---

## 🚀 Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla JavaScript (zero dependencies)
- **API:** MangaDex v5
- **Deploy:** Render (free tier available)

---

## 🎯 How to Use

### Online (Recommended)
Visit: **https://mangadex-reader.onrender.com**

### Local

**Requirements:**
- Node.js 16+
- MangaDex credentials (username + password)

**Setup:**

```bash
# 1. Clone
git clone https://github.com/your-username/mangadex-reader.git
cd mangadex-reader

# 2. Install
npm install

# 3. Environment variables
cat > .env << EOF
MANGADEX_USER=your_username
MANGADEX_PASS=your_password
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
EOF

# 4. Run
npm start

# Open http://localhost:3000
```

---

## ⚙️ Configuration

### Environment Variables

```env
MANGADEX_USER      # Your MangaDex username
MANGADEX_PASS      # Your MangaDex password
CLIENT_ID          # Application ID (from MangaDex dev console)
CLIENT_SECRET      # Application secret
```

**How to get credentials:**
1. Create an account at https://mangadex.org
2. Go to Settings → Apps (if available) or use default credentials

---

## 📚 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /popular` | 24 most popular manga |
| `GET /search?q=term` | Search manga by title |
| `GET /chapters/:mangaId` | List chapters of a manga |
| `GET /pages/:chapterId` | Links to chapter pages |

---

## 🎨 Interface

### Reading Modes

- **Page Mode:** Click/arrows to navigate between pages
- **Scroll Mode:** Scroll normally (all pages loaded)

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` | Previous page |
| `→` | Next page |
| `Ctrl+F` | Search (browser) |

---

## 🌍 Languages

Supported:
- 🇬🇧 English
- 🇧🇷 Portuguese (Brazil)

**Add a new language:**

1. Create `public/locales/xx.json`:
```json
{
  "search_placeholder": "Search...",
  "search_button": "Search",
  "popular_title": "Popular",
  "loading": "Loading...",
  "chapter": "Chapter",
  "previous_button": "Previous",
  "next_button": "Next",
  "page_of": "Page {{current}} of {{total}}",
  "mode_page": "Page mode",
  "mode_scroll": "Scroll mode",
  "back_button": "Back",
  "chapters_button": "Chapters",
  "loading_chapters": "Loading chapters...",
  "chapters_title": "Chapters",
  "results_title": "Results",
  "error_loading": "Error loading",
  "no_title": "No title"
}
```

2. Update the select dropdown in HTML with the new option
3. Deploy!

---

## 🐛 Troubleshooting

### "Authentication failed"
- Check your MangaDex credentials in .env
- MangaDex might be offline (check mangadex.org status)

### Manga won't load
- It might be blocked in your country
- Try another manga first

### Scroll mode is slow
- Some chapters have 100+ pages
- Page mode is faster for those cases

---

## 📊 Performance

- **Frontend:** Zero dependencies (Vanilla JS)
- **Bundle size:** ~30KB (minified)
- **Load time:** <2s on 4G connection
- **Token cache:** Reduces authentication requests

---

## 📝 License

MIT — Use freely, give credit

---

## 🤝 Contributing

Issues and PRs are welcome!

```bash
git checkout -b feature/your-feature
git commit -am "Add: new feature"
git push origin feature/your-feature
```

---

## 📞 Contact

- GitHub Issues: For bugs and suggestions
- Discussions: For questions

---

## ⚡ Roadmap

- [ ] Automatic dark mode (by time)
- [ ] Synced favorites
- [ ] Cloud reading history
- [ ] Dual-page reader (spread)
- [ ] Chapter downloads

---

## 🙏 Acknowledgments

- [MangaDex API](https://api.mangadex.org) — Manga data
- [Render](https://render.com) — Free hosting

---
