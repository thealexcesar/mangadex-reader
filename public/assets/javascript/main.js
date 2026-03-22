/**
 * Mangadex Reader — Main Application Logic
 */

// ============================================================================
// STATE
// ============================================================================

const state = {
  chapters: [],
  currentManga: null,
  currentChapter: null,
  currentPages: [],
  currentPageIndex: 0,
  scrollMode: localStorage.getItem('scrollMode') === 'true',
  currentLang: localStorage.getItem('language') || 'en',
  translations: {},
  flipping: false,
};

// ============================================================================
// CONSTANTS
// ============================================================================

const SWIPE_THRESHOLD = 50;
const FLIP_EXIT_MS = 350;
const PLACEHOLDER_DELAY_MS = 3000;
const CHAPTERS_LIMIT = 100;

// ============================================================================
// SVG PLACEHOLDER (manga-themed panels)
// ============================================================================
const MANGA_PLACEHOLDER_SVG = `<img class="placeholder-svg" src="/assets/image/placeholder.svg" alt="">`;

// ============================================================================
// TRANSLATIONS
// ============================================================================

async function loadTranslations(lang) {
  try {
    const res = await fetch(`/locales/${lang}.json`);
    state.translations = await res.json();
    applyTranslations();
  } catch (e) {
    console.error('Error loading translations:', e);
  }
}

function t(key, params = {}) {
  let text = state.translations[key] || key;
  Object.entries(params).forEach(([k, v]) => {
    text = text.replace(`{{${k}}}`, v);
  });
  return text;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  updateModeButton();
}

function changeLanguage(lang) {
  state.currentLang = lang;
  localStorage.setItem('language', lang);
  loadTranslations(lang);
}

// ============================================================================
// SEARCH — lupa submit + close to clear
// ============================================================================

function clearSearch() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClear');
  input.value = '';
  clearBtn.classList.add('hidden');
  document.getElementById('searchResultsSection').classList.add('hidden');
  input.focus();
}

function updateSearchClear() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClear');
  if (!input || !clearBtn) return;
  if (input.value.trim().length > 0) {
    clearBtn.classList.remove('hidden');
  } else {
    clearBtn.classList.add('hidden');
  }
}

// ============================================================================
// MODE BUTTON
// ============================================================================

function updateModeButton() {
  const icon = document.getElementById('modeIcon');
  const btn  = document.getElementById('modeToggle');
  if (!icon || !btn) return;
  icon.textContent = state.scrollMode ? 'auto_stories' : 'swap_vert';
  btn.title = state.scrollMode ? t('mode_page') : t('mode_scroll');
}

function toggleMode() {
  state.scrollMode = !state.scrollMode;
  localStorage.setItem('scrollMode', state.scrollMode);
  updateModeButton();
  showPage();
}

// ============================================================================
// HISTORY API — native back button / swipe back
// ============================================================================

function pushView(view, data = {}) {
  history.pushState({ view, ...data }, '', location.pathname);
}

window.addEventListener('popstate', (e) => {
  const view = e.state?.view;
  if (view === 'reader') {
    _showReaderView();
  } else if (view === 'chapters') {
    _showChaptersView();
  } else {
    _showHomeView();
    loadPopular();
  }
});

// ============================================================================
// VIEW HELPERS (private — no pushState)
// ============================================================================

function _showHomeView() {
  document.getElementById('homeView').classList.remove('hidden');
  document.getElementById('chaptersView').classList.add('hidden');
  document.getElementById('readerView').classList.add('hidden');
  document.getElementById('readerControls').classList.add('hidden');
  document.getElementById('readerControls').classList.remove('controls--hidden');
  document.getElementById('header').classList.remove('hidden');
  document.getElementById('readerViewInner').classList.remove('page-mode');
}

function _showChaptersView() {
  document.getElementById('homeView').classList.add('hidden');
  document.getElementById('chaptersView').classList.remove('hidden');
  document.getElementById('readerView').classList.add('hidden');
  document.getElementById('readerControls').classList.add('hidden');
  document.getElementById('readerControls').classList.remove('controls--hidden');
  document.getElementById('header').classList.remove('hidden');
  document.getElementById('readerViewInner').classList.remove('page-mode');
}

function _showReaderView() {
  document.getElementById('homeView').classList.add('hidden');
  document.getElementById('chaptersView').classList.add('hidden');
  document.getElementById('readerView').classList.remove('hidden');
  document.getElementById('readerControls').classList.remove('hidden');
  document.getElementById('readerControls').classList.remove('controls--hidden');
  document.getElementById('header').classList.add('hidden');
  lastScrollY = window.scrollY;
}

