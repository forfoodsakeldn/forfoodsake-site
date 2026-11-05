// ForFoodSake – small interactions, no libraries.
(function () {
  // ----- Carousels: centre slide pops out, half of neighbours visible, loops forever -----
  function initCarousel(root) {
    if (!root || root.dataset.ready) return;
    root.dataset.ready = '1';
    var stage = root.querySelector('.carousel-stage');
    var slides = Array.prototype.slice.call(root.querySelectorAll('.slide'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-dot]'));
    var n = slides.length, active = 0;
    if (!n) return;

    function render() {
      var W = stage.offsetWidth ? (slides[0].offsetWidth / stage.offsetWidth) * 100 : 44;
      var step = Math.max(50, W + 4);
      slides.forEach(function (s, i) {
        var off = (i - active + n) % n;
        if (off > n / 2) off -= n;
        s.style.left = ((100 - W) / 2 + off * step) + '%';
        s.style.opacity = off === 0 ? 1 : (Math.abs(off) === 1 ? 0.55 : 0);
        s.style.transform = off === 0 ? 'scale(1.08)' : 'scale(0.84)';
        s.style.boxShadow = off === 0 ? '0 16px 34px rgba(74,44,32,0.28)' : 'none';
        s.style.zIndex = off === 0 ? 2 : 1;
        s.style.pointerEvents = Math.abs(off) <= 1 ? 'auto' : 'none';
        s.setAttribute('tabindex', off === 0 ? '0' : '-1');
        s.dataset.off = off;
      });
      dots.forEach(function (d, i) { d.classList.toggle('on', i === active); });
    }
    function go(i) { active = ((i % n) + n) % n; render(); }

    root.querySelector('[data-prev]').addEventListener('click', function () { go(active - 1); });
    root.querySelector('[data-next]').addEventListener('click', function () { go(active + 1); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
    slides.forEach(function (s, i) {
      s.addEventListener('click', function (e) {
        if (Number(s.dataset.off) !== 0) { e.preventDefault(); go(i); }
      });
    });
    window.addEventListener('resize', render);
    render();
  }
  document.querySelectorAll('[data-carousel]').forEach(function (c) {
    if (!c.closest('[hidden]')) initCarousel(c);
  });

  // ----- Looping rows (categories, collection tiles) -----
  document.querySelectorAll('[data-loop]').forEach(function (row) {
    var track = row.querySelector('[data-loop-track]');
    row.querySelector('[data-loop-next]').addEventListener('click', function () {
      if (track.firstElementChild) track.appendChild(track.firstElementChild);
    });
    row.querySelector('[data-loop-prev]').addEventListener('click', function () {
      if (track.lastElementChild) track.insertBefore(track.lastElementChild, track.firstElementChild);
    });
  });

  // ----- Recipe index: search, category filter, sort -----
  var index = document.querySelector('[data-recipe-index]');
  if (index) {
    var list = index.querySelector('[data-list]');
    var items = Array.prototype.slice.call(list.children);
    var filters = Array.prototype.slice.call(index.querySelectorAll('[data-filter]'));
    var sorts = Array.prototype.slice.call(index.querySelectorAll('[data-sort]'));
    var search = document.querySelector('[data-recipe-search]');
    var params = new URLSearchParams(location.search);
    var state = { cat: params.get('category') || 'All', sort: 'newest', q: (params.get('q') || '').toLowerCase() };
    if (search) search.value = params.get('q') || '';

    function apply() {
      var shown = 0;
      items.sort(function (a, b) {
        return state.sort === 'quickest'
          ? Number(a.dataset.mins) - Number(b.dataset.mins)
          : b.dataset.date.localeCompare(a.dataset.date);
      }).forEach(function (li) {
        var ok = (state.cat === 'All' || li.dataset.category === state.cat) &&
          (!state.q || li.dataset.search.indexOf(state.q) !== -1);
        li.hidden = !ok;
        if (ok) shown++;
        list.appendChild(li);
      });
      index.querySelector('[data-count]').textContent = shown;
      index.querySelector('[data-empty]').hidden = shown > 0;
      filters.forEach(function (b) { var on = b.dataset.filter === state.cat; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      sorts.forEach(function (b) { var on = b.dataset.sort === state.sort; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    }
    filters.forEach(function (b) { b.addEventListener('click', function () { state.cat = b.dataset.filter; apply(); }); });
    sorts.forEach(function (b) { b.addEventListener('click', function () { state.sort = b.dataset.sort; apply(); }); });
    if (search) search.addEventListener('input', function () { state.q = search.value.trim().toLowerCase(); apply(); });
    apply();
  }

  // ----- Collections page: pick a collection, show its recipe carousel -----
  var cols = document.querySelector('[data-collections]');
  if (cols) {
    var tiles = Array.prototype.slice.call(cols.querySelectorAll('[data-col]'));
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-panel]'));
    function select(slug) {
      tiles.forEach(function (t) { var on = t.dataset.col === slug; t.classList.toggle('on', on); t.setAttribute('aria-pressed', on); });
      panels.forEach(function (p) {
        p.hidden = p.dataset.panel !== slug;
        if (!p.hidden) initCarousel(p.querySelector('[data-carousel]'));
      });
    }
    tiles.forEach(function (t) { t.addEventListener('click', function () { select(t.dataset.col); }); });
    var wanted = new URLSearchParams(location.search).get('c');
    if (wanted && tiles.some(function (t) { return t.dataset.col === wanted; })) select(wanted);
  }
})();
