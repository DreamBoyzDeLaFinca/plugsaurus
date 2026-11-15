"""Genera sitemap.xml y robots.txt a partir de data/products.json.
Necesita data/site.json -> siteUrl con la direccion publica (p. ej. https://plugsaurus.pages.dev).
Uso: python tools/build_sitemap.py"""
import json
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
site = json.loads((ROOT / "data" / "site.json").read_text(encoding="utf-8"))
base = (site.get("siteUrl") or "").rstrip("/")
if not base:
    print("siteUrl vacio en data/site.json: no se genera sitemap.")
    raise SystemExit(0)
products = json.loads((ROOT / "data" / "products.json").read_text(encoding="utf-8"))["products"]
urls = ["/", "/plugins.html", "/free.html"] + [
    f"/plugin.html?id={p['id']}" for p in products if p.get("status") not in ("hidden", "draft")]
xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
xml += [f"  <url><loc>{escape(base + u)}</loc></url>" for u in urls]
xml.append("</urlset>")
(ROOT / "sitemap.xml").write_text("\n".join(xml) + "\n", encoding="utf-8")
(ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {base}/sitemap.xml\n", encoding="utf-8")
print(f"sitemap.xml con {len(urls)} URLs")
