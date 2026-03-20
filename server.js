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
  if (!token) await login();
  const r = await fetch(
    `https://api.mangadex.org/manga?limit=24&includes[]=cover_art&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  res.json(await r.json());
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

app.use(express.static("public"));
app.listen(3000, () => console.log("http://localhost:3000"));
