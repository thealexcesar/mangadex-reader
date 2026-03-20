/**
 * Mangadex Reader - Main Application Logic
 * Handles manga browsing, searching, chapter selection, and reading
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
  currentManga: null,
  currentChapter: null,
  currentPages: [],
  currentPageIndex: 0,
  scrollMode: localStorage.getItem('scrollMode') === 'true',
  currentLang: localStorage.getItem('language') || 'en',
  translations: {},
};

const LANG_MAP = {
  'en': 'en',
  'pt-br': 'pt-br',
};

// ============================================================================
// TRANSLATION SYSTEM
// ============================================================================

/**
 * Load translations for the specified language
 * @param {string} lang - Language code (e.g., 'en', 'pt-br')
 */
async function loadTranslations(lang) {
  try {
    const response = await fetch(`/locales/${lang}.json`);
    state.translations = await response.json();
    applyTranslations();
  } catch (error) {
    console.error('Error loading translations:', error);
  }
}

/**
 * Get translated text for a key with optional parameters
 * @param {string} key - Translation key
 * @param {Object} params - Parameters to replace in template (e.g., {{current}})
 * @returns {string} Translated text
 */
function t(key, params = {}) {
  let text = state.translations[key] || key;
  Object.entries(params).forEach(([param, value]) => {
    text = text.replace(`{{${param}}}`, value);
  });
  return text;
}

/**
 * Apply translations to all DOM elements with data-i18n attributes
 */
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.getAttribute('data-i18n'));
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.placeholder = t(element.getAttribute('data-i18n-placeholder'));
  });

  updateModeButton();
}

/**
 * Change the application language and reload translations
 * @param {string} lang - Language code
 */
function changeLanguage(lang) {
  state.currentLang = lang;
  localStorage.setItem('language', lang);
  loadTranslations(lang);
}

// ============================================================================
// READING MODE MANAGEMENT
// ============================================================================

/**
 * Update the mode toggle button text (Page/Scroll mode)
 */
function updateModeButton() {
  const button = document.getElementById('modeToggle');
  if (button) {
    button.textContent = state.scrollMode ? t('mode_scroll') : t('mode_page');
  }
}

/**
 * Toggle between page and scroll reading modes
 */
function toggleMode() {
  state.scrollMode = !state.scrollMode;
  localStorage.setItem('scrollMode', state.scrollMode);
  updateModeButton();
  showPage();
}

// ============================================================================
// VIEW VISIBILITY HELPERS
// ============================================================================

/**
 * Show home view and hide other views
 */
function showHomeView() {
  document.getElementById('homeView').classList.remove('hidden');
  document.getElementById('chaptersView').classList.add('hidden');
  document.getElementById('readerView').classList.add('hidden');
  document.getElementById('readerControls').classList.add('hidden');
  document.getElementById('header').classList.remove('hidden');
}

/**
 * Show chapters view and hide other views
 */
function showChaptersView() {
  document.getElementById('homeView').classList.add('hidden');
  document.getElementById('chaptersView').classList.remove('hidden');
  document.getElementById('readerView').classList.add('hidden');
  document.getElementById('readerControls').classList.add('hidden');
  document.getElementById('header').classList.remove('hidden');
}

/**
 * Show reader view with controls
 */
function showReaderView() {
  document.getElementById('homeView').classList.add('hidden');
  document.getElementById('chaptersView').classList.add('hidden');
  document.getElementById('readerView').classList.remove('hidden');
  document.getElementById('readerControls').classList.remove('hidden');
  document.getElementById('header').classList.add('hidden');
}

// ============================================================================
// HOME VIEW - POPULAR & SEARCH
// ============================================================================

/**
 * Load and display popular manga
 */
async function loadPopular() {
  try {
    const response = await fetch(`/popular?lang=${state.currentLang}`);
    const data = await response.json();
    displayMangaGrid(data.data, 'popularGrid');
  } catch (error) {
    const grid = document.getElementById('popularGrid');
    grid.innerHTML = `<div class="loading">${t('error_loading')}</div>`;
  }
}