// ============================================================================
// VIEW NAVIGATORS (public — with pushState)
// ============================================================================

function showHomeView() {
  pushView('home');
  _showHomeView();
}

function showChaptersView() {
  pushView('chapters');
  _showChaptersView();
}

function showReaderView() {
  pushView('reader');
  _showReaderView();
}

// ============================================================================
// AUTO-HIDE CONTROLS ON SCROLL
// ============================================================================

let lastScrollY = 0;

function setupScrollHide() {
  window.addEventListener('scroll', () => {
    const controls     = document.getElementById('readerControls');
    const readerHidden = document.getElementById('readerView').classList.contains('hidden');
    if (readerHidden || !controls) return;

    const y = window.scrollY;
    const atBottom = (window.innerHeight + y) >= document.body.scrollHeight - 80;
    if (atBottom && state.scrollMode) {
      controls.classList.remove('controls--hidden');
    } else if (y > lastScrollY && y > 80) {
      controls.classList.add('controls--hidden');
    } else {
      controls.classList.remove('controls--hidden');
    }
    lastScrollY = y;
  }, { passive: true });

  document.getElementById('readerView').addEventListener('click', (e) => {
    const controls = document.getElementById('readerControls');
    if (!controls) return;
    if (controls.classList.contains('controls--hidden')) {
      controls.classList.remove('controls--hidden');
    }
  });
}

// ============================================================================
// SWIPE GESTURES (mobile page-flip)
// ============================================================================

let touchStartX = 0;
let touchStartY = 0;

function setupSwipeGestures() {
  const reader = document.getElementById('readerView');

  reader.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) return;
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  reader.addEventListener('touchend', (e) => {
    if (state.scrollMode || state.flipping || e.touches.length > 0) return;

    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dy) > Math.abs(dx)) return;

    if (dx < 0) {
      nextPage();
    } else {
      prevPage();
    }
  }, { passive: true });
}

// ============================================================================
// HOME
// ============================================================================

async function loadPopular() {
  const grid = document.getElementById('popularGrid');
  grid.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  try {
    const res  = await fetch(`/popular?lang=${state.currentLang}`);
    const data = await res.json();
    if (!data.data?.length) {
      grid.innerHTML = generateEmptyCards(12);
      return;
    }
    displayMangaGrid(data.data, 'popularGrid');
  } catch (e) {
    grid.innerHTML = generateEmptyCards(12);
  }
}

function generateEmptyCards(count) {
  return Array.from({ length: count }, () => `
    <div class="manga-card">
      <div class="manga-cover-wrap">
        <div class="cover-placeholder show-icon">${MANGA_PLACEHOLDER_SVG}</div>
      </div>
      <div class="manga-title" style="color:var(--text-muted)">—</div>
    </div>
  `).join('');
}

async function searchManga() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;
  const section = document.getElementById('searchResultsSection');
  const results = document.getElementById('searchResults');
  section.classList.remove('hidden');
  results.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';
  try {
    const res  = await fetch(`/search?q=${encodeURIComponent(query)}&lang=${state.currentLang}`);
    const data = await res.json();
    displayMangaGrid(data.data, 'searchResults');
  } catch (e) {
    results.innerHTML = `<div class="loading">${t('error_loading')}</div>`;
  }
}

function displayMangaGrid(mangas, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  mangas.forEach((manga) => {
    const cover = manga.relationships?.find((r) => r.type === 'cover_art');
    const coverUrl = cover
      ? `/image-proxy?url=${encodeURIComponent(`https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}`)}`
      : '';
    const title = manga.attributes.title.en || manga.attributes.title['ja-ro'] || t('no_title');

    const card = document.createElement('div');
    card.className = 'manga-card';
    card.onclick = () => loadChapters(manga);
    card.innerHTML = `
      <div class="manga-cover-wrap">
        <div class="cover-placeholder" id="ph-${manga.id}">
          ${MANGA_PLACEHOLDER_SVG}
        </div>
        <img
          class="manga-cover loading"
          src="${coverUrl}"
          alt="${title}"
          loading="lazy"
          onload="this.classList.remove('loading'); document.getElementById('ph-${manga.id}')?.classList.add('hidden')"
          onerror="this.style.display='none'; document.getElementById('ph-${manga.id}')?.classList.add('show-icon')"
        >
      </div>
      <div class="manga-title">${title}</div>
    `;
    container.appendChild(card);

    // After delay, show SVG icon if still loading
    setTimeout(() => {
      const ph = document.getElementById(`ph-${manga.id}`);
      if (ph && !ph.classList.contains('hidden')) {
        ph.classList.add('show-icon');
      }
    }, PLACEHOLDER_DELAY_MS);
  });
}

