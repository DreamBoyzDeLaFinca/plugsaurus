"""Sincroniza los productos de Gumroad con la web de PlugSaurus.

Usa la API oficial de Gumroad (GET https://api.gumroad.com/v2/products) y escribe
data/gumroad-sync.json. La web fusiona ese archivo con data/products.json cuando
data/site.json -> gumroad.sync.enabled = true.

El token NUNCA va en el codigo: se lee de la variable de entorno GUMROAD_ACCESS_TOKEN
(en GitHub: Settings -> Secrets and variables -> Actions -> New repository secret).

Uso local (opcional):
    set GUMROAD_ACCESS_TOKEN=xxxx        (Windows cmd)
    python tools/sync_gumroad.py
Sin dependencias externas: solo la libreria estandar de Python 3.
"""
import json, os, re, sys, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "gumroad-sync.json"
API = "https://api.gumroad.com/v2/products"


def fetch(url, token):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}", "User-Agent": "plugsaurus-site-sync"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def strip_html(s):
    s = re.sub(r"<br\s*/?>|</p>", "\n", s or "")
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"&nbsp;", " ", s)
    return re.sub(r"\n{2,}", "\n", s).strip()


def permalink_of(p):
    # custom_permalink = la parte final del enlace (p. ej. "stomposaurus")
    if p.get("custom_permalink"):
        return p["custom_permalink"]
    url = p.get("short_url") or ""
    return url.rstrip("/").rsplit("/", 1)[-1]


def normalize(p, store):
    perm = permalink_of(p)
    price_cents = p.get("price") or 0
    published = bool(p.get("published"))
    desc = strip_html(p.get("description"))
    first = desc.split("\n", 1)[0][:240] if desc else ""
    return {
        "gumroadId": p.get("id"),
        "gumroadPermalink": perm,
        "name": p.get("name"),
        "description": first,
        "price": round(price_cents / 100, 2),
        "currency": (p.get("currency") or "usd").upper(),
        "status": "published" if published and not p.get("deleted") else "draft",
        "gumroadUrl": f"{store.rstrip('/')}/l/{perm}" if store and perm else (p.get("short_url") or ""),
        "image": p.get("thumbnail_url") or p.get("preview_url") or "",
    }


def main():
    token = os.environ.get("GUMROAD_ACCESS_TOKEN", "").strip()
    if not token:
        print("Falta GUMROAD_ACCESS_TOKEN. No se cambia nada.")
        return 0
    site = json.loads((ROOT / "data" / "site.json").read_text(encoding="utf-8"))
    store = site.get("gumroad", {}).get("storeUrl", "")

    products, url, pages = [], API, 0
    while url and pages < 20:  # la API puede paginar; limite de seguridad
        data = fetch(url, token)
        if not data.get("success"):
            print("Respuesta de Gumroad sin exito:", data.get("message"))
            return 1
        products += data.get("products", [])
        nxt = data.get("next_page_url") or data.get("next_page_key")
        if nxt and not str(nxt).startswith("http"):
            nxt = API + "?" + urllib.parse.urlencode({"page_key": nxt})
        url, pages = nxt, pages + 1

    out = {
        "_info": "Generado automaticamente por tools/sync_gumroad.py. No editar a mano.",
        "updatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "products": [normalize(p, store) for p in products],
    }
    new = json.dumps(out, ensure_ascii=False, indent=2)
    old = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
    # Evita commits si solo cambia la fecha
    strip_date = lambda s: re.sub(r'"updatedAt": "[^"]*"', "", s)
    if strip_date(old) == strip_date(new):
        print("Sin cambios en Gumroad.")
        return 0
    OUT.write_text(new + "\n", encoding="utf-8")
    print(f"Actualizado {OUT.name}: {len(products)} productos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
