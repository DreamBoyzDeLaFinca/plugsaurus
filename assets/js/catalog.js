/* =========================================================
   PLUGSAURUS — capa de datos del catálogo
   1) Lee data/site.json y data/products.json (fuente principal, editable a mano).
   2) Si site.json → gumroad.sync.enabled = true, lee también data/gumroad-sync.json
      (lo genera automáticamente tools/sync_gumroad.py vía GitHub Actions) y lo fusiona.
   La web funciona igual aunque el archivo de sincronización no exista.
   ========================================================= */
(function () {
  "use strict";

  const cache = {};
  async function getJSON(url, optional) {
    if (cache[url]) return cache[url];
    const p = fetch(url, { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error(url + " → HTTP " + r.status);
      return r.json();
    });
    cache[url] = optional ? p.catch(() => null) : p;
    return cache[url];
  }

  function slugify(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  // Fusiona los datos que vienen de Gumroad con products.json.
  // products.json manda en textos, imágenes y características; Gumroad actualiza
  // solo los campos indicados en site.json → gumroad.sync.updateFields.
  function mergeSync(products, sync, cfg) {
    if (!sync || !Array.isArray(sync.products)) return products;
    const fields = cfg.updateFields || [];
    const byPermalink = new Map(products.filter((p) => p.gumroadPermalink).map((p) => [p.gumroadPermalink, p]));
    const result = products.slice();
    for (const g of sync.products) {
      const local = byPermalink.get(g.gumroadPermalink);
      if (local) {
        if (local.syncLocked || local.status === "hidden") continue; // congelado u oculto a mano
        for (const f of fields) {
          if (g[f] === undefined || g[f] === null || g[f] === "") continue;
          // Un borrador de Gumroad no oculta un producto marcado como "coming-soon"
          if (f === "status" && g.status !== "published" && local.status !== "published") continue;
          local[f] = typeof g[f] === "string" ? g[f].trim() : g[f];
        }
        if (fields.includes("price") && typeof g.price === "number") local.type = g.price > 0 ? "PREMIUM" : "FREE";
        if (!local.image && g.image) local.image = g.image;
        local._synced = true;
      } else if (cfg.addNewProducts && g.status === "published") {
        // Producto nuevo publicado en Gumroad que aún no está en products.json
        result.push({
          id: slugify(g.gumroadPermalink || g.name),
          name: g.name,
          tagline: "",
          description: g.description || "",
          longDescription: g.description ? [g.description] : [],
          price: g.price || 0,
          currency: g.currency || "USD",
          type: g.price > 0 ? "PREMIUM" : "FREE",
          category: g.category || "New",
          image: g.image || "assets/img/logo-512.webp",
          cover: g.image || "assets/img/logo-512.webp",
          gallery: g.image ? [g.image] : [],
          videos: [],
          gumroadUrl: g.gumroadUrl,
          gumroadPermalink: g.gumroadPermalink,
          compatibility: { os: [], formats: [], daws: [] },
          features: [],
          status: "published",
          featured: false,
          accent: "#b8ff2e",
          order: 99,
          _synced: true,
          _autoAdded: true
        });
      }
    }
    return result;
  }

  // Promociones con fecha (site.json -> promos). Durante la ventana sobrescriben
  // precio/estado de los productos indicados; fuera de ella no tocan nada.
  // ?promo=<id> en la URL fuerza la vista previa.
  function activePromo(site) {
    const list = site.promos || [];
    const forced = new URLSearchParams(location.search).get("promo");
    const now = Date.now();
    return list.find((pr) => pr.id === forced) ||
      list.find((pr) => now >= Date.parse(pr.start) && now < Date.parse(pr.end)) || null;
  }
  function applyPromo(products, promo) {
    if (!promo) return products;
    const order = Object.keys(promo.products || {});
    return products.map((p) => {
      const o = promo.products[p.id];
      if (!o) return p;
      const q = Object.assign({}, p);
      q.regularPrice = p.price;
      Object.assign(q, o);
      q.type = q.price > 0 ? "PREMIUM" : "FREE";
      q.status = "published";
      q.featured = true;
      q.order = -100 + order.indexOf(p.id);
      q.promo = { id: promo.id, label: promo.label, end: promo.end };
      return q;
    });
  }

  async function load() {
    const [site, data] = await Promise.all([getJSON("data/site.json"), getJSON("data/products.json")]);
    let products = (data.products || []).map((p) => Object.assign({}, p));
    const syncCfg = (site.gumroad && site.gumroad.sync) || {};
    if (syncCfg.enabled) {
      const sync = await getJSON(syncCfg.file || "data/gumroad-sync.json", true);
      products = mergeSync(products, sync, syncCfg);
    }
    const promo = activePromo(site);
    products = applyPromo(products, promo);
    // Normaliza
    products = products
      .filter((p) => p && p.id && p.status !== "hidden" && p.status !== "draft")
      .map((p) => {
        p.type = String(p.type || (p.price > 0 ? "PREMIUM" : "FREE")).toUpperCase();
        p.isFree = p.type === "FREE";
        p.isAvailable = p.status === "published" && !!p.gumroadUrl;
        p.gallery = p.gallery && p.gallery.length ? p.gallery : [p.cover || p.image].filter(Boolean);
        p.compatibility = p.compatibility || { os: [], formats: [], daws: [] };
        p.features = p.features || [];
        p.videos = p.videos || [];
        return p;
      })
      .sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
    return { site, products, promo };
  }

  window.PlugCatalog = { load, slugify };
})();