// ============================================================================
// CHAPTERS
// ============================================================================

async function loadChapters(manga, skipNav = false) {
  state.currentManga = manga;
  if (!skipNav) showChaptersView();

  const title = manga.attributes.title.en || manga.attributes.title['ja-ro'] || t('chapters_title');
  document.getElementById('mangaTitle').textContent = title;

  const list = document.getElementById('chaptersList');
  list.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';

  try {
    const chapters = await fetchAllChapters(manga.id);
    state.chapters = chapters;
    list.innerHTML = '';
    chapters.forEach((chapter) => {
      const item = document.createElement('div');
      item.className = 'chapter-item';
      if (state.currentChapter?.id === chapter.id) {
        item.classList.add('active');
        setTimeout(() => item.scrollIntoView({ block: 'center', behavior: 'smooth' }), 100);
      }
      item.onclick = () => loadPages(chapter);
      const num = chapter.attributes.chapter || '?';
      const ttl = chapter.attributes.title || '';
      item.textContent = `${t('chapter')} ${num}${ttl ? ' — ' + ttl : ''}`;
      list.appendChild(item);
    });
  } catch (e) {
    console.error('Error loading chapters:', e);
    list.innerHTML = `<div class="loading">${t('error_loading')}</div>`;
  }
}

async function fetchAllChapters(mangaId) {
  const all = [];
  let offset = 0;
  while (true) {
    const res  = await fetch(`/chapters/${mangaId}?offset=${offset}&lang=${state.currentLang}`);
    const data = await res.json();
    if (!data.data?.length) break;
    all.push(...data.data);
    offset += CHAPTERS_LIMIT;
    if (data.data.length < CHAPTERS_LIMIT) break;
  }
  return all;
}

// ============================================================================
// READER
// ============================================================================

async function loadPages(chapter) {
  state.currentChapter = chapter;
  state.currentPageIndex = 0;

  localStorage.setItem('readingState', JSON.stringify({
    manga:   state.currentManga,
    chapter: state.currentChapter,
    page:    0,
  }));

  showReaderView();
  updateModeButton();

  document.getElementById('pageContainer').innerHTML =
    '<div class="spinner-wrap"><div class="spinner"></div></div>';

  try {
    const res  = await fetch(`/pages/${chapter.id}`);
    const data = await res.json();
    state.currentPages = data.chapter.data.map(
      (p) => `/image-proxy?url=${encodeURIComponent(`${data.baseUrl}/data/${data.chapter.hash}/${p}`)}`
    );
    showPage();
    updateNextChapterBtn();
  } catch (e) {
    console.error('Error loading pages:', e);
    document.getElementById('pageContainer').innerHTML =
      `<div class="page-error"><span class="material-icons-round">broken_image</span>${t('error_loading')}</div>`;
  }
}

function showPage(direction) {
  const container = document.getElementById('pageContainer');
  const prevBtn   = document.getElementById('prevBtn');
  const nextBtn   = document.getElementById('nextBtn');
  const pageInfo  = document.getElementById('pageInfo');
  const viewer    = document.getElementById('readerViewInner');

  if (state.scrollMode) {
    viewer.classList.remove('page-mode');
    container.innerHTML = state.currentPages
      .map((src, i) => `
        <img
          class="reader-page"
          src="${src}"
          alt="Page ${i + 1}"
          loading="lazy"
          onerror="this.outerHTML='<div class=\\'page-error\\'><span class=\\'material-icons-round\\'>broken_image</span>Page ${i + 1}</div>'"
        >
      `).join('');
    prevBtn.classList.add('hidden');
    nextBtn.classList.add('hidden');
    pageInfo.classList.add('hidden');

  } else {
    viewer.classList.add('page-mode');
    const src = state.currentPages[state.currentPageIndex];
    const enterClass = direction === 'next' ? 'flip-enter-next'
      : direction === 'prev' ? 'flip-enter-prev'
        : '';

    container.innerHTML = `
      <div class="page-flip-container ${enterClass}">
        <img
          class="reader-page"
          src="${src}"
          alt="Page ${state.currentPageIndex + 1}"
          onerror="this.outerHTML='<div class=\\'page-error\\'><span class=\\'material-icons-round\\'>broken_image</span>Page failed to load</div>'"
        >
      </div>
    `;
    prevBtn.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
    pageInfo.classList.remove('hidden');

    pageInfo.textContent = t('page_of', {
      current: state.currentPageIndex + 1,
      total:   state.currentPages.length,
    });
    prevBtn.disabled = state.currentPageIndex === 0;
    nextBtn.disabled = state.currentPageIndex === state.currentPages.length - 1;
  }

  updateNextChapterBtn();
  // Save progress
  const rs = JSON.parse(localStorage.getItem('readingState') || '{}');
  if (rs.manga && rs.chapter) {
    rs.page = state.currentPageIndex;
    localStorage.setItem('readingState', JSON.stringify(rs));
  }
}

