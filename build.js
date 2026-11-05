// ForFoodSake site builder. No dependencies: Netlify runs `node build.js`.
// Reads content/*.json (edited via the /admin CMS), writes the site to dist/.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');

// ---------- helpers ----------
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const readDir = (dir) => fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => ({ slug: f.replace(/\.json$/, ''), ...readJson(path.join(dir, f)) }))
  : [];
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const write = (rel, html) => { const p = path.join(OUT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, html); };
const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
};
// Ingredients and method can be one pasted block of text (one per line) or an older-style list.
const toLines = (v) => (Array.isArray(v) ? v : String(v ?? '').split(/\r?\n/))
  .map((s) => String(s).replace(/^\s*(?:[-–•*·▪◦]\s*|step\s*\d+\s*[:.)–-]?\s*|\d+[.)]\s+)/i, '').trim())
  .filter(Boolean);
// Ingredient groups: [{ heading, items }] from the editor, or a plain list/text from older recipes.
const toGroups = (v) => (Array.isArray(v) && v.some((g) => g && typeof g === 'object')
  ? v.map((g) => ({ heading: (g.heading || '').trim(), items: toLines(g.items) }))
  : [{ heading: '', items: toLines(v) }]).filter((g) => g.items.length);
const toSlug = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const CATEGORIES = [
  { label: 'Quick dinners', tint: '#F2C6A8' },
  { label: 'Comfort food', tint: '#E8B98F' },
  { label: 'Sweet treats', tint: '#D9B3A3' },
  { label: 'Meat-free', tint: '#BFD6B4' },
  { label: 'Healthy bowls', tint: '#C9DCE0' },
  { label: 'Party food', tint: '#F3DE9C' },
  { label: 'Festive', tint: '#E3A9A0' },
];
const tintFor = (cat) => (CATEGORIES.find((c) => c.label === cat) || { tint: '#EBDDC8' }).tint;

// ---------- content ----------
const site = readJson(path.join(ROOT, 'content/settings/site.json'));
const about = readJson(path.join(ROOT, 'content/settings/about.json'));
const recipes = readDir(path.join(ROOT, 'content/recipes'))
  .filter((r) => r.title)
  .map((r) => ({
    ...r,
    ingredients: toGroups(r.ingredients),
    steps: toLines(r.steps),
    mins: (Number(r.prep) || 0) + (Number(r.cook) || 0),
    tint: tintFor(r.category),
    collections: r.collections || [],
    url: `/recipes/${r.slug}/`,
  }))
  .sort((a, b) => String(b.date).localeCompare(String(a.date)));
const collections = readDir(path.join(ROOT, 'content/collections'))
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
  .map((c) => ({ ...c, recipes: recipes.filter((r) => r.collections.includes(c.title)) }));

const servesText = (r) => (/^\d+$/.test(String(r.serves)) ? `Serves ${r.serves}` : r.serves || '');
const metaText = (r) => [r.mins ? `${r.mins} mins` : '', servesText(r)].filter(Boolean).join(' · ');
const thumb = (r, cls, label = '[Photo]') => r.image
  ? `<img class="${cls}" src="${esc(r.image)}" alt="${esc(r.title)}" loading="lazy">`
  : `<div class="${cls} ph" style="background:${r.tint}"><span>${label}</span></div>`;

// ---------- layout ----------
const ICON = {
  prev: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  chev: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  arrow: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  search: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
};
const arrowBtn = (dir, label, extra = '') => `<button type="button" class="arrow ${dir}" aria-label="${label}" ${extra}>${ICON[dir]}</button>`;

