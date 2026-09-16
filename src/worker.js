const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const LOGIN_RETRIES = 3;

let token = null;

async function loginOnce(env) {
  const body = new URLSearchParams({
    grant_type: "password",
    username: env.MANGADEX_USER,
    password: env.MANGADEX_PASS,
    client_id: env.CLIENT_ID,
    client_secret: env.CLIENT_SECRET,
  });

  const res = await fetch(
    "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body,
    },
  );

  const data = await res.json();

  if (!data.access_token) {
    console.error("Login failed, MangaDex response:", data);
    throw new Error("Authentication failed");
  }

  token = data.access_token;
  console.log("Token OK");
}

async function login(env) {
  let lastError;
  for (let attempt = 1; attempt <= LOGIN_RETRIES; attempt++) {
    try {
      await loginOnce(env);
      return;
    } catch (e) {
      lastError = e;
      console.error(`Login attempt ${attempt}/${LOGIN_RETRIES} failed:`, e.message);
    }
  }
  throw lastError;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handlePopular(env) {
  try {
    if (!token) await login(env);
    const r = await fetch(
      `https://api.mangadex.org/manga?limit=24&includes[]=cover_art&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive`,
      { headers: { Authorization: `Bearer ${token}`, "User-Agent": USER_AGENT } },
    );
    const data = await r.json();
    if (!r.ok) {
      token = null;
      return json(data, r.status);
    }
    return json(data);
  } catch (e) {
    console.error("Error on /popular:", e);
    token = null;
    return json({ error: e.message }, 500);
  }
}

async function handleSearch(env, url) {
  try {
    if (!token) await login(env);
    const q = url.searchParams.get("q") || "";
    const r = await fetch(
      `https://api.mangadex.org/manga?title=${encodeURIComponent(q)}&limit=20&includes[]=cover_art`,
      { headers: { Authorization: `Bearer ${token}`, "User-Agent": USER_AGENT } },
    );
    return json(await r.json());
  } catch (e) {
    console.error("Error on /search:", e);
    token = null;
    return json({ error: e.message }, 500);
  }
}

async function handleChapters(env, mangaId, url) {
  try {
    if (!token) await login(env);
    const offset = url.searchParams.get("offset") || 0;
    const lang = url.searchParams.get("lang") || "pt-br";
    const translatedLang = lang === "en" ? "en" : "pt-br";

    const r = await fetch(
      `https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=${translatedLang}&order[chapter]=asc&limit=100&offset=${offset}`,
      { headers: { Authorization: `Bearer ${token}`, "User-Agent": USER_AGENT } },
    );
    return json(await r.json());
  } catch (e) {
    console.error("Error on /chapters:", e);
    token = null;
    return json({ error: e.message }, 500);
  }
}

async function handlePages(chapterId) {
  const r = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
  return json(await r.json());
}

async function handleImageProxy(url) {
  const imageUrl = url.searchParams.get("url");
  if (!imageUrl) return json({ error: "URL required" }, 400);

  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: "https://mangadex.org/",
      },
    });

    if (!response.ok) {
      return json({ error: "Failed to fetch image" }, response.status);
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return json({ error: "Proxy error" }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/popular") return handlePopular(env);
    if (path === "/search") return handleSearch(env, url);

    const chaptersMatch = path.match(/^\/chapters\/([^/]+)$/);
    if (chaptersMatch) return handleChapters(env, chaptersMatch[1], url);

    const pagesMatch = path.match(/^\/pages\/([^/]+)$/);
    if (pagesMatch) return handlePages(pagesMatch[1]);

    if (path === "/image-proxy") return handleImageProxy(url);

    return env.ASSETS.fetch(request);
  },
};
