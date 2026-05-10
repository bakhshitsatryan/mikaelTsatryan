/* ============================================================
   APP — shared header, language switching, music
   ============================================================ */

const NAV_LABELS = {
  am: {
    home:   { full: 'Գլխավոր',        short: 'Գլխ.' },
    bio:    { full: 'Կենսագրություն', short: 'Կենսգր.' },
    photos: { full: 'Լուսանկարներ',   short: 'Նկարներ' },
    other:  'РУС'
  },
  ru: {
    home:   { full: 'Главная',    short: 'Главн.' },
    bio:    { full: 'Биография',  short: 'Биогр.' },
    photos: { full: 'Фотографии', short: 'Фото' },
    other:  'ՀԱՅ'
  }
};

const STORAGE_LANG  = 'mt:lang';
const STORAGE_MUSIC = 'mt:music';

/* -------- LANGUAGE -------- */

function getLang() {
  const saved = localStorage.getItem(STORAGE_LANG);
  if (saved === 'am' || saved === 'ru') return saved;
  return 'am';
}

function setLang(lang) {
  localStorage.setItem(STORAGE_LANG, lang);
  applyLang(lang);
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

function applyLang(lang) {
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-lang]').forEach(el => {
    el.classList.toggle('lang-hidden', el.dataset.lang !== lang);
  });

  const labels = NAV_LABELS[lang];
  document.querySelectorAll('[data-nav]').forEach(el => {
    const key = el.dataset.nav;
    const item = labels[key];
    if (!item) return;
    if (typeof item === 'string') {
      el.textContent = item;
    } else {
      el.innerHTML = `<span class="nav__full">${item.full}</span><span class="nav__short">${item.short}</span>`;
    }
  });

  const langBtn = document.querySelector('.lang-toggle');
  if (langBtn) langBtn.textContent = labels.other;
}

/* -------- NAV (rendered into <header data-nav-root>) -------- */

function renderNav(activePage) {
  const root = document.querySelector('[data-nav-root]');
  if (!root) return;

  root.innerHTML = `
    <nav class="nav" aria-label="Main">
      <div class="nav__links">
        <a class="nav__link${activePage==='home'   ? ' is-active' : ''}" href="index.html"     data-nav="home"></a>
        <a class="nav__link${activePage==='bio'    ? ' is-active' : ''}" href="biography.html" data-nav="bio"></a>
        <a class="nav__link${activePage==='photos' ? ' is-active' : ''}" href="photos.html"    data-nav="photos"></a>
      </div>
      <div class="nav__tools">
        <button class="nav__btn" id="musicToggle" aria-label="Music" aria-pressed="false">
          <svg class="ico-music-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 18V6l10-2v12"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="16" cy="16" r="3"/>
            <line x1="3" y1="3" x2="21" y2="21"/>
          </svg>
          <svg class="ico-music-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 18V6l10-2v12"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="16" cy="16" r="3"/>
          </svg>
        </button>
        <button class="lang-toggle" id="langToggle" aria-label="Switch language"></button>
      </div>
    </nav>
    <audio id="bgMusic" src="music.mp3" loop preload="none"></audio>
  `;

  document.getElementById('langToggle').addEventListener('click', () => {
    const next = getLang() === 'am' ? 'ru' : 'am';
    setLang(next);
  });

  initMusic();
}

/* -------- MUSIC -------- */

function initMusic() {
  const btn   = document.getElementById('musicToggle');
  const audio = document.getElementById('bgMusic');
  if (!btn || !audio) return;

  audio.volume = 0.4;

  // never auto-play; only react to user click
  btn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().then(() => {
        btn.classList.add('is-on');
        btn.setAttribute('aria-pressed', 'true');
        localStorage.setItem(STORAGE_MUSIC, 'on');
      }).catch(() => {});
    } else {
      audio.pause();
      btn.classList.remove('is-on');
      btn.setAttribute('aria-pressed', 'false');
      localStorage.setItem(STORAGE_MUSIC, 'off');
    }
  });
}

/* -------- BOOT -------- */

window.MTApp = { renderNav, applyLang, getLang, setLang };

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page || 'home';
  renderNav(page);
  applyLang(getLang());
});