const page = ({ title, desc, active, body }) => `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc || 'Easy recipes you’ll actually want to make, from Natasha’s London kitchen.')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Lora:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
<header class="site-header">
  <div class="wrap header-row">
    <a class="logo" href="/">forfood<span>sake</span><em>LDN</em></a>
    <nav aria-label="Main" class="nav">
      ${active !== 'home' ? '<a href="/">Home</a>' : ''}
      ${['recipes', 'collections', 'about'].map((p) => `<a href="/${p}/"${active === p ? ' aria-current="page"' : ''}>${p[0].toUpperCase() + p.slice(1)}</a>`).join('\n      ')}
      <form class="search" action="/recipes/" role="search">
        ${ICON.search}
        <label class="sr" for="q">Search recipes</label>
        <input id="q" type="search" name="q" placeholder="Search recipes">
      </form>
    </nav>
  </div>
</header>
<main>
${body}
</main>
<footer class="site-footer">
  <div class="wrap footer-row">
    <span>© ${new Date().getFullYear()} ForFoodSake_Ldn</span>
    <nav aria-label="Footer">
      <a href="/recipes/">Recipes</a><a href="/collections/">Collections</a><a href="/about/">About</a><a href="mailto:${esc(site.email)}">Contact</a>
    </nav>
  </div>
</footer>
<script src="/js/main.js"></script>
</body>
</html>`;

// ---------- carousel (homepage + collections) ----------
const carousel = (items, label) => items.length ? `
<div class="carousel" data-carousel aria-label="${esc(label)}">
  <div class="carousel-stage">
    ${items.map((r, i) => `<a class="slide" href="${r.url}" data-i="${i}" style="background:${r.tint}">
      ${r.image ? `<img src="${esc(r.image)}" alt="" loading="lazy">` : '<span class="slide-ph">[Photo]</span>'}
      <span class="slide-text"><span class="slide-title">${esc(r.title)}</span><span class="slide-meta">${esc(metaText(r))}</span></span>
    </a>`).join('\n    ')}
    ${arrowBtn('prev', 'Previous picture', 'data-prev')}
    ${arrowBtn('next', 'Next picture', 'data-next')}
  </div>
  <div class="dots">${items.map((r, i) => `<button type="button" data-dot="${i}" aria-label="Show ${esc(r.title)}"><span></span></button>`).join('')}</div>
</div>` : '<p class="muted">[Recipes in this collection will appear here.]</p>';

// ---------- pages ----------
function home() {
  let featured = recipes.filter((r) => r.featured).slice(0, 5);
  if (featured.length < 3) featured = recipes.slice(0, 5);
  const latest = recipes.slice(0, 4);
  const bio = (about.story || [])[0] || '';
  return page({ title: 'ForFoodSake – Easy recipes from a London kitchen', active: 'home', body: `
<section class="hero">
  <div class="wrap hero-text">
    <p class="eyebrow">Easy recipes from a London kitchen</p>
    <h1>Easy recipes you’ll actually want to make.</h1>
    <p class="lead">Quick dinners, cosy comfort food and sweet treats – tested at home, filmed for your feed, written up here.</p>
    <div class="btn-row">
      <a class="btn btn-primary" href="/recipes/">Browse recipes</a>
      <a class="btn btn-outline" href="#latest">What’s new this week</a>
    </div>
  </div>
  ${carousel(featured, 'Featured recipes')}
</section>

<section class="wrap section-tight">
  <h2 class="h3">What are you in the mood for?</h2>
  <div class="loop-row" data-loop>
    ${arrowBtn('prev', 'Previous categories', 'data-loop-prev')}
    <div class="loop-track" data-loop-track>
      ${CATEGORIES.map((c) => `<a class="pill" href="/recipes/?category=${encodeURIComponent(c.label)}"><span style="background:${c.tint}"></span>${c.label}</a>`).join('\n      ')}
    </div>
    ${arrowBtn('next', 'More categories', 'data-loop-next')}
  </div>
</section>

<section id="latest" class="band">
  <div class="wrap section">
    <div class="section-head"><h2>Latest recipes</h2><a href="/recipes/">See all recipes</a></div>
    <ul class="recipe-list">
      ${latest.map(listItem).join('\n      ')}
    </ul>
  </div>
</section>

<section class="wrap section">
  <h2>Collections</h2>
  <p class="sub">Instagram series, all in one place.</p>
  <div class="tile-grid">
    ${collections.map((c) => `<a class="tile" href="/collections/?c=${c.slug}" style="background:${c.colour}">
      <span class="tile-count">${c.recipes.length} recipe${c.recipes.length === 1 ? '' : 's'}</span>
      <span><span class="tile-title">${esc(c.title)}</span><span class="tile-blurb">${esc(c.blurb)}</span></span>
    </a>`).join('\n    ')}
  </div>
</section>

<section class="rule">
  <div class="wrap section">
    <p class="eyebrow">Hi, I’m Natasha</p>
    <h2 class="about-h">I cook the food I actually want to eat – and make it easy for you too.</h2>
    <div class="about-row">
      <img class="portrait-round" src="${esc(about.photo)}" alt="Natasha smiling in her kitchen">
      <div class="about-copy">
        <p>${esc(bio)}</p>
        <a class="link-arrow" href="/about/">Read more about me ${ICON.arrow}</a>
      </div>
    </div>
  </div>
</section>

${socialBand()}` });
}

