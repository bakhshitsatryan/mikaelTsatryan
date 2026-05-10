/* ============================================================
   BIOGRAPHY — render full text from biography.json
   ============================================================ */

(async function () {
  const root = document.getElementById('bio');
  if (!root) return;

  let data;
  try {
    data = await fetch('texts/biography.json').then(r => r.json());
  } catch (e) {
    root.innerHTML = '<p style="text-align:center;color:var(--ink-soft)">Не удалось загрузить биографию.</p>';
    return;
  }

  const renderBlock = (b) => {
    switch (b.type) {
      case 'paragraph': return `<p class="bio__p">${esc(b.text)}</p>`;
      case 'quote':     return `<blockquote class="bio__quote">${esc(b.text)}</blockquote>`;
      case 'list':      return `<ul class="bio__list">${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
      default:          return '';
    }
  };

  const renderLang = (lang) => {
    const meta = data.meta;
    const chapters = data.chapters.map((ch, i) => `
      <article class="bio__chapter">
        <span class="bio__chapter-num">${String(i + 1).padStart(2, '0')}</span>
        <h2 class="bio__chapter-title">${esc(ch.title[lang])}</h2>
        ${(ch.content[lang] || []).map(renderBlock).join('')}
      </article>
    `).join('');

    const closing = (data.closing[lang] || []).map(t => `<p>${esc(t)}</p>`).join('');

    return `
      <header class="bio__hero">
        <h1 class="bio__name">${esc(meta.name[lang])}</h1>
        <span class="bio__years">${esc(meta.years)}</span>
      </header>
      ${chapters}
      <footer class="bio__closing">${closing}</footer>
    `;
  };

  const wrap = (html, lang) =>
    `<div class="bio__pane${lang === 'ru' ? ' lang-hidden' : ''}" data-lang="${lang}">${html}</div>`;

  root.innerHTML = wrap(renderLang('am'), 'am') + wrap(renderLang('ru'), 'ru');
  // re-apply current language to newly added panes
  if (window.MTApp) window.MTApp.applyLang(window.MTApp.getLang());

  // re-apply on language change
  document.addEventListener('langchange', () => {
    window.scrollTo({ top: 0 });
  });
})();

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