/**
 * Animate page flip exit, then change page and animate entrance.
 */
function flipToPage(newIndex, direction) {
  if (state.flipping) return;
  state.flipping = true;

  const flipContainer = document.querySelector('.page-flip-container');
  if (flipContainer) {
    flipContainer.className = `page-flip-container flip-${direction}`;
  }

  setTimeout(() => {
    state.currentPageIndex = newIndex;
    showPage(direction);
    window.scrollTo(0, 0);
    state.flipping = false;
  }, FLIP_EXIT_MS);
}

function prevPage() {
  if (state.currentPageIndex > 0 && !state.flipping) {
    flipToPage(state.currentPageIndex - 1, 'prev');
  }
}

function nextPage() {
  if (state.currentPageIndex < state.currentPages.length - 1 && !state.flipping) {
    flipToPage(state.currentPageIndex + 1, 'next');
  }
}

function nextChapter() {
  const idx = state.chapters.findIndex(c => c.id === state.currentChapter?.id);
  if (idx === -1 || idx >= state.chapters.length - 1) return;
  loadPages(state.chapters[idx + 1]);
}

function updateNextChapterBtn() {
  const btn = document.getElementById('nextChapterBtn');
  if (!btn) return;
  const idx = state.chapters.findIndex(c => c.id === state.currentChapter?.id);
  btn.disabled = idx === -1 || idx >= state.chapters.length - 1;
  btn.title = t('next_chapter');
}

// ============================================================================
// NAVIGATION
// ============================================================================

function backToHome() {
  localStorage.removeItem('readingState');
  _showHomeView();
  document.getElementById('searchResultsSection').classList.add('hidden');
  state.currentManga   = null;
  state.currentChapter = null;
  state.currentPages   = [];
  history.replaceState({ view: 'home' }, '', location.pathname);
  loadPopular();
}

function backToChapters() {
  _showChaptersView();
  history.replaceState({ view: 'chapters' }, '', location.pathname);
  if (state.currentManga) {
    loadChapters(state.currentManga, true);
  }
}

// ============================================================================
// INIT
// ============================================================================

async function restoreState() {
  await loadTranslations(state.currentLang);
  document.getElementById('langSelector').value = state.currentLang;

  const rs = JSON.parse(localStorage.getItem('readingState') || '{}');

  if (rs.manga && rs.chapter) {
    state.currentManga        = rs.manga;
    state.currentChapter      = rs.chapter;
    state.currentPageIndex    = rs.page || 0;

    _showReaderView();
    updateModeButton();

    try {
      const [pagesData, chapters] = await Promise.all([
        fetch(`/pages/${state.currentChapter.id}`).then(r => r.json()),
        fetchAllChapters(rs.manga.id),
      ]);

      state.chapters     = chapters;
      state.currentPages = pagesData.chapter.data.map(
        (p) => `/image-proxy?url=${encodeURIComponent(`${pagesData.baseUrl}/data/${pagesData.chapter.hash}/${p}`)}`
      );

      showPage();
      history.replaceState({ view: 'reader' }, '', location.pathname);
    } catch (e) {
      console.error('Error restoring state:', e);
      _showHomeView();
      loadPopular();
      history.replaceState({ view: 'home' }, '', location.pathname);
    }
  } else {
    _showHomeView();
    loadPopular();
    history.replaceState({ view: 'home' }, '', location.pathname);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('searchInput');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchManga();
    });
    input.addEventListener('input', updateSearchClear);
  }

  document.addEventListener('keydown', (e) => {
    const readerVisible = !document.getElementById('readerView').classList.contains('hidden');
    if (!readerVisible || state.scrollMode) return;
    if (e.key === 'ArrowLeft')  prevPage();
    if (e.key === 'ArrowRight') nextPage();
  });

  setupScrollHide();
  setupSwipeGestures();
  restoreState();
});