const listItem = (r) => `<li data-category="${esc(r.category)}" data-mins="${r.mins}" data-date="${esc(r.date)}" data-search="${esc((r.title + ' ' + r.ingredients.map((g) => g.items.join(' ')).join(' ')).toLowerCase())}">
        <a href="${r.url}">
          ${thumb(r, 'list-thumb')}
          <span class="list-text"><span class="list-title">${esc(r.title)}</span><span class="list-meta">${esc(metaText(r))}</span></span>
          <span class="tag">${esc(r.category)}</span>${ICON.chev}
        </a>
      </li>`;

const socialBand = () => `<section class="social">
  <div class="wrap social-row">
    <h2>Watch it before you make it <span>${esc(site.handle)}</span></h2>
    <div class="btn-row">
      <a class="btn btn-white" href="${esc(site.instagram)}">Instagram</a>
      <a class="btn btn-ghost" href="${esc(site.tiktok)}">TikTok</a>
    </div>
  </div>
</section>`;

function recipesIndex() {
  return page({ title: 'All recipes – ForFoodSake', active: 'recipes', body: `
<section class="band">
  <div class="wrap page-head">
    <p class="eyebrow">The recipe index</p>
    <h1>All recipes</h1>
    <p class="lead">Every recipe from Instagram and TikTok, all in one place. Search by name or ingredient, or filter by what you fancy.</p>
    <label class="search big">${ICON.search}<span class="sr">Search recipes</span><input type="search" data-recipe-search placeholder="Search by recipe or ingredient, e.g. chicken"></label>
  </div>
</section>
<section class="wrap section-tight" data-recipe-index>
  <div class="filters">
    ${['All', ...CATEGORIES.map((c) => c.label)].map((c, i) => `<button type="button" class="filter${i === 0 ? ' on' : ''}" data-filter="${esc(c)}" aria-pressed="${i === 0}">${c}</button>`).join('\n    ')}
  </div>
  <div class="toolbar">
    <span class="muted"><span data-count>${recipes.length}</span> recipes</span>
    <span class="sort">Sort by <button type="button" class="on" data-sort="newest" aria-pressed="true">Newest</button><button type="button" data-sort="quickest" aria-pressed="false">Quickest</button></span>
  </div>
  <ul class="recipe-list" data-list>
    ${recipes.map(listItem).join('\n    ')}
  </ul>
  <p class="muted empty" data-empty hidden>No recipes match that yet – try another search.</p>
</section>` });
}