/**
 * Search for manga by query
 */
async function searchManga() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  try {
    const response = await fetch(`/search?q=${query}&lang=${state.currentLang}`);
    const data = await response.json();
    document.getElementById('searchResultsSection').classList.remove('hidden');
    displayMangaGrid(data.data, 'searchResults');
  } catch (error) {
    console.error('Search error:', error);
  }
}

/**
 * Display manga cards in a grid
 * @param {Array} mangas - Array of manga objects
 * @param {string} containerId - ID of container element
 */
function displayMangaGrid(mangas, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  mangas.forEach((manga) => {
    const card = document.createElement('div');
    card.className = 'manga-card';
    card.onclick = () => loadChapters(manga);

    const cover = manga.relationships?.find((r) => r.type === 'cover_art');
    const coverUrl = cover
      ? `/image-proxy?url=${encodeURIComponent(`https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}`)}`
      : '';

    const title =
      manga.attributes.title.en ||
      manga.attributes.title['ja-ro'] ||
      t('no_title');

    card.innerHTML = `
      <img class="manga-cover" src="${coverUrl}" alt="${title}">
      <div class="manga-title">${title}</div>
    `;

    container.appendChild(card);
  });
}

// ============================================================================
// CHAPTERS VIEW
// ============================================================================

/**
 * Load and display chapters for a selected manga
 * @param {Object} manga - Manga object
 */
async function loadChapters(manga) {
  state.currentManga = manga;
  showChaptersView();

  const title =
    manga.attributes.title.en ||
    manga.attributes.title['ja-ro'] ||
    t('chapters_title');
  document.getElementById('mangaTitle').textContent = title;

  const chaptersList = document.getElementById('chaptersList');
  chaptersList.innerHTML = `<div class="loading">${t('loading_chapters')}</div>`;

  try {
    const chapters = await fetchAllChapters(manga.id);
    chaptersList.innerHTML = '';

    chapters.forEach((chapter) => {
      const item = document.createElement('div');
      item.className = 'chapter-item';
      item.onclick = () => loadPages(chapter);

      const chapterNum = chapter.attributes.chapter || '?';
      const chapterTitle = chapter.attributes.title || '';
      item.textContent = `${t('chapter')} ${chapterNum}${
        chapterTitle ? ' - ' + chapterTitle : ''
      }`;

      chaptersList.appendChild(item);
    });
  } catch (error) {
    console.error('Error loading chapters:', error);
    chaptersList.innerHTML = `<div class="loading">${t('error_loading')}</div>`;
  }
}

/**
 * Fetch all chapters for a manga (handles pagination)
 * @param {string} mangaId - Manga ID
 * @returns {Promise<Array>} All chapters
 */
async function fetchAllChapters(mangaId) {
  const allChapters = [];
  let offset = 0;
  const LIMIT = 100;

  while (true) {
    const response = await fetch(
      `/chapters/${mangaId}?offset=${offset}&lang=${state.currentLang}`
    );
    const data = await response.json();

    if (data.data.length === 0) break;

    allChapters.push(...data.data);
    offset += LIMIT;

    if (data.data.length < LIMIT) break;
  }

  return allChapters;
}

// ============================================================================
// READER VIEW - PAGE DISPLAY
// ============================================================================

/**
 * Load pages for a chapter and enter reader mode
 * @param {Object} chapter - Chapter object
 */
async function loadPages(chapter) {
  state.currentChapter = chapter;
  state.currentPageIndex = 0;

  localStorage.setItem(
    'readingState',
    JSON.stringify({
      manga: state.currentManga,
      chapter: state.currentChapter,
      page: 0,
    })
  );

  showReaderView();
  updateModeButton();

  try {
    const response = await fetch(`/pages/${chapter.id}`);
    const data = await response.json();

    state.currentPages = data.chapter.data.map(
      (page) => `/image-proxy?url=${encodeURIComponent(`${data.baseUrl}/data/${data.chapter.hash}/${page}`)}`
    );

    showPage();
  } catch (error) {
    console.error('Error loading pages:', error);
  }
}

