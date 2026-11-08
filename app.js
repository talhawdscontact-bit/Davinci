/* DaVinci Flora & Living: frontend prototype. No backend; the basket and every form are demonstrations. */
(function () {
  const D = window.DV;
  const $ = (s, e) => (e || document).querySelector(s);
  const $$ = (s, e) => Array.from((e || document).querySelectorAll(s));
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const eur = (n) => '€' + Number(n).toLocaleString('en-US');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const byId = (id) => D.products.find((p) => p.id === id);
  const catName = (shop, c) => (D.shops[shop].cats.find((x) => x[0] === c) || [])[1] || '';
  const ARR = '<svg class="arr" viewBox="0 0 18 10" aria-hidden="true"><path d="M0 5h17M12 1l5 4-5 4"/></svg>';
  const TICK = '<svg class="tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8.5l4 4 8-9"/></svg>';
  const ICON_S = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>';
  const ICON_B = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>';
  let intent = 'visit';

  /* ---------- helpers ---------- */
  function sp(html) {
    let i = 0;
    return html.split(/(<[^>]+>)/).map((p) => p.charAt(0) === '<' ? p : p.split(/(\s+)/).map((w) => /^\s*$/.test(w) ? w : '<span class="w"><span class="wi" style="--wi:' + i++ + '">' + w + '</span></span>').join('')).join('');
  }
  /* Photo slots: a slot shows its photo once listed in DV_PHOTOS.ready, otherwise a labelled illustration. */
  const PH = window.DV_PHOTOS || { ready: {}, slots: {} };
  const artFor = {};
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const isReady = (key) => !!(key && PH.ready[key]);
  const labelFor = (key) => { const t = ((PH.slots[key] || {}).label || 'Illustration · photo to come').split(' · '); return '<span class="phlabel"><span>' + t[0] + '</span><span class="l2"> · ' + t.slice(1).join(' · ') + '</span></span>'; };
  function pic(key, o) {
    const sl = PH.slots[key] || {};
    const set = (pre, ws) => ws.map((w) => 'img/' + pre + '-' + w + '.webp ' + w + 'w').join(', ');
    const W = sl.hero ? [800, 1600, 2400] : [600, 1200];
    return '<picture>' + (sl.hero ? '<source media="(max-width: 640px)" srcset="' + set(key + '-m', [600, 1200]) + '" sizes="100vw">' : '') +
      '<img src="img/' + key + '-' + (sl.hero ? 1600 : 1200) + '.webp" srcset="' + set(key, W) + '" sizes="' + (o.sizes || (sl.hero ? '100vw' : '(max-width: 640px) 50vw, 33vw')) + '" alt="' + esc(o.alt || sl.alt || '') + '"' +
      (o.eager ? ' loading="eager" fetchpriority="high"' : ' loading="lazy"') + ' decoding="async" data-slot="' + key + '" style="--fx:' + (sl.fx || '50% 50%') + ';--fxm:' + (sl.fxm || sl.fx || '50% 50%') + '"></picture>';
  }
  function slot(spec, cls, o) {
    o = o || {};
    const real = isReady(o.photo);
    if (o.photo) artFor[o.photo] = spec;
    return '<div class="ph ' + (cls || '') + (real ? ' is-photo' : ' is-ill') + (o.reveal ? ' revimg' : '') + '"' + (o.reveal ? ' data-reveal style="--d:' + (o.d || 0) + 's"' : '') + (real ? '' : ' role="img" aria-label="' + esc((o.alt || (PH.slots[o.photo] || {}).alt || 'Illustration') + ' (illustration)') + '"') + '>' +
      '<div class="pi"' + (o.par ? ' data-par="' + o.par + '"' : '') + '><div class="zi">' + (real ? pic(o.photo, o) : window.DV_ART(spec)) + '</div></div>' +
      (real || o.nolabel ? '' : labelFor(o.photo)) + (o.inner || '') + '</div>';
  }
  /* A photo that fails to load falls back to its illustration, never a broken image. */
  document.addEventListener('error', (e) => {
    const img = e.target; if (!img || img.tagName !== 'IMG' || !img.dataset.slot) return;
    const k = img.dataset.slot, pc = img.closest('picture'), ph = img.closest('.ph,.layer,.thumb');
    if (!pc || !artFor[k]) return;
    pc.outerHTML = window.DV_ART(artFor[k]);
    if (ph && !ph.querySelector('.phlabel') && !ph.classList.contains('thumb')) ph.insertAdjacentHTML('beforeend', labelFor(k));
  }, true);
  function hero(key, spec, o) {
    return '<section class="phero ' + (o.side || 'left') + ' ' + (o.size || 'full') + (o.cls ? ' ' + o.cls : '') + '">' +
      slot(spec, 'phero-img', { photo: key, eager: 1, reveal: 1, par: .07, sizes: '100vw' }) + '<div class="phero-shade" aria-hidden="true"></div>' +
      '<div class="wrap phero-in"><div class="phero-copy">' + o.copy + '</div>' + (o.aside || '') + '</div></section>';
  }
  const unit = (p, sel) => p.price + (p.variants || []).reduce((s, v, i) => s + v.opts[sel[i] || 0][1], 0);
  const fromTag = (p) => ((p.variants || []).some((v) => v.opts.some((o) => o[1] > 0)) ? 'From ' : '');

  /* ---------- cart ---------- */
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('dv-demo-cart') || '[]').filter((i) => byId(i.id)); } catch (e) { cart = []; }
  const saveCart = () => { try { localStorage.setItem('dv-demo-cart', JSON.stringify(cart)); } catch (e) { /* storage unavailable */ } };
  const cartCount = () => cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = () => cart.reduce((s, i) => s + i.qty * i.unit, 0);
  function addToCart(id, sel, qty) {
    const p = byId(id); sel = sel || (p.variants || []).map(() => 0);
    const key = id + '|' + sel.join('.');
    const ex = cart.find((i) => i.key === key);
    if (ex) ex.qty += qty || 1; else cart.push({ key, id, sel, unit: unit(p, sel), qty: qty || 1, fresh: 1 });
    saveCart(); updateCount(true); return key;
  }
  function updateCount(bump) {
    $$('[data-count]').forEach((c) => { c.textContent = cartCount(); if (bump && !RM) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } });
  }
  const optLabels = (i) => { const p = byId(i.id); return (p.variants || []).map((v, k) => v.opts[i.sel[k] || 0][0]).join(' · '); };

  function drawerHTML() {
    const head = '<div class="dr-head"><h2>Your basket</h2><button class="ibtn" data-close aria-label="Close basket">Close</button></div>';
    if (!cart.length) return head + '<div class="dr-body"><div class="dr-empty"><p>Your basket is empty.</p><div class="row"><a class="btn sm" href="#flora" data-close>Flora ' + ARR + '</a><a class="btn sm clay" href="#living" data-close>Living ' + ARR + '</a></div></div></div>';
    let body = '';
    ['flora', 'living'].forEach((s) => {
      const items = cart.filter((i) => byId(i.id).shop === s);
      if (!items.length) return;
      body += '<div class="grp-t ' + s + '"><span>' + D.shops[s].name + ' webshop</span><span class="tnum">' + eur(items.reduce((a, i) => a + i.qty * i.unit, 0)) + '</span></div>';
      body += items.map((i) => {
        const p = byId(i.id);
        return '<div class="li' + (i.fresh ? ' fresh' : '') + '" data-key="' + i.key + '">' + slot(p.art, 'ar45', { photo: 'p-' + p.id + '-1', nolabel: 1, sizes: '80px', alt: p.name }) +
          '<div><div class="n">' + p.name + '</div><div class="v">' + optLabels(i) + '</div>' +
          '<div class="qty"><button data-cq="-1" data-k="' + i.key + '" aria-label="Fewer">&minus;</button><output class="' + (i.bumped ? 'tick-n' : '') + '">' + i.qty + '</output><button data-cq="1" data-k="' + i.key + '" aria-label="More">+</button></div>' +
          '<button class="rm" data-crm="' + i.key + '">Remove</button></div><div class="price">' + eur(i.qty * i.unit) + '</div></div>';
      }).join('');
    });
    cart.forEach((i) => { i.fresh = 0; i.bumped = 0; });
    return head + '<div class="dr-body">' + body + '</div><div class="dr-foot"><div class="sum"><span>Subtotal</span><span class="tnum">' + eur(cartTotal()) + '</span></div><div class="sum"><span>Delivery</span><span>Calculated at checkout (to be confirmed)</span></div><div class="sum t"><span>Total</span><b class="tnum">' + eur(cartTotal()) + '</b></div><button class="btn full" data-checkout>Checkout (demo) ' + ARR + '</button><p class="note">Prototype basket. Prices and products are placeholders; no order is placed.</p></div>';
  }
  const drawer = () => $('#drawer');
  function renderDrawer() { drawer().innerHTML = drawerHTML(); }
  let lastFocus = null;
  function layer(sel, on) {
    const el = $(sel); el.classList.toggle('on', on);
    $('#scrim').classList.toggle('on', on || $$('.drawer.on,.search.on,.modal.on').length > 0);
    document.body.style.overflow = $$('.drawer.on,.search.on,.modal.on,.menu-open').length ? 'hidden' : '';
    if (on) { lastFocus = document.activeElement; setTimeout(() => { const f = $('[data-close],input', el); if (f) f.focus({ preventScroll: true }); }, 60); }
    else if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function openCart() { renderDrawer(); layer('#drawer', true); }
  function closeAll() {
    ['#drawer', '#search', '#modal'].forEach((s) => $(s).classList.remove('on'));
    $('#scrim').classList.remove('on'); setMenu(false);
    document.body.style.overflow = '';
  }
  function setMenu(on) {
    if (on) { const hb = $('#hdr').getBoundingClientRect().bottom; $('#mmenu').style.paddingTop = Math.round(Math.max(hb, 60) + 32) + 'px'; }
    document.body.classList.toggle('menu-open', on);
    $('#burger').setAttribute('aria-expanded', on);
    document.body.style.overflow = on ? 'hidden' : '';
  }
  let toastT;
  function toast(msg, withCart) {
    const t = $('#toast');
    t.innerHTML = '<span>' + msg + '</span>' + (withCart ? '<button data-open-cart>View basket</button>' : '');
    t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3600);
  }
  function modal(html) { $('#modal').innerHTML = '<div class="modal-box" role="dialog" aria-modal="true"><button class="xbtn" data-close aria-label="Close">&times;</button>' + html + '</div>'; layer('#modal', true); }

  /* ---------- chrome ---------- */
  function mountChrome() {
    const dd = (s) => '<div class="dd">' + D.shops[s].cats.map((c) => '<a href="#' + s + '-' + c[0] + '">' + c[1] + '</a>').join('') + '<a class="all" href="#' + s + '">Shop all ' + D.shops[s].name + '</a></div>';
    $('#hdr').innerHTML = '<div class="wrap hdr-in">' +
      '<nav class="nav" aria-label="Main"><a class="nl" href="#home" data-nav="home">Home</a>' +
      '<div class="nav-item"><a class="nl" href="#flora" data-nav="flora">Flora<span class="lg"> webshop</span></a>' + dd('flora') + '</div>' +
      '<div class="nav-item"><a class="nl" href="#living" data-nav="living">Living<span class="lg"> webshop</span></a>' + dd('living') + '</div>' +
      '<a class="nl" href="#workshops" data-nav="workshops">Workshops</a></nav>' +
      '<button class="burger" id="burger" aria-label="Menu" aria-expanded="false" aria-controls="mmenu"><i></i><i></i></button>' +
      '<a class="brand" href="#home" aria-label="DaVinci Flora and Living, home"><b>DaVinci</b><small>Flora &amp; Living</small></a>' +
      '<div class="nav right"><a class="nl" href="#projects" data-nav="projects">Projects</a><a class="nl" href="#showroom" data-nav="showroom">Showroom<span class="lg"> / Contact</span></a>' +
      '<button class="ibtn" data-open-search aria-label="Search">' + ICON_S + '</button>' +
      '<button class="ibtn" data-open-cart aria-label="Open basket">' + ICON_B + '<span class="count" data-count>0</span></button></div>' +
      '<div class="mob-r"><button class="ibtn" data-open-search aria-label="Search">' + ICON_S + '</button><button class="ibtn" data-open-cart aria-label="Open basket">' + ICON_B + '<span class="count" data-count>0</span></button></div></div>';
    $('#mmenu').innerHTML = '<div>' + [['home', 'Home'], ['flora', 'Flora webshop'], ['living', 'Living webshop'], ['workshops', 'Workshops'], ['projects', 'Projects'], ['showroom', 'Showroom / Contact']].map((l, i) => '<a class="big" style="--i:' + i + '" href="#' + l[0] + '">' + l[1] + '</a>').join('') + '</div>' +
      '<div class="mmenu-foot"><button class="link" data-open-search>Search</button><button class="link" data-open-cart>Basket (<span data-count>0</span>)</button></div>';
    $('#ftr').innerHTML = footerHTML();
    updateCount();
  }
  function footerHTML() {
    const l = (sh) => D.shops[sh].cats.map((c) => '<li><a href="#' + sh + '-' + c[0] + '">' + c[1] + '</a></li>').join('');
    return '<div class="wrap"><div class="ftr-lead"><p class="big">Two webshops.<br>One DaVinci.</p>' +
      '<div class="ftr-news"><p>New arrivals and workshop dates, about once a month.</p><form class="nl-form" data-form="news" novalidate><label class="sr" for="nl-mail">Email address</label><input id="nl-mail" type="email" placeholder="Your email address" autocomplete="email"><button type="submit">Sign up</button></form><p id="nl-ok" class="tbc" style="margin-top:10px;min-height:1.4em" aria-live="polite"></p></div></div>' +
      '<div class="ftr-top"><div><h4>Flora</h4><ul>' + l('flora') + '</ul></div><div><h4>Living</h4><ul>' + l('living') + '</ul></div>' +
      '<div><h4>DaVinci</h4><ul><li><a href="#workshops">Workshops</a></li><li><a href="#projects">Projects</a></li><li><a href="#showroom">Showroom / Contact</a></li><li><a href="#showroom" data-intent="advice">Personal advice</a></li></ul></div>' +
      '<div class="ftr-visit"><h4>Visit</h4><p>Showroom in Almere, the Netherlands</p><p class="tbc" style="margin:6px 0 14px">Opening expected December 2026, to be confirmed</p><a class="link" href="#showroom" data-intent="visit">Plan a visit</a></div></div>' +
      '<div class="ftr-word" aria-hidden="true">DaVinci</div>' +
      '<div class="ftr-bot"><span>&copy; 2026 DaVinci Flora &amp; Living</span><span>Delivery, returns, payment and privacy details to be confirmed before launch.</span></div></div>';
  }

  /* ---------- card ---------- */
  function card(p, i, o) {
    o = o || {};
    return '<article class="card' + (o.enter ? ' enter' : '') + '" style="--i:' + i + (o.reveal ? ';--d:' + ((i % 4) * .09) + 's' : '') + '"' + (o.reveal ? ' data-reveal' : '') + '>' +
      '<div class="cmedia">' + slot(p.art, 'zoom ar45', { photo: 'p-' + p.id + '-1', alt: p.name + ', ' + p.sub, sizes: '(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw', inner: p.badge ? '<span class="tag">' + p.badge + '</span>' : '' }) +
      '<button class="btn sm full quick" data-add="' + p.id + '" aria-label="Add ' + esc(p.name) + ' to basket">Add to basket</button></div>' +
      '<div>' + (o.tag ? '<span class="shoptag ' + p.shop + '">' + D.shops[p.shop].name + ' · ' + catName(p.shop, p.cat) + '</span>' : '') +
      '<h3 class="nm"><a class="stretch" href="#product-' + p.id + '">' + p.name + '</a></h3><p class="sb">' + p.sub + '</p></div>' +
      '<div class="row"><span class="price">' + fromTag(p) + eur(p.price) + '</span></div></article>';
  }

  /* ---------- pages ---------- */
  const ARR_L = '<svg viewBox="0 0 22 12" aria-hidden="true"><path d="M0 6h21M16 1l5 5-5 5"/></svg>';
  const worldName = (w) => (w === 'both' ? 'Flora + Living' : D.shops[w].name);
  const catCount = (s, c) => D.products.filter((p) => p.shop === s && p.cat === c).length;
  const items = (n) => n + (n === 1 ? ' item' : ' items');
  function homePage() {
    const feat = ['olive-leccino', 'paint-calce', 'lemon-meyer', 'tile-zellige', 'pot-impruneta', 'plaster-lime', 'agave', 'micro-kit'].map(byId);
    const cats = (s) => '<ul class="catlist">' + D.shops[s].cats.map((c) => '<li><a href="#' + s + '-' + c[0] + '"><span>' + c[1] + '</span><small>' + items(catCount(s, c[0])) + '</small>' + ARR_L + '</a></li>').join('') + '</ul>';
    const wsRows = D.workshops.slice(0, 4).map((w) => '<a class="wsrow" href="#workshops" data-reveal><span class="d">' + w.date.replace(/^\w+ /, '') + '</span><span class="t">' + w.title + '</span><span class="m">' + w.dur + ' · ' + eur(w.price) + '</span><span class="chipcell"><span class="chip ' + w.theme + '">' + worldName(w.theme) + '</span></span></a>').join('');
    const feature = (shop) => {
      const F = shop === 'flora';
      return '<section class="sec ' + (F ? 'tone-ivory flora-c' : 'tone-cream living-c') + '"><div class="wrap feature' + (F ? '' : ' flip') + '">' +
        '<div class="feature-media">' + slot(F ? { k: 'citrus', s: 31, big: 1 } : { k: 'swatch', s: 1 }, 'main zoom', { photo: F ? 'home-flora-feature' : 'home-living-feature', sizes: '(max-width: 960px) 100vw, 52vw', reveal: 1, par: .05 }) +
        slot(F ? { k: 'olive', s: 12, w: ['#e8dcc0', '#cdb58c'] } : { k: 'plaster', s: 61, col: '#d4bc96' }, 'detail', { photo: F ? 'home-flora-detail' : 'home-living-detail', sizes: '260px', reveal: 1, d: .35, nolabel: 1 }) + '</div>' +
        '<div class="copy"><p class="shopname" data-reveal>' + (F ? 'Flora webshop' : 'Living webshop') + '</p><h2 class="h2" data-split>' + sp(F ? 'Trees that grow into the place' : 'Surfaces with depth') + '</h2>' +
        '<p class="lead" data-reveal>' + (F ? 'Olive and citrus, lavender and agave, in pots chosen to age well. Choose a plant, or a plant already paired with its pot.' : 'Mineral paint, lime plaster, zellige and microcement, with the tools to apply them. Start with a sample and see the colour in your own light.') + '</p>' +
        cats(shop) + '<div data-reveal><a class="btn' + (F ? '' : ' clay') + '" href="#' + shop + '">Shop ' + (F ? 'Flora' : 'Living') + ' ' + ARR + '</a></div></div></div></section>';
    };
    const P = D.projects;
    const mini = (p) => '<a class="pj-mini" href="#projects" data-pj="' + p.id + '" data-reveal>' + slot(p.art, 'zoom', { photo: 'project-' + p.id, sizes: '(max-width: 960px) 50vw, 20vw' }) + '<div class="txt"><div class="meta"><span>' + worldName(p.world) + '</span></div><h3>' + p.title + '</h3><p>' + p.text + '</p><span class="link">View project</span></div></a>';
    const steps = [['visit', '01', 'Visit the showroom', 'See colours, plasters and tiles in daylight. Our Almere showroom opens soon.', '#showroom'], ['advice', '02', 'Ask for advice', 'Not sure which tree, finish or colour? Ask, and get a considered answer.', '#showroom'], ['project', '03', 'Discuss a project', 'Planning a terrace, a room or a renovation? Talk it through with us.', '#showroom'], ['', '04', 'Join a workshop', 'Learn plant care, colour and plaster techniques, hands on.', '#workshops']];
    return hero('home-hero', { k: 'courtyard', s: 41 }, { side: 'left', size: 'full', copy:
        '<p class="kicker" data-reveal>Plants · Interiors · Workshops, Italian-inspired</p>' +
        '<h1 class="h1" data-split>' + sp('Two webshops.<br> One <em>DaVinci.</em>') + '</h1>' +
        '<p class="hero-sub" data-reveal style="--d:.6s">Olive trees and lime walls, terracotta and travertine. Shop plants or interior materials, add from both, and check out once.</p>' +
        '<div class="phero-cta" data-reveal style="--d:.75s"><a class="btn ivory" href="#flora">Shop Flora ' + ARR + '</a><a class="btn light" href="#living">Shop Living ' + ARR + '</a></div>' }) +

      '<section class="choose-sec"><div class="wrap"><div class="choose-head"><p class="eyebrow" data-reveal>Choose your world</p><p class="h3" data-reveal style="--d:.1s">Plants or interiors, with workshops in between.</p></div><div class="choose">' +
      '<a class="door flora" href="#flora" aria-label="Enter the Flora webshop">' + slot({ k: 'olive', s: 21, big: 1 }, 'zoom', { photo: 'home-door-flora', sizes: '(max-width: 640px) 50vw, 40vw', reveal: 1, d: .05, par: .05, inner: '<div class="shade"></div>' }) + '<div class="cap"><h2>Flora</h2><p>Olive and citrus trees, Mediterranean plants, pots and planters.</p><span class="go">Enter Flora webshop</span></div></a>' +
      '<a class="bridge" href="#workshops" data-reveal style="--d:.5s"><span class="bridge-node">' + slot({ k: 'workshop', s: 14 }, 'zoom round', { photo: 'home-bridge', sizes: '190px' }) + '</span><h3>Workshops</h3><p>Where Flora and Living meet.</p><span class="link">Learn together</span></a>' +
      '<a class="door living" href="#living" aria-label="Enter the Living webshop">' + slot({ k: 'interior', s: 12 }, 'zoom', { photo: 'home-door-living', sizes: '(max-width: 640px) 50vw, 40vw', reveal: 1, d: .2, par: .05, inner: '<div class="shade"></div>' }) + '<div class="cap"><h2>Living</h2><p>Paint, wall finishes, tiles, microcement and tools.</p><span class="go">Enter Living webshop</span></div></a>' +
      '</div></div></section>' +

      '<section class="sec tone-cream manifesto-sec"><div class="wrap"><div class="manifesto"><p class="big" data-lit>' + 'Olive groves and lime walls. Terracotta and travertine. DaVinci brings the plants and the materials of an Italian home under one roof, with the advice to use them well.'.split(' ').map((w) => '<span class="mw">' + w + '</span>').join(' ') + '</p></div></div></section>' +

      feature('flora') + feature('living') +

      '<section class="sec tone-olive"><div class="wrap"><div class="ws-top"><div><p class="kicker" data-reveal>Workshops</p><h2 class="h2" data-split style="margin-top:14px">' + sp('Where Flora and Living meet') + '</h2></div><div style="display:grid;gap:24px"><p data-reveal>Learn to care for a tree, read a colour, trowel a wall. Workshops bring plants, styling and materials together in one room.</p><div data-reveal><a class="btn light" href="#workshops">All workshops ' + ARR + '</a></div></div></div><div class="wslist">' + wsRows + '</div><p class="note" style="margin-top:18px;color:var(--on-dark-muted);border-color:var(--on-dark-muted)" data-reveal>Example dates. The programme is confirmed before launch.</p></div></section>' +

      '<section class="sec tone-ivory"><div class="wrap"><div class="sechead"><div><span class="eyebrow">One basket for both</span><h2 class="h2" data-split>' + sp('From both shops') + '</h2></div><div class="sechead-links"><a class="link" href="#flora">Shop Flora</a><a class="link" href="#living">Shop Living</a></div></div><div class="pgrid">' + feat.map((p, i) => card(p, i, { reveal: 1, tag: 1 })).join('') + '</div></div></section>' +

      '<section class="sec tone-linen"><div class="wrap"><div class="sechead"><div><span class="eyebrow">Projects</span><h2 class="h2" data-split>' + sp('Rooms and gardens') + '</h2></div><div class="sechead-links"><a class="link" href="#projects">All projects</a></div></div>' +
      '<div class="rooms"><a class="big" href="#projects" data-pj="' + P[0].id + '" data-reveal>' + slot(P[0].art, 'zoom', { photo: 'project-' + P[0].id, sizes: '(max-width: 960px) 100vw, 58vw' }) + '<div class="shade"></div><div class="pj-cap"><div class="meta"><span>' + worldName(P[0].world) + '</span><span>' + P[0].place + '</span></div><h3>' + P[0].title + '</h3><p>' + P[0].text + '</p></div></a>' +
      '<div class="col">' + mini(P[1]) + mini(P[2]) + '</div></div></div></section>' +

      '<section class="sec tone-ivory"><div class="wrap"><div class="nextstep" data-reveal><div class="ns-intro"><div style="display:grid;gap:18px"><span class="eyebrow">Visit · Ask · Plan · Learn</span><h2 class="h2">Your next step</h2><p>Every room and garden starts with a conversation, in the showroom or online.</p></div>' +
      slot({ k: 'interior', s: 77, w: ['#e5d4b4', '#c9ab7e'] }, 'zoom', { photo: 'home-nextstep', sizes: '(max-width: 960px) 100vw, 36vw' }) + '</div>' +
      '<div class="ns-paths">' + steps.map((s) => '<a class="ns-path" href="' + s[4] + '"' + (s[0] ? ' data-intent="' + s[0] + '"' : '') + '><span class="n">' + s[1] + '</span><div><h3>' + s[2] + '</h3><p>' + s[3] + '</p></div>' + ARR_L + '</a>').join('') + '</div></div></div></section>';
  }

  let shopState = { shop: 'flora', cat: 'all', q: '' };
  function shopList() {
    const q = shopState.q.trim().toLowerCase();
    return D.products.filter((p) => p.shop === shopState.shop && (shopState.cat === 'all' || p.cat === shopState.cat) &&
      (!q || (p.name + ' ' + p.sub + ' ' + catName(p.shop, p.cat)).toLowerCase().includes(q)));
  }
  /* Shop categories as an index band, so they read differently from the product grid below.
     Flora: round images, olive. Living: square sample images, numbered, terracotta. */
  function shopIndex(shop) {
    const S = D.shops[shop], F = shop === 'flora';
    const total = D.products.filter((p) => p.shop === shop).length;
    const rows = S.cats.map((c, i) => {
      const p = D.products.find((x) => x.shop === shop && x.cat === c[0]);
      return '<a class="fi-row" href="#' + shop + '-' + c[0] + '" data-reveal style="--d:' + (i * .05) + 's">' + slot(p.art, 'zoom fi-img', { photo: 'cat-' + shop + '-' + c[0], sizes: '120px' }) +
        '<span class="fi-txt">' + (F ? '' : '<span class="fi-idx">0' + (i + 1) + '</span>') + '<span class="fi-nm">' + c[1] + '</span><span class="fi-desc">' + c[2] + '</span></span><span class="fi-cnt">' + items(catCount(shop, c[0])) + '</span>' + ARR_L + '</a>';
    }).join('') +
      '<a class="fi-row fi-all" href="#' + shop + '" data-scroll="#toolbar" data-reveal style="--d:.25s"><span class="fi-dot" aria-hidden="true">' + total + '</span><span class="fi-txt"><span class="fi-nm">All of ' + S.name + '</span><span class="fi-desc">' + (F ? 'Every tree, plant and pot in one view.' : 'Every paint, finish, tile and tool in one view.') + '</span></span><span class="fi-cnt">' + items(total) + '</span>' + ARR_L + '</a>';
    return '<section class="shop-index"><div class="wrap fi-grid"><div class="fi-head"><span class="eyebrow" data-reveal>Shop by category</span><h2 class="h2" data-split>' + sp(F ? 'Grown for the sun' : 'Materials with a maker\'s hand') + '</h2>' +
      '<p class="lead" data-reveal>' + (F ? 'Trees, plants, pots, or a plant already paired with its pot. Every plant is chosen to last on a terrace, in a courtyard or by a bright window.' : 'From the first colour sample to the trowel that applies it. Every material is chosen for depth, warmth and the way it changes with the light.') + '</p></div>' +
      '<div class="fi-list">' + rows + '</div></div></section>';
  }
  /* a slow ribbon of words; it speeds up briefly while the page scrolls */
  function marquee(words) {
    const run = '<span>' + words.map((w) => w + '<i aria-hidden="true"></i>').join('') + '</span>';
    return '<div class="marquee" aria-hidden="true"><div class="mq-track">' + run + run + '</div></div>';
  }
  function shopPage(shop, cat) {
    shopState = { shop, cat, q: '' };
    const S = D.shops[shop], isF = shop === 'flora';
    const heroCopy = '<p class="crumb"><a href="#home">Home</a><span>/</span><span>' + S.name + ' webshop</span></p>' +
      '<h1 class="h1 shop-h1" data-split>' + sp(S.name) + '</h1>' +
      '<p class="hero-sub" data-reveal style="--d:.4s">' + (isF ? 'Olive and citrus trees, Mediterranean plants and terracotta, chosen for the sun and built to last.' : 'Mineral paint, lime plaster, tiles and microcement, with the tools to apply them. Surfaces with depth.') + '</p>' +
      '<div class="phero-cta" data-reveal style="--d:.55s">' + (isF ? '<a class="btn ivory" href="#flora-olive">Shop olive trees ' + ARR + '</a>' : '<a class="btn ivory" href="#product-paint-samples">Order colour samples ' + ARR + '</a>') + '<button class="btn light" data-scroll="#toolbar">See the full range</button></div>';
    const band = isF
      ? '<section class="sec tone-cream"><div class="wrap care">' + slot({ k: 'olive', s: 77, pot: '#9a4a2a' }, 'zoom', { photo: 'flora-care', sizes: '(max-width: 960px) 100vw, 36vw', reveal: 1 }) +
        '<div class="copy"><span class="eyebrow" data-reveal>Seasonal care</span><h2 class="h2" data-split>' + sp('Winter care for olive and citrus') + '</h2><p class="lead" data-reveal>Most olives cope with light frost in a sheltered spot. Citrus prefer a bright, cool and frost-free room. Water sparingly until spring, and keep pots off cold stone.</p>' +
        '<div class="ch-actions" data-reveal><a class="btn" href="#workshops">Join the care workshop ' + ARR + '</a><a class="link" href="#showroom" data-intent="advice">Ask for plant advice</a></div></div></div></section>'
      : '<section class="sec tone-linen"><div class="wrap"><div class="library-head"><div><span class="eyebrow" data-reveal>Colour library</span><h2 class="h2" data-split style="margin-top:14px">' + sp('Earth tones, in your own light') + '</h2></div><div style="display:grid;gap:22px"><p class="lead" data-reveal>Eight example tones across our paints and plasters. Colour changes with daylight, so order samples and paint them on your own wall before you choose.</p><div data-reveal><a class="btn clay" href="#product-paint-samples">Order colour samples ' + ARR + '</a></div></div></div>' +
        '<div class="swatches">' + D.colours.map((c, i) => '<a class="swatch" href="#product-paint-samples" data-reveal style="--d:' + (i * .05) + 's;--c:' + c[1] + '"><i></i><b>' + c[0] + '</b><small>Example tone</small></a>').join('') + '</div></div></section>';
    return '<div class="shop-' + shop + '">' + hero(shop + '-hero', isF ? { k: 'grove', s: 17 } : { k: 'plasterroom', s: 23 }, { side: isF ? 'left' : 'right', size: 'shop', copy: heroCopy }) +
      shopIndex(shop) +
      '<div class="toolbar" id="toolbar"><div class="wrap toolbar-in"><div class="pills" id="pills" role="navigation" aria-label="Categories">' + pills() + '</div>' +
      '<label class="field">' + ICON_S + '<span class="sr">Search ' + S.name + '</span><input id="shopq" type="search" placeholder="Search ' + S.name + '" autocomplete="off"></label></div></div>' +
      '<div class="wrap shopgrid"><p id="shopcount" class="shopcount" aria-live="polite"></p><div class="pgrid" id="sgrid"></div><p class="note" style="margin-top:48px">Prototype products and placeholder prices. The real assortment, photography, stock and delivery details are confirmed before launch.</p></div>' +
      band + '</div>';
  }
  function pills() {
    const S = D.shops[shopState.shop];
    return [['all', 'All ' + S.name]].concat(S.cats.map((c) => [c[0], c[1]])).map((c) => '<a class="pill" href="#' + shopState.shop + (c[0] === 'all' ? '' : '-' + c[0]) + '"' + (shopState.cat === c[0] ? ' aria-current="true"' : '') + '>' + c[1] + '</a>').join('');
  }
  function fillGrid(animate) {
    const list = shopList();
    $('#sgrid').innerHTML = list.length ? list.map((p, i) => card(p, i, { enter: animate })).join('') : '<p class="empty">Nothing matches that search yet.</p>';
    $('#shopcount').textContent = list.length + (list.length === 1 ? ' product' : ' products') + (shopState.cat !== 'all' ? ' in ' + catName(shopState.shop, shopState.cat) : '');
  }

  const pdp = { id: '', sel: [], qty: 1, view: 0 };
  const VIEWS = [['1', '50% 50%'], ['2', '50% 18%'], ['2', '50% 88%']];
  function productPage(id) {
    const p = byId(id); if (!p) return homePage();
    Object.assign(pdp, { id, sel: (p.variants || []).map(() => 0), qty: 1, view: 0 });
    const S = D.shops[p.shop];
    /* Gallery: shot 1 packshot, 2 detail, 3 in place. Ready photos are shown; with none, three crops of the illustration. */
    const SHOTS = ['', 'detail', 'in place'];
    const real = [1, 2, 3].map((n) => 'p-' + p.id + '-' + n).filter(isReady);
    real.forEach((k) => { artFor[k] = p.art; });
    const views = real.length ? real.map((k, i) => ({ k, alt: p.name + (SHOTS[i] ? ', ' + SHOTS[i] : '') })) : VIEWS.map((v) => ({ v }));
    const inner = (x, thumb) => x.k ? '<div class="zl">' + pic(x.k, { alt: x.alt, sizes: thumb ? '90px' : '(max-width: 960px) 100vw, 55vw' }) + '</div>' : '<div class="zl" style="--s:' + x.v[0] + ';--o:' + x.v[1] + '">' + window.DV_ART(p.art) + '</div>';
    const layers = views.map((x, i) => '<div class="layer' + (i === 0 ? ' on' : '') + '" data-layer="' + i + '">' + inner(x) + '</div>').join('') + (real.length ? '' : labelFor('p-' + p.id + '-1'));
    const thumbs = views.length > 1 ? views.map((x, i) => '<button class="thumb" data-view="' + i + '" aria-label="Image ' + (i + 1) + ' of ' + views.length + '"' + (i === 0 ? ' aria-current="true"' : '') + '>' + inner(x, 1) + '</button>').join('') : '';
    const related = D.products.filter((x) => x.shop === p.shop && x.id !== p.id).slice(0, 4);
    return '<div class="wrap"><p class="crumb" style="padding-top:32px"><a href="#home">Home</a><span>/</span><a href="#' + p.shop + '">' + S.name + '</a><span>/</span><a href="#' + p.shop + '-' + p.cat + '">' + catName(p.shop, p.cat) + '</a></p>' +
      '<div class="pdp"><div class="gal' + (thumbs ? '' : ' single') + '" data-reveal><div class="thumbs">' + thumbs + '</div><div class="stage" id="stage" data-zoom>' + layers + '</div></div>' +
      '<div class="pinfo" data-reveal style="--d:.15s"><div><span class="shoptag ' + p.shop + '">' + S.name + ' webshop' + (p.badge ? ' · ' + p.badge : '') + '</span><h1 style="margin-top:12px">' + p.name + '</h1><p class="sub" style="margin-top:8px">' + p.sub + '</p></div>' +
      '<div class="big-price" id="pprice">' + eur(unit(p, pdp.sel)) + '</div><p style="color:var(--muted);max-width:52ch">' + p.desc + '</p>' +
      (p.variants || []).map((v, gi) => '<div class="vgrp"><div class="lbl">' + v.label + '<span id="vsel' + gi + '">' + v.opts[0][0] + '</span></div><div class="opts" role="radiogroup" aria-label="' + v.label + '">' + v.opts.map((o, oi) => '<button class="opt" role="radio" aria-checked="' + (oi === 0) + '" data-opt="' + gi + ':' + oi + '">' + o[0] + (o[1] ? ' <span style="opacity:.6">+' + eur(o[1]) + '</span>' : '') + '</button>').join('') + '</div></div>').join('') +
      '<div class="qtyrow"><div class="qty"><button data-pq="-1" aria-label="Fewer">&minus;</button><output id="pqty" aria-live="polite">1</output><button data-pq="1" aria-label="More">+</button></div><button class="btn full" id="padd" data-pdp-add>Add to basket</button></div>' +
      '<p class="note">Prototype product with a placeholder price. Availability is confirmed before launch.</p>' +
      '<div class="acc"><details open><summary>Details</summary><div class="body">' + p.desc + '</div></details><details><summary>Delivery and returns</summary><div class="body">Delivery options, costs and the returns policy will be confirmed before launch.</div></details><details><summary>' + (p.shop === 'flora' ? 'Care' : 'Application') + '</summary><div class="body">' + (p.shop === 'flora' ? 'Care guidance for this plant is added once the assortment is confirmed. Join a workshop for hands-on advice.' : 'Application guidance for this product is added once the assortment is confirmed. Our workshops cover technique step by step.') + '</div></details></div></div></div>' +
      '<div class="sechead" style="margin-top:20px"><h2 class="h2" style="font-size:clamp(34px,4vw,56px)" data-split>' + sp('More from ' + S.name) + '</h2><a class="link" href="#' + p.shop + '">Shop all</a></div><div class="pgrid" style="padding-bottom:clamp(64px,9vw,120px)">' + related.map((r, i) => card(r, i, { reveal: 1 })).join('') + '</div></div>';
  }

  let wsFilter = 'all';
  function workshopsPage() {
    const W = D.workshops;
    return '<div class="ws-page">' + hero('workshops-hero', { k: 'worktable', s: 29 }, { side: 'left', size: 'shop', copy:
        '<p class="crumb"><a href="#home">Home</a><span>/</span><span>Workshops</span></p><h1 class="h1 shop-h1" data-split>' + sp('Workshops') + '</h1>' +
        '<p class="hero-sub" data-reveal style="--d:.4s">Where Flora and Living meet. Learn about plants, styling, colour, materials and decorative techniques, hands on, in small groups.</p>' +
        '<div class="phero-cta" data-reveal style="--d:.55s"><button class="btn ivory" data-scroll="#wsf">See the dates ' + ARR + '</button></div>' }) +
      '<div class="wrap" style="padding-top:clamp(48px,6vw,88px)">' +
      '<div class="ws-bar" id="wsf"><div class="pills" role="group" aria-label="Filter workshops">' + [['all', 'All'], ['flora', 'Flora'], ['living', 'Living'], ['both', 'Flora + Living']].map((f) => '<button class="pill" data-wsf="' + f[0] + '" aria-pressed="' + (wsFilter === f[0]) + '">' + f[1] + ' <span class="pc">' + (f[0] === 'all' ? W.length : W.filter((w) => w.theme === f[0]).length) + '</span></button>').join('') + '</div><p class="ws-count" id="wscount"></p></div>' +
      '<div class="wlist" id="wslist">' + wsRows() + '</div>' +
      '<p class="note" style="margin-bottom:clamp(56px,7vw,104px)">Example workshops. Dates, duration, pricing and booking details are updated as the programme develops.</p></div></div>';
  }
  function wsRows() {
    const list = D.workshops.filter((w) => wsFilter === 'all' || w.theme === wsFilter);
    const label = (t) => (t === 'both' ? 'Flora + Living' : D.shops[t].name);
    return list.map((w, i) => { const d = w.date.split(' ');
      return '<article class="wcard">' + slot(w.art, 'zoom', { photo: 'workshop-' + w.id, sizes: '(max-width: 960px) 100vw, 42vw', reveal: 1, par: .04,
          inner: '<span class="wdate"><b>' + d[1] + '</b><small>' + d[2] + ' ' + d[3] + '</small></span>' }) +
        '<div class="wtext" data-reveal style="--d:.15s"><div class="wtop"><span class="wnum">0' + (i + 1) + '</span><span class="chip ' + w.theme + '">' + label(w.theme) + '</span></div>' +
        '<h3>' + w.title + '</h3><p class="wblurb">' + w.blurb + '</p>' +
        '<dl class="wmeta"><div><dt>Date</dt><dd>' + w.date + '</dd></div><div><dt>Time</dt><dd>' + w.time + '</dd></div><div><dt>Duration</dt><dd>' + w.dur + '</dd></div><div><dt>Price</dt><dd class="tnum">' + eur(w.price) + ' per person</dd></div><div><dt>Group</dt><dd>' + w.spots + ' places</dd></div></dl>' +
        '<button class="btn" data-book="' + w.id + '">Book a place ' + ARR + '</button></div></article>'; }).join('');
  }
  function projectsPage() {
    const P = D.projects;
    const mats = (p) => '<div class="ch-items"><span class="eyebrow">Plants and materials</span>' + p.items.map((it) => { const x = byId(it[1]); return '<a href="#product-' + it[1] + '">' + it[0] + '<span>' + (x ? D.shops[x.shop].name : '') + '</span></a>'; }).join('') + '</div>';
    const meta = (p) => '<div class="meta"><span class="chip ' + p.world + '">' + worldName(p.world) + '</span><span>' + p.type + '</span><span>' + p.place + '</span></div>';
    const cta = '<div class="ch-actions"><a class="btn sm" href="#showroom" data-intent="project">Discuss a project like this ' + ARR + '</a></div>';
    const head = (p, i) => '<div class="ch-head" data-reveal><span class="num">0' + (i + 1) + '</span><span>' + p.type + '</span></div>';
    const img = (p, cls, o) => slot(o && o.b ? p.artB : p.art, cls, Object.assign({ photo: 'project-' + p.id + (o && o.b ? '-b' : ''), alt: o && o.b ? (PH.slots['project-' + p.id + '-b'] || {}).alt : p.title }, o || {}));
    const index = '<nav class="pj-index" aria-label="Projects on this page" data-reveal style="--d:.6s"><span class="eyebrow">In this portfolio</span>' +
      P.map((p, i) => '<a href="#projects" data-scroll="#pj-' + p.id + '"><span>0' + (i + 1) + '</span><b>' + p.title + '</b><small>' + worldName(p.world) + '</small></a>').join('') + '</nav>';
    const [a, b, c, d] = P;
    return hero('projects-hero', { k: 'loggia', s: 53 }, { side: 'split', size: 'tall', cls: 'bottom', aside: index, copy:
        '<p class="crumb"><a href="#home">Home</a><span>/</span><span>Projects</span></p>' +
        '<h1 class="h1" data-split>' + sp('Rooms, gardens<br> &amp; <em>terraces</em>') + '</h1>' +
        '<p class="hero-sub" data-reveal style="--d:.5s">Spaces where plants and materials were chosen together. These are example projects, shown to illustrate the approach; DaVinci\'s own work follows.</p>' }) +

      '<section class="sec-sm tone-ivory"><div class="wrap pj-intro"><p class="statement" data-reveal>Plants and materials, designed together: the olive chosen for the plaster behind it, the tile for the pot that stands on it.</p>' +
      '<div class="side" data-reveal style="--d:.15s"><p class="lead">Each project lists the plants and materials it uses, linked to the shop, so you can start from the result you like.</p><div class="legend"><span class="chip flora">Flora</span><span class="chip living">Living</span><span class="chip both">Flora + Living</span></div></div></div></section>' +

      '<section class="sec-sm tone-ivory chapter ch-a" id="pj-' + a.id + '" style="padding-top:0"><div class="wrap">' + head(a, 0) +
      img(a, 'stage-wide zoom', { sizes: '100vw', reveal: 1, par: .05 }) +
      '<div class="ch-body"><div class="ch-copy" data-reveal>' + meta(a) + '<h2>' + a.title + '</h2><p class="lead">' + a.long + '</p></div>' +
      '<div class="ch-copy" data-reveal style="--d:.1s">' + mats(a) + cta + '</div>' + img(a, 'zoom', { b: 1, sizes: '25vw', reveal: 1, d: .2 }) + '</div></div></section>' +

      '<section class="sec tone-linen chapter ch-b" id="pj-' + b.id + '"><div class="wrap">' + head(b, 1) +
      '<div class="ch-grid2"><div class="media">' + img(b, 'm1 zoom', { sizes: '(max-width: 960px) 100vw, 55vw', reveal: 1, par: .05 }) + img(b, 'm2', { b: 1, sizes: '22vw', reveal: 1, d: .3, nolabel: 1 }) + '</div>' +
      '<div class="right"><div class="ch-copy" data-reveal>' + meta(b) + '<h2>' + b.title + '</h2><p class="lead">' + b.long + '</p>' + mats(b) + cta + '</div></div></div></div></section>' +

      '<section class="sec tone-ivory chapter ch-c" id="pj-' + c.id + '"><div class="wrap">' + head(c, 2) +
      '<div class="ch-grid"><div class="ch-copy" data-reveal>' + meta(c) + '<h2>' + c.title + '</h2><p class="lead">' + c.long + '</p>' + mats(c) + cta + '</div>' +
      '<div class="media">' + img(c, 'm1 zoom', { sizes: '(max-width: 960px) 100vw, 55vw', reveal: 1, par: .05 }) + img(c, 'm2', { b: 1, sizes: '22vw', reveal: 1, d: .25, nolabel: 1 }) + '</div></div></div></section>' +

      '<section class="sec-sm tone-ivory chapter ch-d" id="pj-' + d.id + '" style="padding-top:0"><div class="wrap">' + head(d, 3) +
      '<div class="full">' + img(d, 'zoom', { sizes: '100vw', reveal: 1, par: .05 }) + '<div class="shade"></div><div class="card-over" data-reveal>' + meta(d) + '<h2>' + d.title + '</h2><p class="lead">' + d.long + '</p>' + mats(d) + cta + '</div></div></div></section>' +

      '<section class="sec tone-olive"><div class="wrap"><div class="sechead"><div><span class="eyebrow">How a project comes together</span><h2 class="h2" data-split style="margin-top:14px">' + sp('From first idea to finished space') + '</h2></div></div>' +
      '<ol class="process">' + [['01', 'Talk it through', 'In the showroom or online: the space, the light, how you live in it, and what it should feel like.'], ['02', 'Choose together', 'Trees chosen in person, materials tested as samples, colours seen in your own daylight.'], ['03', 'Bring it home', 'Delivery planned around the work, with application advice or a workshop where a technique is new to you.']].map((s, i) => '<li data-reveal style="--d:' + (i * .1) + 's"><span class="n">' + s[0] + '</span><h3>' + s[1] + '</h3><p>' + s[2] + '</p></li>').join('') + '</ol>' +
      '<p class="note" style="margin-top:28px;color:var(--on-dark-muted);border-color:var(--on-dark-muted)">Services and delivery options are confirmed before launch.</p></div></section>' +

      '<section class="sec tone-ivory"><div class="wrap"><div class="pj-cta" data-reveal>' + slot({ k: 'olive', s: 120, big: 1, w: ['#e5d2ad', '#c4a274'], pot: '#94573a' }, 'zoom', { photo: 'projects-cta', sizes: '(max-width: 960px) 100vw, 40vw' }) +
      '<div class="inner"><span class="eyebrow">Start a project</span><h2 class="h2">Planning something similar?</h2><p style="color:#ecd9c6;max-width:44ch">Tell us about the room, terrace or garden. We will suggest plants and materials that suit it, and how to bring them together.</p>' +
      '<div class="opts4">' + [['project', 'Discuss a similar project', 'Share the space and your plans'], ['advice', 'Request personal advice', 'Plants, materials or colour'], ['question', 'Contact DaVinci', 'A general question'], ['visit', 'Visit the showroom', 'See it all in person, in Almere']].map((o) => '<a href="#showroom" data-intent="' + o[0] + '"><b>' + o[1] + ARR_L.replace('<svg', '<svg') + '</b><span>' + o[2] + '</span></a>').join('') + '</div></div></div></div></section>';
  }

  /* ---------- showroom / contact ---------- */
  const INTENTS = [['visit', 'Book a showroom visit', 'See plants and materials in person.'], ['advice', 'Request personal advice', 'Plants, materials, colour or finishes.'], ['project', 'Discuss an interior project', 'A room, a terrace or a renovation.'], ['question', 'Ask a general question', 'Orders, delivery or anything else.']];
  const TOPICS = [['plants', 'Plant selection'], ['materials', 'Interior materials'], ['colour', 'Colour advice'], ['finishes', 'Decorative finishes'], ['projects', 'Project discussion']];
  let askTopic = '', jumpToForm = false, jumpToProject = '';
  const fld = (id, label, input, req) => '<div class="fld"><label for="' + id + '">' + label + (req ? '' : ' <span class="opt-t">(optional)</span>') + '</label>' + input + '<p class="err" id="' + id + '-err"></p></div>';
  function formHTML(kind) {
    const today = new Date().toISOString().slice(0, 10);
    return '<form class="form" id="cform" data-form="contact" novalidate>' +
      '<fieldset class="fieldset"><legend class="flabel">What would you like to do?</legend><div class="choice-grid">' +
      INTENTS.map((x) => '<label class="choice"><input type="radio" name="intent" value="' + x[0] + '"' + (x[0] === kind ? ' checked' : '') + '><span class="dot" aria-hidden="true"></span><span><b>' + x[1] + '</b><small>' + x[2] + '</small></span></label>').join('') + '</div></fieldset>' +
      '<div class="twocol">' + fld('c-name', 'Name', '<input id="c-name" autocomplete="name" data-req="Please enter your name." aria-describedby="c-name-err">', 1) +
      fld('c-mail', 'Email', '<input id="c-mail" type="email" autocomplete="email" data-req="Please enter your email address." aria-describedby="c-mail-err">', 1) + '</div>' +
      '<div class="cond" data-for="visit"><div class="twocol">' + fld('c-date', 'Preferred day', '<input id="c-date" type="date" min="' + today + '" aria-describedby="c-date-err">', 0) +
      '<div class="fld"><span class="flabel" id="c-part-l">Part of the day</span><div class="seg" role="radiogroup" aria-labelledby="c-part-l">' + ['Morning', 'Afternoon', 'No preference'].map((v, i) => '<label><input type="radio" name="part" value="' + v + '"' + (i === 2 ? ' checked' : '') + '><span>' + v + '</span></label>').join('') + '</div></div></div></div>' +
      '<div class="cond" data-for="advice">' + fld('c-topic', 'Topic', '<select id="c-topic">' + TOPICS.slice(0, 4).map((t) => '<option value="' + t[0] + '">' + t[1] + '</option>').join('') + '</select>', 1) + '</div>' +
      '<div class="cond" data-for="project"><div class="twocol">' + fld('c-ptype', 'Type of project', '<select id="c-ptype"><option>Interior room</option><option>Garden, courtyard or terrace</option><option>Both inside and out</option></select>', 1) +
      fld('c-when', 'When', '<select id="c-when"><option>Within 3 months</option><option>In 3 to 6 months</option><option>Later, just exploring</option></select>', 1) + '</div></div>' +
      '<div class="twocol">' + fld('c-phone', 'Phone', '<input id="c-phone" type="tel" autocomplete="tel">', 0) + '<div></div></div>' +
      fld('c-msg', 'Message', '<textarea id="c-msg" placeholder="Tell us about your space, plants or colours" aria-describedby="c-msg-err"></textarea>', 1) +
      '<div class="fld"><label class="check"><input type="checkbox" id="c-ok" data-req="Please agree so we can reply to you." aria-describedby="c-ok-err"><span>I agree that DaVinci may use these details to answer my enquiry. Privacy policy to follow before launch.</span></label><p class="err" id="c-ok-err"></p></div>' +
      '<div class="form-foot"><p class="note">Demonstration form. Nothing is sent until it is connected to DaVinci\'s business systems.</p><button class="btn" type="submit">Send enquiry ' + ARR + '</button></div></form>' +
      '<div id="c-done" hidden></div>';
  }
  function showroomPage() {
    const k = intent; intent = 'visit';
    const info = '<aside class="info-card" aria-label="Showroom details" data-reveal style="--d:.6s"><span class="eyebrow">Showroom</span><h2>DaVinci, Almere</h2><dl class="facts"><div><dt>Opening</dt><dd>Expected December 2026 <span class="tbc">(to be confirmed)</span></dd></div><div><dt>Address</dt><dd><span class="tbc">To be confirmed</span></dd></div><div><dt>Hours</dt><dd><span class="tbc">To be confirmed</span></dd></div></dl></aside>';
    return hero('showroom-hero', { k: 'showroomwide', s: 61 }, { side: 'split', size: 'full', cls: 'center', aside: info, copy:
        '<p class="crumb"><a href="#home">Home</a><span>/</span><span>Showroom / Contact</span></p>' +
        '<h1 class="h1" data-split>' + sp('Come and see it<br> in <em>daylight</em>') + '</h1>' +
        '<p class="hero-sub" data-reveal style="--d:.5s">Touch the plaster, compare the tiles, meet the trees. Our showroom in Almere brings Flora and Living together under one roof.</p>' +
        '<div class="phero-cta" data-reveal style="--d:.65s"><a class="btn ivory" href="#showroom" data-ask="visit">Plan a visit ' + ARR + '</a><a class="btn light" href="#showroom" data-ask="advice">Ask for advice</a></div>' }) +

      '<section class="sec tone-ivory"><div class="wrap sr-intro"><div class="copy"><span class="eyebrow" data-reveal>The showroom</span><h2 class="h2" data-split>' + sp('A place to touch and compare') + '</h2>' +
      '<p class="lead" data-reveal>Colour changes with the light and plaster with the hand, so some choices are best made in person. The showroom is planned around three places.</p>' +
      '<div class="sr-list" data-reveal>' + [['Flora corner', 'Olive, citrus and Mediterranean plants, to choose tree by tree.'], ['Material wall', 'Plasters, paints, tiles and microcement as large samples in daylight.'], ['The long table', 'Where we sit down to plan a project, and where workshops can take place.']].map((x, i) => '<div><span class="n">0' + (i + 1) + '</span><div><h3>' + x[0] + '</h3><p>' + x[1] + '</p></div></div>').join('') + '</div>' +
      '<p class="note" data-reveal>Showroom layout shown as planned. Details follow before opening.</p></div>' +
      '<div class="mosaic">' + slot({ k: 'olive', s: 140, big: 1, w: ['#e9dcc0', '#cfb58a'] }, 'zoom archtop', { photo: 'showroom-flora', sizes: '(max-width: 960px) 55vw, 32vw', reveal: 1 }) + slot({ k: 'swatch', cols: ['#d8c19c', '#b9a98f', '#4f7a6a', '#b4562f', '#efe6d4', '#8f5a3c'] }, 'zoom', { photo: 'showroom-living', sizes: '(max-width: 960px) 45vw, 24vw', reveal: 1, d: .15 }) + slot({ k: 'workshop', s: 77 }, 'zoom', { photo: 'showroom-table', sizes: '(max-width: 960px) 45vw, 24vw', reveal: 1, d: .3 }) + '</div></div></section>' +

      '<section class="sec tone-linen"><div class="wrap"><div class="sechead"><div><span class="eyebrow">Personal advice</span><h2 class="h2" data-split style="margin-top:14px">' + sp('Ask before you choose') + '</h2></div><p class="lead" data-reveal style="max-width:42ch">Tell us about the space and the light. We will help you choose the plant, the material or the colour that suits it.</p></div>' +
      '<div class="advice-grid">' + D.advice.map((a, i) => '<article class="adv" data-reveal style="--d:' + (i * .07) + 's">' + slot(a.art, 'zoom', { photo: 'advice-' + a.id, sizes: '(max-width: 640px) 50vw, 20vw' }) + '<div class="txt"><h3>' + a.title + '</h3><p>' + a.text + '</p></div><button class="link" data-ask="' + a.id + '">Ask about this</button></article>').join('') + '</div></div></section>' +

      '<section class="sec tone-ivory" id="enquire"><div class="wrap contact"><div class="contact-aside" data-reveal><span class="eyebrow">Contact</span><h2 class="h2">How can we help?</h2><p class="lead">Choose what you would like to do. We will take it from there.</p>' +
      '<dl class="facts"><div><dt>Showroom</dt><dd>Almere, the Netherlands</dd></div><div><dt>Email</dt><dd><span class="tbc">To be confirmed</span></dd></div><div><dt>Phone</dt><dd><span class="tbc">To be confirmed</span></dd></div><div><dt>Reply time</dt><dd><span class="tbc">To be confirmed</span></dd></div></dl></div>' +
      '<div data-reveal style="--d:.12s">' + formHTML(k) + '</div></div></section>';
  }
  function updateCond() {
    const f = $('#cform'); if (!f) return;
    const v = (f.querySelector('input[name=intent]:checked') || {}).value || 'visit';
    $$('.cond', f).forEach((c) => { c.hidden = c.dataset.for !== v; });
    const msg = $('#c-msg'), lab = msg.closest('.fld').querySelector('label');
    if (v === 'question') { msg.dataset.req = 'Please write your question.'; lab.innerHTML = 'Message'; } else { delete msg.dataset.req; lab.innerHTML = 'Message <span class="opt-t">(optional)</span>'; }
    msg.placeholder = { visit: 'Anything we should prepare for your visit?', advice: 'Tell us about the space, the light and what you have in mind', project: 'Tell us about the space and what you would like to achieve', question: 'Your question' }[v];
  }
  function applyIntent(kind, topic) {
    const f = $('#cform'); if (!f) { intent = kind; askTopic = topic || ''; return; }
    if ($('#c-done') && !$('#c-done').hidden) { $('#c-done').hidden = true; f.hidden = false; }
    const r = f.querySelector('input[name=intent][value="' + kind + '"]'); if (r) r.checked = true;
    if (topic && $('#c-topic')) $('#c-topic').value = topic;
    updateCond();
  }
  function scrollToForm() { const el = $('#enquire'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: RM ? 'auto' : 'smooth' }); }
  function initContact() {
    const f = $('#cform'); if (!f) return;
    $$('input[name=intent]', f).forEach((i) => i.addEventListener('change', updateCond));
    $$('[data-req]', f).forEach((el) => el.addEventListener(el.type === 'checkbox' ? 'change' : 'blur', () => { if (el.closest('.fld').classList.contains('bad')) check(el); }));
    if (askTopic && $('#c-topic')) $('#c-topic').value = askTopic;
    askTopic = ''; updateCond();
  }
  /* inline validation: one clear message under each field */
  function check(el) {
    const box = el.closest('.fld'), hidden = el.closest('[hidden]');
    const val = el.type === 'checkbox' ? el.checked : el.value.trim();
    let msg = '';
    if (!hidden && el.dataset.req && !val) msg = el.dataset.req;
    else if (!hidden && el.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) msg = 'Enter an email address like name@example.com.';
    box.classList.toggle('bad', !!msg); el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    const er = box.querySelector('.err'); if (er) er.textContent = msg;
    return !msg;
  }
  function validate(f) {
    let first = null;
    $$('[data-req], input[type=email]', f).forEach((el) => { if (!check(el) && !first) first = el; });
    if (first) first.focus();
    return !first;
  }
  /* ---------- router ---------- */
  function parse() {
    const h = (location.hash || '#home').slice(1);
    if (h.indexOf('product-') === 0) return { p: 'product', id: h.slice(8), key: h };
    const m = h.match(/^(flora|living)(?:-(\w+))?$/);
    if (m) return { p: 'shop', shop: m[1], cat: m[2] || 'all', key: m[1] };
    if (['workshops', 'projects', 'showroom'].indexOf(h) > -1) return { p: h, key: h };
    return { p: 'home', key: 'home' };
  }
  const TITLES = { home: 'DaVinci Flora & Living', workshops: 'Workshops', projects: 'Projects', showroom: 'Showroom / Contact' };
  let cur = null, navToken = 0, firstLoad = true;
  function render(r) {
    const main = $('#main');
    if (r.p === 'home') main.innerHTML = homePage();
    else if (r.p === 'shop') { main.innerHTML = shopPage(r.shop, r.cat); fillGrid(false); }
    else if (r.p === 'product') main.innerHTML = productPage(r.id);
    else if (r.p === 'workshops') main.innerHTML = workshopsPage();
    else if (r.p === 'projects') main.innerHTML = projectsPage();
    else if (r.p === 'showroom') main.innerHTML = showroomPage();
    const prod = r.p === 'product' ? byId(r.id) : null;
    document.title = (r.p === 'shop' ? D.shops[r.shop].name + ' webshop' : prod ? prod.name : TITLES[r.p]) + (r.p === 'home' ? '' : ' | DaVinci Flora & Living');
    const navKey = r.p === 'product' ? (prod ? prod.shop : 'home') : r.key.split('-')[0];
    $$('[data-nav]').forEach((a) => a.toggleAttribute('aria-current', a.dataset.nav === navKey) && a.setAttribute('aria-current', 'page'));
    $$('[data-nav]').forEach((a) => { if (a.dataset.nav !== navKey) a.removeAttribute('aria-current'); });
    cur = r; setMenu(false); motion(main); startMarquees(main); par(); lit(); initContact();
  }
  async function route() {
    const r = parse(), tok = ++navToken;
    if (cur && cur.p === 'shop' && r.p === 'shop' && cur.shop === r.shop) {
      shopState.cat = r.cat; cur = r; $('#pills').innerHTML = pills(); fillGrid(true);
      const tb = $('#toolbar'); if (tb && tb.getBoundingClientRect().top > innerHeight * .5) window.scrollTo({ top: tb.getBoundingClientRect().top + window.scrollY - 70, behavior: RM ? 'auto' : 'smooth' });
      return;
    }
    closeAll();
    const land = () => {
      window.scrollTo(0, 0);
      if (r.p === 'showroom' && jumpToForm) setTimeout(scrollToForm, 80);
      if (r.p === 'projects' && jumpToProject) { const el = $('#pj-' + jumpToProject); if (el) setTimeout(() => window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'auto' }), 80); }
      jumpToForm = false; jumpToProject = '';
    };
    if (firstLoad || RM) { firstLoad = false; render(r); land(); return; }
    const c = $('#curtain');
    c.className = 'curtain cover'; await wait(520); if (tok !== navToken) return;
    render(r); land();
    c.className = 'curtain leave'; await wait(640); if (tok === navToken) c.className = 'curtain';
  }

  /* ---------- motion ---------- */
  let io;
  function motion(root) {
    if (io) io.disconnect();
    if (RM || !('IntersectionObserver' in window)) return;
    const els = $$('[data-reveal],[data-split]', root);
    els.forEach((el) => el.classList.add('rv'));
    /* a clipped image reports no intersection, so clipped reveals are observed through their parent */
    const map = new Map();
    els.forEach((el) => { const tgt = el.classList.contains('revimg') ? el.parentElement : el; if (!map.has(tgt)) map.set(tgt, []); map.get(tgt).push(el); });
    io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { (map.get(e.target) || []).forEach((el) => { el.classList.remove('rv'); $$('[data-count-to]', el).forEach(countUp); }); io.unobserve(e.target); } }), { threshold: 0.05, rootMargin: '0px 0px -5% 0px' });
    requestAnimationFrame(() => map.forEach((_, tgt) => io.observe(tgt)));
  }
  function countUp(el) {
    const to = +el.dataset.countTo, t0 = performance.now(), dur = 1400;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    el.textContent = '0'; requestAnimationFrame(step);
  }
  let mqAnims = [], mqRate = 1, mqLoop = 0;
  function startMarquees(root) {
    mqAnims = [];
    if (RM) return;
    $$('.mq-track', root).forEach((t) => { if (t.animate) mqAnims.push(t.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-50%)' }], { duration: 48000, iterations: Infinity })); });
  }
  function nudgeMarquees(dy) {
    if (!mqAnims.length) return;
    mqRate = Math.min(5, Math.max(mqRate, 1 + Math.abs(dy) / 6));
    if (!mqLoop) mqLoop = requestAnimationFrame(function ease() {
      mqRate += (1 - mqRate) * .06; mqAnims.forEach((a) => { a.playbackRate = mqRate; });
      mqLoop = Math.abs(mqRate - 1) > .01 ? requestAnimationFrame(ease) : 0;
    });
  }
  let ticking = false, lastY = 0;
  function par() {
    if (RM) return;
    const vh = innerHeight;
    $$('[data-par]').forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      el.style.transform = 'translate3d(0,' + (((r.top + r.height / 2) - vh / 2) * -parseFloat(el.dataset.par)).toFixed(1) + 'px,0)';
    });
  }
  function lit() {
    const b = $('[data-lit]'); if (!b) return;
    const ws = $$('.mw', b), r = b.getBoundingClientRect(), vh = innerHeight;
    const prog = RM ? 1 : Math.min(1, Math.max(0, (vh * .85 - r.top) / (vh * .55 + r.height * .3)));
    const n = Math.round(prog * ws.length);
    ws.forEach((w, i) => w.classList.toggle('on', i < n));
  }
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY, h = $('#hdr');
      h.classList.toggle('scrolled', y > 8);
      h.classList.toggle('hide', y > lastY + 4 && y > 260 && !document.body.classList.contains('menu-open'));
      if (y < lastY - 4) h.classList.remove('hide');
      nudgeMarquees(y - lastY); lastY = y; par(); lit(); ticking = false;
    });
  }
  /* ---------- search ---------- */
  function runSearch(q) {
    q = q.trim().toLowerCase();
    const list = q ? D.products.filter((p) => (p.name + ' ' + p.sub + ' ' + catName(p.shop, p.cat) + ' ' + p.shop).toLowerCase().includes(q)) : D.products.slice(0, 4);
    $('#sres').innerHTML = (q ? '' : '') + (list.length ? list.map((p, i) => card(p, i, { enter: 1, tag: 1 })).join('') : '<p class="empty">Nothing matches &ldquo;' + q.replace(/[<>&]/g, '') + '&rdquo; yet. Try olive, lime, tile or pot.</p>');
  }

  /* ---------- events ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-ask],[data-again],[data-scroll],[data-add],[data-pdp-add],[data-opt],[data-pq],[data-view],[data-zoom],[data-open-cart],[data-close],[data-open-search],[data-cq],[data-crm],[data-checkout],[data-book],[data-intent],[data-wsf],#burger,#scrim,a[href^="#"]');
    if (!t) return;
    if (t.dataset.add) {
      const id = t.dataset.add; addToCart(id); t.classList.add('done'); const old = t.innerHTML; t.innerHTML = TICK + ' Added';
      setTimeout(() => { t.classList.remove('done'); t.innerHTML = old; }, 1800); toast(byId(id).name + ' added', true); e.preventDefault(); return;
    }
    if (t.hasAttribute('data-pdp-add')) {
      const p = byId(pdp.id); addToCart(pdp.id, pdp.sel.slice(), pdp.qty);
      t.classList.add('done'); const old = t.innerHTML; t.innerHTML = TICK + ' Added'; setTimeout(() => { t.classList.remove('done'); t.innerHTML = old; }, 1800);
      setTimeout(openCart, 450); return;
    }
    if (t.dataset.opt) {
      const [g, o] = t.dataset.opt.split(':').map(Number), p = byId(pdp.id);
      pdp.sel[g] = o; $$('[data-opt^="' + g + ':"]').forEach((b) => b.setAttribute('aria-checked', b === t));
      $('#vsel' + g).textContent = p.variants[g].opts[o][0];
      const pr = $('#pprice'); pr.textContent = eur(unit(p, pdp.sel)); pr.classList.remove('tick-n'); void pr.offsetWidth; pr.classList.add('tick-n'); return;
    }
    if (t.dataset.pq) { pdp.qty = Math.max(1, Math.min(20, pdp.qty + Number(t.dataset.pq))); const o = $('#pqty'); o.textContent = pdp.qty; o.classList.remove('tick-n'); void o.offsetWidth; o.classList.add('tick-n'); return; }
    if (t.dataset.view !== undefined) { const v = Number(t.dataset.view); $$('[data-layer]').forEach((l) => l.classList.toggle('on', Number(l.dataset.layer) === v)); $$('[data-view]').forEach((b) => b.setAttribute('aria-current', Number(b.dataset.view) === v)); return; }
    if (t.dataset.scroll) { e.preventDefault(); const el = $(t.dataset.scroll); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: RM ? 'auto' : 'smooth' }); return; }
    if (t.dataset.ask) {
      e.preventDefault(); const a = t.dataset.ask;
      if (a === 'projects' || a === 'project') applyIntent('project'); else if (['plants', 'materials', 'colour', 'finishes'].indexOf(a) > -1) applyIntent('advice', a); else applyIntent(a);
      scrollToForm(); return;
    }
    if (t.hasAttribute('data-again')) { const f = $('#cform'); f.reset(); $$('.fld.bad', f).forEach((x) => x.classList.remove('bad')); $('#c-done').hidden = true; f.hidden = false; updateCond(); scrollToForm(); return; }

    if (t.hasAttribute('data-zoom')) { t.classList.toggle('zoomed'); return; }
    if (t.hasAttribute('data-open-cart')) { closeAll(); openCart(); return; }
    if (t.hasAttribute('data-open-search')) { setMenu(false); layer('#search', true); runSearch($('#sq').value); return; }
    if (t.dataset.cq) { const i = cart.find((x) => x.key === t.dataset.k); if (i) { i.qty = Math.max(1, i.qty + Number(t.dataset.cq)); i.bumped = 1; saveCart(); updateCount(true); renderDrawer(); } return; }
    if (t.dataset.crm) { const el = $('.li[data-key="' + t.dataset.crm + '"]'); const done = () => { cart = cart.filter((x) => x.key !== t.dataset.crm); saveCart(); updateCount(); renderDrawer(); }; if (el && !RM) { el.classList.add('out'); setTimeout(done, 450); } else done(); return; }
    if (t.hasAttribute('data-checkout')) {
      modal('<h2>Checkout</h2><p style="color:var(--muted);margin-bottom:20px">This is a demonstration. Payments, delivery options and order confirmations are connected before launch.</p>' + cart.map((i) => '<div class="sum" style="padding:6px 0"><span>' + i.qty + ' &times; ' + byId(i.id).name + '</span><span class="tnum">' + eur(i.qty * i.unit) + '</span></div>').join('') + '<div class="sum t" style="margin:16px 0 24px;border-top:1px solid var(--line);padding-top:14px"><span>Total</span><b class="tnum">' + eur(cartTotal()) + '</b></div><button class="btn full" data-close>Back to the shop</button>');
      return;
    }
    if (t.dataset.book) {
      const w = D.workshops.find((x) => x.id === t.dataset.book);
      modal('<h2>Book a place</h2><p style="margin-bottom:6px"><b>' + w.title + '</b></p><p style="color:var(--muted);margin-bottom:22px">' + w.date + ', ' + w.time + ' · ' + eur(w.price) + ' per person</p><form class="form" data-form="book" novalidate>' + fld('b-name', 'Name', '<input id="b-name" autocomplete="name" data-req="Please enter your name." aria-describedby="b-name-err">', 1) + fld('b-mail', 'Email', '<input id="b-mail" type="email" autocomplete="email" data-req="Please enter your email address." aria-describedby="b-mail-err">', 1) + fld('b-n', 'Places', '<select id="b-n"><option>1</option><option>2</option><option>3</option><option>4</option></select>', 1) + '<button class="btn" type="submit">Reserve (demo)</button><p class="note">Demonstration only. Booking is connected before launch.</p><div id="b-ok" aria-live="polite"></div></form>');
      return;
    }
    if (t.dataset.wsf) { wsFilter = t.dataset.wsf; $$('[data-wsf]').forEach((x) => x.setAttribute('aria-pressed', x === t)); $('#wslist').innerHTML = wsRows(); $$('#wslist .wcard').forEach((x, i) => { x.style.animationDelay = (i * 70) + 'ms'; x.classList.add('enter'); }); return; }
    if (t.dataset.intent) {
      if (cur && cur.p === 'showroom' && t.getAttribute('href') === '#showroom') { e.preventDefault(); closeAll(); applyIntent(t.dataset.intent); scrollToForm(); return; }
      intent = t.dataset.intent; jumpToForm = true;
    }
    if (t.dataset.pj) jumpToProject = t.dataset.pj;
    if (t.id === 'burger') { setMenu(!document.body.classList.contains('menu-open')); return; }
    if (t.hasAttribute('data-close') || t.id === 'scrim') {
      closeAll(); if (t.tagName === 'A' && t.getAttribute('href') === location.hash) e.preventDefault(); return;
    }
    if (t.tagName === 'A') {
      closeAll();
      if (t.getAttribute('href') === (location.hash || '#home')) { e.preventDefault(); window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); }
    }
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault();
    if (f.dataset.form === 'news') {
      const v = $('#nl-mail').value.trim();
      $('#nl-ok').textContent = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'Thank you. This is a demo, so nothing was subscribed.' : 'Enter an email address like name@example.com.';
      return;
    }
    if (!validate(f)) return;
    if (f.dataset.form === 'book') { const el = $('#b-ok'); if (el) el.innerHTML = '<div class="okmsg">Reserved in the demo. No booking was made and no payment was taken.</div>'; return; }
    if (f.dataset.form === 'contact') {
      const btn = f.querySelector('[type=submit]'); btn.setAttribute('aria-busy', 'true'); btn.firstChild.textContent = 'Sending ';
      const kind = f.querySelector('input[name=intent]:checked').value, name = $('#c-name').value.trim().split(' ')[0];
      const rows = [['Request', INTENTS.find((x) => x[0] === kind)[1]], ['Name', $('#c-name').value.trim()], ['Email', $('#c-mail').value.trim()]];
      if (kind === 'visit') rows.push(['Visit', ($('#c-date').value || 'Any day') + ', ' + f.querySelector('input[name=part]:checked').value.toLowerCase()]);
      if (kind === 'advice') rows.push(['Topic', $('#c-topic').selectedOptions[0].textContent]);
      if (kind === 'project') rows.push(['Project', $('#c-ptype').value + ', ' + $('#c-when').value.toLowerCase()]);
      setTimeout(() => {
        btn.removeAttribute('aria-busy'); btn.firstChild.textContent = 'Send enquiry ';
        const done = $('#c-done');
        done.innerHTML = '<div class="confirm" role="status"><span class="tickbig">' + TICK + '</span><h3 tabindex="-1">Thank you, ' + esc(name) + '.</h3><p class="lead">This is a demonstration, so nothing was sent. Once the form is connected, DaVinci replies to this request by email.</p><dl>' + rows.map((x) => '<div><dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd></div>').join('') + '</dl><div><button class="btn ghost sm" data-again>Send another enquiry</button></div></div>';
        f.hidden = true; done.hidden = false; done.querySelector('h3').focus();
      }, RM ? 0 : 700);
    }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'shopq') { shopState.q = e.target.value; fillGrid(true); }
    if (e.target.id === 'sq') runSearch(e.target.value);
  });
  /* keyboard: Escape closes; Tab stays inside an open dialog, drawer, search or menu */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeAll(); return; }
    if (e.key !== 'Tab') return;
    const box = $('.modal.on .modal-box') || $('.drawer.on') || $('.search.on');
    const menu = document.body.classList.contains('menu-open');
    if (!box && !menu) return;
    const sel = 'a[href],button:not([disabled]),input:not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])';
    const f = (box ? $$(sel, box) : [$('#burger')].concat($$(sel, $('#mmenu')))).filter((el) => el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    e.preventDefault();
    f[i < 0 ? 0 : (i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
  });

  window.addEventListener('hashchange', route);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { par(); lit(); });

  mountChrome();
  route();
})();