function recipePage(r) {
  const more = recipes.filter((x) => x.slug !== r.slug && x.category === r.category)
    .concat(recipes.filter((x) => x.slug !== r.slug && x.category !== r.category)).slice(0, 3);
  return page({ title: `${r.title} – ForFoodSake`, desc: r.description, active: 'recipes', body: `
<article class="wrap section-tight">
  <nav aria-label="Breadcrumb" class="crumbs"><a href="/">Home</a> / <a href="/recipes/">Recipes</a> / <a href="/recipes/?category=${encodeURIComponent(r.category)}">${esc(r.category)}</a></nav>
  <h1 class="recipe-h">${esc(r.title)}</h1>
  ${r.description ? `<p class="lead">${esc(r.description)}</p>` : ''}
  <div class="facts">
    <div><span>Prep</span><b>${esc(r.prep)} mins</b></div>
    <div><span>Cook</span><b>${esc(r.cook)} mins</b></div>
    <div><span>Serves</span><b>${esc(r.serves)}</b></div>
    <div><span>Difficulty</span><b>${esc(r.difficulty || 'Easy')}</b></div>
  </div>
  <div class="btn-row">
    <a class="btn btn-primary" href="#recipe">Jump to recipe</a>
    ${r.video ? `<a class="btn btn-outline" href="${esc(r.video)}">Watch the video</a>` : ''}
  </div>
  ${thumb(r, 'recipe-hero', '[Photo of the finished dish]')}

  <section id="recipe" class="recipe-card">
    <h2>${esc(r.title)}</h2>
    <div class="recipe-cols">
      <div>
        <h3>Ingredients</h3>
        ${r.ingredients.map((g) => (g.heading ? `<h4 style="margin:20px 0 4px;font-family:'Playfair Display',Georgia,serif;font-size:18px;color:#4A2C20">${esc(g.heading)}</h4>` : '') + g.items.map((i) => `<label class="ing"><input type="checkbox"><span>${esc(i)}</span></label>`).join('')).join('')}
      </div>
      <div>
        <h3>Method</h3>
        <ol class="steps">${(r.steps || []).map((s, i) => `<li><span>${i + 1}</span><p>${esc(s)}</p></li>`).join('')}</ol>
        ${r.tips ? `<div class="tips"><b>Natasha’s tips</b><p>${esc(r.tips)}</p></div>` : ''}
      </div>
    </div>
  </section>

  ${more.length ? `<section class="more">
    <h2>More like this</h2>
    <div class="card-grid">
      ${more.map((m) => `<a class="card" href="${m.url}">${thumb(m, 'card-img')}<span class="card-title">${esc(m.title)}</span><span class="muted">${esc(metaText(m))}</span></a>`).join('\n      ')}
    </div>
  </section>` : ''}
</article>` });
}

function collectionsPage() {
  return page({ title: 'Collections – ForFoodSake', active: 'collections', body: `
<section class="wrap page-head">
  <p class="eyebrow">Recipe series</p>
  <h1>Collections</h1>
  <p class="lead">Seasonal series and themed recipe sets, all in one place. Pick a collection to see every recipe in it.</p>
</section>
<section class="wrap section-tight" data-collections>
  <div class="loop-row" data-loop>
    ${arrowBtn('prev', 'Previous collections', 'data-loop-prev')}
    <div class="loop-track" data-loop-track>
      ${collections.map((c, i) => `<button type="button" class="tile tile-btn${i === 0 ? ' on' : ''}" data-col="${c.slug}" aria-pressed="${i === 0}" style="background:${c.colour}">
        <span class="tile-count">${c.recipes.length} recipe${c.recipes.length === 1 ? '' : 's'}</span>
        <span><span class="tile-title">${esc(c.title)}</span><span class="tile-blurb">${esc(c.blurb)}</span></span>
      </button>`).join('\n      ')}
    </div>
    ${arrowBtn('next', 'More collections', 'data-loop-next')}
  </div>
</section>
<section class="band">
  ${collections.map((c, i) => `<div class="wrap section col-panel" data-panel="${c.slug}"${i === 0 ? '' : ' hidden'}>
    <h2>${esc(c.title)}</h2>
    <p class="sub">${esc(c.intro)}</p>
    ${carousel(c.recipes, c.title + ' recipes')}
  </div>`).join('\n  ')}
</section>` });
}

