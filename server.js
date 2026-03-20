require("dotenv").config();
const express = require("express");
const app = express();
let token = null;

async function login() {
  const body = new URLSearchParams({
    grant_type: "password",
    username: process.env.MANGADEX_USER,
    password: process.env.MANGADEX_PASS,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
  });

  const res = await fetch(
    "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body,
    },
  );

  const data = await res.json();

  if (!data.access_token) {
    throw new Error("Authentication failed");
  }

  token = data.access_token;
  console.log("✓ Token OK");
}

app.get("/popular", async (req, res) => {
  try {
    if (!token) await login();
    const r = await fetch(
      `https://api.mangadex.org/manga?limit=24&includes[]=cover_art&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await r.json();
    if (!r.ok) {
      token = null;
      return res.status(r.status).json(data);
    }
    res.json(data);
  } catch (e) {
    token = null;
    res.status(500).json({ error: e.message });
  }
});

app.get("/search", async (req, res) => {
  if (!token) await login();
  const q = req.query.q;
  const r = await fetch(`https://api.mangadex.org/manga?title=${q}&limit=20&includes[]=cover_art`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  res.json(await r.json());
});

app.get("/chapters/:mangaId", async (req, res) => {
  if (!token) await login();
  const offset = req.query.offset || 0;
  const lang = req.query.lang || 'en';

  const translatedLang = lang === 'pt-br' ? 'pt-br' : 'en';

  const r = await fetch(
    `https://api.mangadex.org/manga/${req.params.mangaId}/feed?translatedLanguage[]=${translatedLang}&order[chapter]=asc&limit=100&offset=${offset}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  res.json(await r.json());
});

app.get("/pages/:chapterId", async (req, res) => {
  const r = await fetch(`https://api.mangadex.org/at-home/server/${req.params.chapterId}`);
  res.json(await r.json());
});

app.get("/image-proxy", async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).json({ error: 'URL required' });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://mangadex.org/'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }

    const buffer = await response.arrayBuffer();
    res.set('Content-Type', response.headers.get('content-type'));
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({ error: 'Proxy error' });
  }
});

app.use(express.static("public"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
