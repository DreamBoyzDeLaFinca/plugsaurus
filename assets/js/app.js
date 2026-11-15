/* =========================================================
   PLUGSAURUS — interfaz
   Pinta cabecera, pie y el contenido de cada página a partir del catálogo.
   No hace falta tocar este archivo para añadir plugins: edita data/products.json.
   ========================================================= */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  /* ---------- utilidades ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const page = document.body.dataset.page;

  const ICONS = {
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14m0 0-6-6m6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
    wave: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12h3l2-6 4 12 3-9 2 3h6"/></svg>',
    bone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M17 3a3 3 0 0 1 2.1 5.1A3 3 0 1 1 15 12l-3 3a3 3 0 1 1-4.1 4.1A3 3 0 1 1 3 15.9 3 3 0 0 1 8 12l3-3a3 3 0 0 1 4-4.1A3 3 0 0 1 17 3Z"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8S10 3 7.5 4.5 9 8 12 8Zm0 0s2-5 4.5-3.5S15 8 12 8Z"/></svg>'
  };

  const CURRENCY = { USD: "$", EUR: "€", GBP: "£" };
  function formatPrice(p) {
    if (p.isFree) return "Free";
    const sym = CURRENCY[(p.currency || "").toUpperCase()];
    const n = Number(p.price);
    const val = Number.isInteger(n) ? String(n) : n.toFixed(2);
    if (!sym) return val + " " + (p.currency || "");
    return p.currency.toUpperCase() === "EUR" ? val.replace(".", ",") + " €" : sym + val;
  }
  function buyUrl(p, site) {
    if (!p.gumroadUrl) return "";
    const extra = (site.gumroad && site.gumroad.buyParams) || "";
    if (!extra) return p.gumroadUrl;
    return p.gumroadUrl + (p.gumroadUrl.includes("?") ? "&" : "?") + extra.replace(/^[?&]/, "");
  }
  const productUrl = (p) => "plugin.html?id=" + encodeURIComponent(p.id);

  function badges(p) {
    let html = p.isFree ? '<span class="badge badge-free">Free</span>' : '<span class="badge badge-premium">Premium</span>';
    if (p.badge) html += `<span class="badge badge-trial">${esc(p.badge)}</span>`;
    if (p.status === "coming-soon") html += '<span class="badge badge-soon">Coming soon</span>';
    return html;
  }

  function actionButton(p, site, cls = "btn-sm") {
    if (!p.isAvailable) {
      return `<span class="btn btn-primary ${cls}" aria-disabled="true">${ICONS.lock} Coming soon</span>`;
    }
    const url = esc(buyUrl(p, site));
    const label = p.isFree ? "Download" : "Buy now";
    const style = p.isFree ? "btn-free" : "btn-primary";
    return `<a class="btn ${style} ${cls}" href="${url}" target="_blank" rel="noopener" data-gumroad="${esc(p.id)}">${p.isFree ? ICONS.down : ICONS.bag} ${label}</a>`;
  }

  /* ---------- tarjeta ---------- */
  function card(p, site) {
    return `
    <article class="card reveal" style="--accent:${esc(p.accent || "#b8ff2e")}" data-type="${p.type}" data-cat="${esc(p.category)}">
      <div class="card-media">
        <div class="card-badges"><div class="left">${badges(p)}</div></div>
        <img src="${esc(p.image)}" alt="${esc(p.name)} plugin interface" loading="lazy" decoding="async" width="720" height="720">
      </div>
      <div class="card-body">
        <span class="card-cat">${esc(p.category)}</span>
        <h3 class="card-title"><a href="${productUrl(p)}">${esc(p.name)}</a></h3>
        <p class="card-desc">${esc(p.description)}</p>
        <div class="card-foot">
          <div class="price ${p.isFree ? "free" : ""}">${formatPrice(p)}${p.isFree && p.isAvailable ? "<small>pay what you want</small>" : ""}</div>
          <div class="card-actions">
            <a class="btn btn-ghost btn-sm" href="${productUrl(p)}">View plugin</a>
            ${actionButton(p, site)}
          </div>
        </div>
      </div>
    </article>`;
  }

  /* ---------- cabecera y pie ---------- */
  function header(site) {
    const ig = site.social && site.social.instagram;
    const nav = [
      ["index.html", "Home", "home"],
      ["plugins.html", "Plugins", "catalog"],
      ["free.html", "Free plugins", "free"],
      ["index.html#about", "About", "about"]
    ];
    const el = $("#site-header");
    if (!el) return;
    el.innerHTML = `
      <div class="container nav">
        <a class="brand" href="index.html" aria-label="PlugSaurus home">
          <img src="assets/img/logo-256.webp" alt="" width="40" height="40">
          <span>PLUG<b>SAURUS</b></span>
        </a>
        <ul class="nav-links" id="nav-links">
          ${nav.map(([h, t, k]) => `<li><a href="${h}" class="${k === "free" ? "free-link" : ""}" ${k === page ? 'aria-current="page"' : ""}>${t}</a></li>`).join("")}
        </ul>
        <div class="nav-cta">
          ${ig && ig.url ? `<a class="icon-btn" href="${esc(ig.url)}" target="_blank" rel="noopener" aria-label="PlugSaurus on Instagram">${ICONS.ig}</a>` : ""}
          <a class="btn btn-primary btn-sm hide-sm" href="plugins.html">Explore</a>
          <button class="icon-btn menu-toggle" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu">${ICONS.menu}</button>
        </div>
      </div>`;
    const toggle = $(".menu-toggle", el), links = $("#nav-links");
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
      toggle.innerHTML = open ? ICONS.close : ICONS.menu;
    });
    $$("a", links).forEach((a) => a.addEventListener("click", () => { links.classList.remove("open"); toggle.setAttribute("aria-expanded", false); toggle.innerHTML = ICONS.menu; }));
    const onScroll = () => el.classList.toggle("scrolled", window.scrollY > 10);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  }

  function footer(site, products) {
    const el = $("#site-footer");
    if (!el) return;
    const s = site.social || {};
    el.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div class="footer-about">
            <a class="brand" href="index.html"><img src="assets/img/logo-256.webp" alt="" width="40" height="40"><span>PLUG<b>SAURUS</b></span></a>
            <p>${esc(site.about)}</p>
            <div class="socials">
              ${s.instagram && s.instagram.url ? `<a class="icon-btn" href="${esc(s.instagram.url)}" target="_blank" rel="noopener" aria-label="Instagram">${ICONS.ig}</a>` : ""}
              ${s.gumroad && s.gumroad.url ? `<a class="icon-btn" href="${esc(s.gumroad.url)}" target="_blank" rel="noopener" aria-label="Gumroad store">${ICONS.bag}</a>` : ""}
            </div>
          </div>
          <div>
            <h4>Plugins</h4>
            <ul>${products.filter((p) => !p.isFree).map((p) => `<li><a href="${productUrl(p)}">${esc(p.name)}</a></li>`).join("")}</ul>
          </div>
          <div>
            <h4>Free & links</h4>
            <ul>
              <li><a href="free.html">Free plugins</a></li>
              <li><a href="plugins.html">Full catalog</a></li>
              ${s.instagram && s.instagram.url ? `<li><a href="${esc(s.instagram.url)}" target="_blank" rel="noopener">Instagram ${esc(s.instagram.handle || "")}</a></li>` : ""}
              ${s.gumroad && s.gumroad.url ? `<li><a href="${esc(s.gumroad.url)}" target="_blank" rel="noopener">Gumroad store</a></li>` : ""}
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} PlugSaurus. All rights reserved.</span>
          <span>Secure checkout & downloads by Gumroad.</span>
        </div>
      </div>`;
  }

  /* ---------- animación de entrada ---------- */
  let io;
  function reveal(root = document) {
    if (!("IntersectionObserver" in window)) { document.documentElement.classList.add("no-io"); return; }
    io = io || new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal:not(.in)", root).forEach((el, i) => { el.style.transitionDelay = Math.min(i % 4, 3) * 70 + "ms"; io.observe(el); });
  }

  /* ---------- HOME ---------- */
  function renderHome(site, products) {
    const free = products.filter((p) => p.isFree);
    const premium = products.filter((p) => !p.isFree);
    const featured = products.filter((p) => p.featured && !p.isFree);
    const featuredFree = products.filter((p) => p.isFree);

    const stats = $("#hero-stats");
    if (stats) stats.innerHTML = `
      <div><strong>${products.length}</strong><span>Plugins</span></div>
      <div><strong>${free.length}</strong><span>Free</span></div>
      <div><strong>VST3 · AU</strong><span>Win & Mac</span></div>`;

    const f = $("#featured-grid");
    if (f) f.innerHTML = (featured.length ? featured : premium).map((p) => card(p, site)).join("");
    const fr = $("#free-grid");
    if (fr) fr.innerHTML = featuredFree.slice(0, 4).map((p) => card(p, site)).join("");

    const mq = $("#marquee");
    if (mq) {
      const items = products.map((p) => `<span>${esc(p.name)}</span>`).join("") + "<span>Trap</span><span>Drill</span><span>Phonk</span><span>808s</span>";
      mq.innerHTML = items + items;
    }
    const eq = $(".eq");
    if (eq) eq.innerHTML = Array.from({ length: 22 }, (_, i) => `<i style="height:${30 + ((i * 37) % 70)}%;animation-delay:-${((i * 0.27) % 1.4).toFixed(2)}s"></i>`).join("");
    renderFollow(site);
  }

  function renderFollow(site) {
    const el = $("#follow");
    const ig = site.social && site.social.instagram;
    if (!el || !ig || !ig.url) return;
    el.innerHTML = `
      <div class="follow reveal">
        <img src="assets/img/logo-256.webp" alt="PlugSaurus logo" width="88" height="88" loading="lazy">
        <div>
          <h3>Join the herd ${esc(ig.handle || "")}</h3>
          <p>New plugins, free drops, presets and before/after demos land on Instagram first.</p>
        </div>
        <a class="btn btn-primary" href="${esc(ig.url)}" target="_blank" rel="noopener">${ICONS.ig} Follow on Instagram</a>
      </div>`;
  }

  /* ---------- CATÁLOGO ---------- */
  function renderCatalog(site, products) {
    const grid = $("#catalog-grid"), filters = $("#filters");
    const params = new URLSearchParams(location.search);
    const state = { type: (params.get("type") || "all").toLowerCase(), cat: params.get("cat") || "all", q: "" };
    const cats = [...new Set(products.map((p) => p.category))].sort();
    const count = (fn) => products.filter(fn).length;

    filters.innerHTML = `
      <div class="filter-group" role="group" aria-label="Filter by type">
        <button class="chip" data-type="all">All <span class="n">${products.length}</span></button>
        <button class="chip" data-type="free">Free <span class="n">${count((p) => p.isFree)}</span></button>
        <button class="chip" data-type="premium">Premium <span class="n">${count((p) => !p.isFree)}</span></button>
      </div>
      <span class="filter-sep"></span>
      <div class="filter-group" role="group" aria-label="Filter by category">
        <button class="chip" data-cat="all">All effects</button>
        ${cats.map((c) => `<button class="chip" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}
      </div>
      <label class="search">${ICONS.search}<span class="sr-only">Search plugins</span><input type="search" placeholder="Search plugins…" id="q"></label>`;

    function apply() {
      $$("[data-type]", filters).forEach((b) => b.setAttribute("aria-pressed", b.dataset.type === state.type));
      $$("[data-cat]", filters).forEach((b) => b.setAttribute("aria-pressed", b.dataset.cat === state.cat));
      const q = state.q.trim().toLowerCase();
      const list = products.filter((p) =>
        (state.type === "all" || (state.type === "free" ? p.isFree : !p.isFree)) &&
        (state.cat === "all" || p.category === state.cat) &&
        (!q || [p.name, p.description, p.category, p.tagline].join(" ").toLowerCase().includes(q)));
      grid.innerHTML = list.length ? list.map((p) => card(p, site)).join("") : '<p class="empty">No plugins match these filters yet. The herd is growing — check back soon.</p>';
      reveal(grid);
      const u = new URL(location.href);
      state.type === "all" ? u.searchParams.delete("type") : u.searchParams.set("type", state.type);
      state.cat === "all" ? u.searchParams.delete("cat") : u.searchParams.set("cat", state.cat);
      history.replaceState(null, "", u);
    }
    filters.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.type) state.type = b.dataset.type;
      if (b.dataset.cat) state.cat = b.dataset.cat;
      apply();
    });
    $("#q").addEventListener("input", (e) => { state.q = e.target.value; apply(); });
    apply();
  }

  /* ---------- FREE ---------- */
  function renderFree(site, products) {
    const list = products.filter((p) => p.isFree);
    const byId = Object.fromEntries(products.map((p) => [p.id, p]));
    $("#free-list").innerHTML = list.map((p) => {
      const full = p.fullVersion && byId[p.fullVersion];
      return `
      <article class="free-card reveal" style="--accent:${esc(p.accent || "#b8ff2e")}">
        <a class="free-card-media" href="${productUrl(p)}" aria-label="View ${esc(p.name)}">
          <div class="card-badges"><div class="left">${badges(p)}</div></div>
          <img src="${esc(p.cover || p.image)}" alt="${esc(p.name)} interface" loading="lazy" decoding="async">
        </a>
        <div class="free-card-body">
          <span class="card-cat">${esc(p.category)}</span>
          <h2>${esc(p.name)}</h2>
          <p class="product-desc">${esc(p.description)}</p>
          <ul class="feat">${p.features.slice(0, 5).map((f) => `<li>${ICONS.check}<span>${esc(f)}</span></li>`).join("")}</ul>
          <div class="chips">${p.compatibility.formats.map((x) => `<span class="tag">${esc(x)}</span>`).join("")}${p.compatibility.os.map((x) => `<span class="tag os">${esc(x.split(" (")[0])}</span>`).join("")}</div>
          <div class="actions">
            ${p.isAvailable
              ? `<a class="btn btn-primary" href="${esc(buyUrl(p, site))}" target="_blank" rel="noopener">${ICONS.down} Free download</a>`
              : `<span class="btn btn-primary" aria-disabled="true">${ICONS.lock} Coming soon</span>`}
            <a class="btn btn-ghost" href="${productUrl(p)}">View plugin</a>
          </div>
          ${full ? `<p class="upgrade">Want more? <a href="${productUrl(full)}">Unlock everything in ${esc(full.name)}</a> · ${formatPrice(full)}</p>` : ""}
        </div>
      </article>`;
    }).join("") || '<p class="empty">New free plugins are on the way.</p>';
    renderFollow(site);
  }

  /* ---------- PRODUCTO ---------- */
  function renderProduct(site, products) {
    const id = new URLSearchParams(location.search).get("id");
    const p = products.find((x) => x.id === id);
    const root = $("#product");
    if (!p) {
      document.title = "Plugin not found · PlugSaurus";
      root.innerHTML = `<div class="container section"><div class="error-box"><h1 class="section-title">Plugin not found</h1><p style="margin:16px 0 24px">This plugin went extinct… or never existed.</p><a class="btn btn-primary" href="plugins.html">See all plugins</a></div></div>`;
      return;
    }
    const byId = Object.fromEntries(products.map((x) => [x.id, x]));
    const accent = p.accent || "#b8ff2e";
    document.documentElement.style.setProperty("--accent", accent);
    setMeta(p, site);

    const sibling = (p.freeVersion && byId[p.freeVersion]) || (p.fullVersion && byId[p.fullVersion]);
    const related = products
      .filter((x) => x.id !== p.id && x.id !== (sibling && sibling.id))
      .sort((a, b) => (b.category === p.category) - (a.category === p.category) || (!a.isFree - !b.isFree) * -1)
      .slice(0, 3);

    const cta = p.isAvailable
      ? `<a class="btn ${p.isFree ? "btn-primary" : "btn-primary"} btn-lg btn-block" style="--c:${esc(accent)}" href="${esc(buyUrl(p, site))}" target="_blank" rel="noopener" data-gumroad="${esc(p.id)}">${p.isFree ? ICONS.down + " Free download" : ICONS.bag + " Buy now"}</a>`
      : `<span class="btn btn-primary btn-lg btn-block" aria-disabled="true">${ICONS.lock} Coming soon</span>`;

    const featureHTML = p.features.map((f) => {
      const m = f.match(/^([A-Z0-9][A-Z0-9 +&\/-]{2,}):\s*(.*)$/);
      return `<li>${ICONS.check}<span>${m ? `<strong>${esc(m[1])}:</strong> ${esc(m[2])}` : esc(f)}</span></li>`;
    }).join("");

    const c = p.compatibility;
    const isMac = c.os.some((o) => /mac/i.test(o));

    root.innerHTML = `
      <section class="product-hero" style="--accent:${esc(accent)}">
        <div class="container">
          <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><a href="plugins.html">Plugins</a><span>/</span><span aria-current="page">${esc(p.name)}</span></nav>
          <div class="product-grid" style="margin-top:24px">
            <div>
              <div class="gallery-main"><img id="gallery-main" src="${esc(p.gallery[0])}" alt="${esc(p.name)} interface" width="1600" height="900" fetchpriority="high"></div>
              ${p.gallery.length > 1 ? `<div class="gallery-thumbs" role="list">${p.gallery.map((g, i) => `<button role="listitem" data-src="${esc(g)}" aria-current="${i === 0}" aria-label="Show image ${i + 1}"><img src="${esc(g)}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
            </div>
            <div class="product-info">
              <div class="chips">${badges(p)}<span class="badge">${esc(p.category)}</span></div>
              <h1>${esc(p.name)}</h1>
              ${p.tagline ? `<p class="product-tagline">${esc(p.tagline)}</p>` : ""}
              ${(p.longDescription && p.longDescription.length ? p.longDescription : [p.description]).map((t) => `<p class="product-desc">${esc(t)}</p>`).join("")}
              <div class="buy-box" id="buy-box">
                <div class="price ${p.isFree ? "free" : ""}">${formatPrice(p)}${p.isFree && p.isAvailable ? "<small>pay what you want</small>" : ""}</div>
                ${cta}
                ${p.isAvailable ? `<div class="secure">${ICONS.lock} Secure checkout & instant download on Gumroad</div>` : `<div class="secure">Not available yet — follow us on Instagram to know when it drops.</div>`}
                ${sibling ? `<p class="alt">${sibling.isFree ? `Not sure yet? <a href="${productUrl(sibling)}">Try ${esc(sibling.name)} free</a>` : `Want everything? <a href="${productUrl(sibling)}">Get ${esc(sibling.name)}</a> · ${formatPrice(sibling)}`}</p>` : ""}
              </div>
              <div class="chips">${c.formats.map((x) => `<span class="tag">${esc(x)}</span>`).join("")}${c.os.map((x) => `<span class="tag os">${esc(x.split(" (")[0])}</span>`).join("")}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-sm" style="--accent:${esc(accent)}">
        <div class="container detail-grid">
          <div class="panel reveal"><h2>Features</h2><ul class="features">${featureHTML}</ul></div>
          <div class="panel reveal">
            <h2>Compatibility</h2>
            <dl class="spec">
              ${c.os.length ? `<div><dt>System</dt><dd><div class="chips">${c.os.map((x) => `<span class="tag os">${esc(x)}</span>`).join("")}</div></dd></div>` : ""}
              ${c.formats.length ? `<div><dt>Formats</dt><dd><div class="chips">${c.formats.map((x) => `<span class="tag">${esc(x)}</span>`).join("")}</div></dd></div>` : ""}
              ${c.daws.length ? `<div><dt>Works in</dt><dd><div class="chips">${c.daws.map((x) => `<span class="tag">${esc(x)}</span>`).join("")}</div></dd></div>` : ""}
              ${p.license ? `<div><dt>License</dt><dd class="product-desc">${esc(p.license)}</dd></div>` : ""}
            </dl>
            ${(p.notes || []).map((n) => `<p class="note" style="margin-top:16px">${esc(n)}</p>`).join("")}
          </div>
        </div>
      </section>

      ${p.videos.length ? `
      <section class="section-sm" style="--accent:${esc(accent)}">
        <div class="container">
          <span class="eyebrow">Hear it · See it</span>
          <h2 class="section-title" style="margin-bottom:28px">Demos</h2>
          <div class="videos">
            ${p.videos.map((v) => `<figure class="video-card ${v.vertical ? "vertical" : "horizontal"} reveal" style="margin:0"><video controls playsinline preload="none" ${v.poster ? `poster="${esc(v.poster)}"` : ""}><source src="${esc(v.src)}" type="video/mp4"></video><figcaption>${esc(v.title || p.name)}</figcaption></figure>`).join("")}
          </div>
        </div>
      </section>` : ""}

      <section class="section-sm" style="--accent:${esc(accent)}">
        <div class="container">
          <div class="panel reveal">
            <h2>Installation</h2>
            <div class="tabs" role="tablist">
              <button role="tab" aria-selected="true" data-os="win">Windows</button>
              ${isMac ? '<button role="tab" aria-selected="false" data-os="mac">macOS</button>' : ""}
            </div>
            <ol class="steps" data-panel="win">
              <li><span>${p.isFree ? "Download" : "Buy and download"} <strong>${esc(p.name)}</strong> on Gumroad and run the Windows installer (.exe).</span></li>
              <li><span>If Windows shows <strong>“Windows protected your PC”</strong>, click <strong>More info → Run anyway</strong>. The installer is not digitally signed yet.</span></li>
              <li><span>Open your DAW and <strong>rescan plug-ins</strong> (Ableton: Preferences → Plug-Ins → Rescan).</span></li>
              <li><span>Load it from <strong>PlugSaurus › ${esc(p.name.replace(/ (Lite|Free Trial)$/i, ""))}</strong>.</span></li>
              ${!p.isFree ? `<li><span>Click <strong>DEMO - ACTIVATE</strong> in the plugin and paste the license key from your Gumroad receipt.</span></li>` : ""}
            </ol>
            ${isMac ? `
            <ol class="steps" data-panel="mac" hidden>
              <li><span>${p.isFree ? "Download" : "Buy and download"} <strong>${esc(p.name)}</strong> on Gumroad and run the Mac installer (.pkg).</span></li>
              <li><span>If macOS blocks it, go to <strong>System Settings → Privacy & Security → Open Anyway</strong>. The installer is not notarized yet.</span></li>
              <li><span>Open your DAW and rescan plug-ins. In Logic/GarageBand use the <strong>AU</strong> version.</span></li>
              ${!p.isFree ? `<li><span>Click <strong>DEMO - ACTIVATE</strong> and paste the license key from your Gumroad receipt.</span></li>` : ""}
            </ol>` : ""}
          </div>
        </div>
      </section>

      ${related.length ? `
      <section class="section-sm">
        <div class="container">
          <div class="section-head"><div><span class="eyebrow">More from the herd</span><h2 class="section-title">You may also <span class="hl">like</span></h2></div><a class="btn btn-ghost" href="plugins.html">All plugins ${ICONS.arrow}</a></div>
          <div class="grid grid-fit">${related.map((r) => card(r, site)).join("")}</div>
        </div>
      </section>` : ""}

      <div class="sticky-buy" id="sticky-buy" style="--accent:${esc(accent)}">
        <div><div class="name">${esc(p.name)}</div><div class="price ${p.isFree ? "free" : ""}">${formatPrice(p)}</div></div>
        ${p.isAvailable ? `<a class="btn btn-primary btn-sm" style="--c:${esc(accent)}" href="${esc(buyUrl(p, site))}" target="_blank" rel="noopener">${p.isFree ? "Free download" : "Buy now"}</a>` : `<span class="btn btn-primary btn-sm" aria-disabled="true">Coming soon</span>`}
      </div>`;

    // galería
    $$(".gallery-thumbs button", root).forEach((b) => b.addEventListener("click", () => {
      const main = $("#gallery-main");
      main.style.opacity = 0;
      setTimeout(() => { main.src = b.dataset.src; main.style.opacity = 1; }, 150);
      $$(".gallery-thumbs button", root).forEach((x) => x.setAttribute("aria-current", x === b));
    }));
    // pestañas instalación
    $$(".tabs button", root).forEach((b) => b.addEventListener("click", () => {
      $$(".tabs button", root).forEach((x) => x.setAttribute("aria-selected", x === b));
      $$("[data-panel]", root).forEach((pn) => (pn.hidden = pn.dataset.panel !== b.dataset.os));
    }));
    // barra de compra fija en móvil
    const sticky = $("#sticky-buy"), box = $("#buy-box");
    document.body.classList.add("has-sticky");
    if ("IntersectionObserver" in window && sticky && box) {
      new IntersectionObserver(([e]) => sticky.classList.toggle("show", !e.isIntersecting && e.boundingClientRect.top < 0)).observe(box);
    }
  }

  function setMeta(p, site) {
    const title = `${p.name} — ${p.isFree ? "Free " : ""}${p.category} plugin · PlugSaurus`;
    document.title = title;
    const desc = p.description;
    const abs = (u) => new URL(u, location.href).href;
    const set = (sel, attr, val) => { const m = $(sel); if (m) m.setAttribute(attr, val); };
    set('meta[name="description"]', "content", desc);
    set('meta[property="og:title"]', "content", title);
    set('meta[property="og:description"]', "content", desc);
    set('meta[property="og:image"]', "content", abs(p.cover || p.image));
    set('meta[property="og:url"]', "content", location.href);
    set('link[rel="canonical"]', "href", abs(productUrl(p)));
    const ld = {
      "@context": "https://schema.org", "@type": "SoftwareApplication",
      name: p.name, applicationCategory: "MultimediaApplication", operatingSystem: p.compatibility.os.join(", "),
      description: desc, image: abs(p.cover || p.image),
      brand: { "@type": "Brand", name: "PlugSaurus" },
      offers: p.isAvailable ? { "@type": "Offer", price: p.isFree ? "0" : String(p.price), priceCurrency: (p.currency || "USD").toUpperCase(), url: p.gumroadUrl, availability: "https://schema.org/InStock" } : undefined
    };
    const s = document.createElement("script");
    s.type = "application/ld+json"; s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  }

  /* ---------- arranque ---------- */
  PlugCatalog.load().then(({ site, products }) => {
    header(site);
    footer(site, products);
    if (page === "home") renderHome(site, products);
    if (page === "catalog") renderCatalog(site, products);
    if (page === "free") renderFree(site, products);
    if (page === "product") renderProduct(site, products);
    reveal();
  }).catch((err) => {
    console.error(err);
    const target = $("main");
    if (target) target.insertAdjacentHTML("afterbegin", `<div class="container section"><div class="error-box">The plugin catalog could not load right now. Visit our store directly: <a class="btn btn-primary btn-sm" href="https://dreamboyz.gumroad.com/" style="margin-left:8px">Gumroad store</a></div></div>`);
  });
})();