function aboutPage() {
  return page({ title: 'About Natasha – ForFoodSake', active: 'about', body: `
<section class="wrap page-head">
  <p class="eyebrow">About</p>
  <h1>Hi, I’m Natasha.</h1>
  <p class="lead">${esc(about.intro)}</p>
</section>
<section class="wrap about-story">
  <div class="portrait-col">
    <img class="portrait-arch" src="${esc(about.photo)}" alt="Natasha smiling behind a kitchen counter with a big salad">
    <div class="tags">${(about.tags || []).map((t) => `<span>${esc(t)}</span>`).join('')}</div>
  </div>
  <div class="story-copy">
    <h2 class="h3">How it all started</h2>
    ${(about.story || []).map((p) => `<p>${esc(p)}</p>`).join('\n    ')}
  </div>
</section>
<section class="wrap section">
  <h2>What you’ll find here</h2>
  <div class="find-grid">
    <a href="/recipes/"><span style="background:#F2C6A8"></span><b>Easy recipes</b><p>Quick dinners, comfort food and sweet treats, written up step by step.</p></a>
    <a href="/collections/"><span style="background:#BFD6B4"></span><b>Collections</b><p>Series like No Meat Jan, Diwali and Cook Once, Eat Twice.</p></a>
    <a href="${esc(site.tiktok)}"><span style="background:#F3DE9C"></span><b>Recipe videos</b><p>Watch every recipe come together on Instagram and TikTok.</p></a>
  </div>
</section>
<section class="band travel">
  <div class="wrap section">
    <div class="travel-head">
      <div>
        <p class="eyebrow">Postcards from my travels</p>
        <h2>Where I’ve been eating</h2>
        <p class="sub">Travel is where a lot of my recipe ideas start. Here are a few food trips that stayed with me, and the dishes I brought home.</p>
      </div>
      <svg aria-hidden="true" width="260" height="80" viewBox="0 0 260 80" fill="none"><path d="M4 72 C 70 10, 150 10, 228 34" stroke="#A85A1F" stroke-width="2" stroke-dasharray="6 7" stroke-linecap="round"/><circle cx="4" cy="72" r="4" fill="#A85A1F"/><path d="M232 22 l22 14 -22 10 4 -12 z" fill="#4A2C20"/></svg>
    </div>
    <div class="postcards">
      ${(about.places || []).map((p, i) => `<article class="postcard" style="--rot:${[-1.5, 1, -0.5, 1.5, -1, 0.75, -0.75, 1.25, -1.25][i % 9]}deg">
        <div class="pc-photo" style="background:${['#C9DCE0', '#F2C6A8', '#F3DE9C', '#D9B3A3', '#E8B98F', '#BFD6B4'][i % 6]}">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : '<span>[Travel photo]</span>'}<span class="stamp"><b>${esc(p.code)}</b><i>Air mail</i></span></div>
        <div class="pc-text"><div><small>Greetings from</small><b>${esc(p.name)}</b><span>Must-eat: ${esc(p.dish)}</span></div><span class="postmark">Tasted<b>${esc(p.year)}</b></span></div>
      </article>`).join('\n      ')}
    </div>
  </div>
</section>
<section class="wrap section hello">
  <div>
    <h2>Say hello</h2>
    <p>Made one of my recipes? Tag me – I love seeing your versions. For anything else, email <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>.</p>
  </div>
  <div class="btn-row">
    <a class="btn btn-primary" href="${esc(site.instagram)}">Instagram</a>
    <a class="btn btn-outline" href="${esc(site.tiktok)}">TikTok</a>
  </div>
</section>` });
}

// ---------- build ----------
fs.rmSync(OUT, { recursive: true, force: true });
copyDir(path.join(ROOT, 'static'), OUT);
copyDir(path.join(ROOT, 'admin'), path.join(OUT, 'admin'));
write('index.html', home());
write('recipes/index.html', recipesIndex());
recipes.forEach((r) => write(`recipes/${r.slug}/index.html`, recipePage(r)));
write('collections/index.html', collectionsPage());
write('about/index.html', aboutPage());
write('404.html', page({ title: 'Page not found – ForFoodSake', body: '<section class="wrap page-head"><h1>Page not found</h1><p class="lead">That page has wandered off. <a href="/recipes/">Browse all recipes</a> instead.</p></section>' }));
console.log(`Built ${recipes.length} recipes, ${collections.length} collections into dist/`);