/**
 * Display current page or all pages depending on reading mode
 */
function showPage() {
  const container = document.getElementById('pageContainer');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageInfo = document.getElementById('pageInfo');

  if (state.scrollMode) {
    // Scroll mode: show all pages
    container.innerHTML = state.currentPages
      .map((page) => `<img class="reader-page" src="${page}">`)
      .join('');

    prevBtn.classList.add('hidden');
    nextBtn.classList.add('hidden');
    pageInfo.classList.add('hidden');
  } else {
    // Page mode: show one page at a time
    container.innerHTML = `<img class="reader-page" src="${state.currentPages[state.currentPageIndex]}">`;

    prevBtn.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
    pageInfo.classList.remove('hidden');

    pageInfo.textContent = t('page_of', {
      current: state.currentPageIndex + 1,
      total: state.currentPages.length,
    });

    prevBtn.disabled = state.currentPageIndex === 0;
    nextBtn.disabled = state.currentPageIndex === state.currentPages.length - 1;
  }

  // Save reading progress
  const readingState = JSON.parse(localStorage.getItem('readingState') || '{}');
  if (readingState.manga && readingState.chapter) {
    readingState.page = state.currentPageIndex;
    localStorage.setItem('readingState', JSON.stringify(readingState));
  }
}

/**
 * Navigate to previous page
 */
function prevPage() {
  if (state.currentPageIndex > 0) {
    state.currentPageIndex--;
    showPage();
    window.scrollTo(0, 0);
  }
}

/**
 * Navigate to next page
 */
function nextPage() {
  if (state.currentPageIndex < state.currentPages.length - 1) {
    state.currentPageIndex++;
    showPage();
    window.scrollTo(0, 0);
  }
}

// ============================================================================
// NAVIGATION HANDLERS
// ============================================================================

/**
 * Return to home view from chapters or reader
 */
function backToHome() {
  localStorage.removeItem('readingState');
  showHomeView();
  document.getElementById('searchResultsSection').classList.add('hidden');
  state.currentManga = null;
  state.currentChapter = null;
  state.currentPages = [];
}

/**
 * Return to chapters view from reader
 */
function backToChapters() {
  showChaptersView();
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Restore application state on page load
 * If user was reading, restore reader; otherwise show home
 */
async function restoreState() {
  await loadTranslations(state.currentLang);
  document.getElementById('langSelector').value = state.currentLang;

  const readingState = JSON.parse(localStorage.getItem('readingState') || '{}');

  if (readingState.manga && readingState.chapter) {
    // Resume reading
    state.currentManga = readingState.manga;
    state.currentChapter = readingState.chapter;
    state.currentPageIndex = readingState.page || 0;

    showReaderView();
    updateModeButton();

    try {
      const response = await fetch(`/pages/${state.currentChapter.id}`);
      const data = await response.json();

      state.currentPages = data.chapter.data.map(
        (page) => `${data.baseUrl}/data/${data.chapter.hash}/${page}`
      );

      showPage();
    } catch (error) {
      console.error('Error restoring reading state:', error);
      showHomeView();
      loadPopular();
    }
  } else {
    // Show home with popular manga
    showHomeView();
    loadPopular();
  }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchManga();
    });
  }

  document.addEventListener('keydown', (e) => {
    const isReaderVisible =
      !document.getElementById('readerView').classList.contains('hidden');
    if (!isReaderVisible || state.scrollMode) return;

    if (e.key === 'ArrowLeft') prevPage();
    if (e.key === 'ArrowRight') nextPage();
  });

  restoreState();
});
