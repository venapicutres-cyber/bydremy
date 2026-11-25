"""Build the React app's content + CSS layer from the offline backup.

The backup contains the WordPress REST payload for every page (rendered
Elementor markup) and every compiled stylesheet.  This script:

* copies the compiled stylesheets into public/site-css with absolute asset
  URLs rewritten to local paths;
* writes the rendered page markup into src/content/pages/<id>.html with all
  WordPress/analytics URLs rewritten;
* writes generated manifests used by the React app.
"""
from __future__ import annotations

import json
import pathlib
import re
import shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
BACKUP = ROOT / "BYDREAMY_FULL_BACKUP"
PUBLIC = ROOT / "public"
OUT_CSS = PUBLIC / "site-css"
OUT_CONTENT = ROOT / "src" / "content" / "pages"
OUT_DATA = ROOT / "src" / "data" / "generated"
EXTRA = ROOT / "capture" / "extra-pages"

for folder in (OUT_CSS, OUT_CONTENT, OUT_DATA):
    folder.mkdir(parents=True, exist_ok=True)

SITE_HOSTS = [
    "https://bydreamy.com",
    "http://bydreamy.com",
    "https://www.bydreamy.com",
    "http://www.bydreamy.com",
    "https://bydreamy.com",
    "http://bydreamy.com",
    "https://www.bydreamy.com",
    "http://www.bydreamy.com",
]

TEMPLATES = [
    # id, slug, name, category, order
    (324486, "demo-heritage-series-ameera", "Ameera", "heritage", 1),
    (324494, "demo-heritage-series-utary", "Utary", "heritage", 2),
    (324502, "demo-heritage-series-sandhayu", "Sandhayu", "heritage", 3),
    (324522, "demo-heritage-series-sandhayu-v2", "Sandhayu V2", "heritage", 4),
    (324524, "demo-heritage-series-aruna", "Aruna", "heritage", 5),
    (324548, "demo-heritage-series-aruna-v2", "Aruna V2", "heritage", 6),
    (9012, "demo-moody-papercut", "Papercut", "moody", 7),
    (10363, "demo-moody-sweetpink-fix", "Sweetpink", "moody", 8),
    (9014, "demo-moody-wave", "Wave", "moody", 9),
    (736, "demo-premium-01", "Endless Love 01", "premium", 10),
    (14622, "demo-premium-02", "Flawless 02", "premium", 11),
    (17655, "demo-premium-03-sage", "Sage 03", "premium", 12),
    (15983, "demo-premium-04", "Alyssa 04", "premium", 13),
    (26683, "demo-premium-05", "Shakira 05", "premium", 14),
    (287480, "demo-premium-06-danila-redesign", "Danila Redesign 06", "premium", 15),
    (54578, "demo-premium-07-ariya", "Ariya 07", "premium", 16),
    (58253, "demo-premium-08-beanca", "Beanca 08", "premium", 17),
    (161634, "demo-premium-09-ivanna", "Ivanna 09", "premium", 18),
    (162067, "demo-premium-10-flara", "Flara 10", "premium", 19),
    (322220, "demo-premium-11-kila", "Kila 11", "premium", 20),
    (10755, "demo-watercolor-01-dandelion", "Dandelion 01", "watercolor", 21),
    (11323, "demo-watercolor-02-alyssum", "Alyssum 02", "watercolor", 22),
    (11938, "demo-watercolor-03-lotus", "Lotus 03", "watercolor", 23),
    (12008, "demo-watercolor-04-bluebell", "Bluebell 04", "watercolor", 24),
    (12058, "demo-watercolor-05-rainlily", "Rainlily 05", "watercolor", 25),
]

OTHER_PAGES = [
    (80785, "sales-page-2024", "home", "Home"),
    (212745, "portfolio-bydreamy", "portfolio", "Portfolio"),
    (111732, "portfolio", "portfolio-archive", "Portfolio Archive"),
    (95093, "digital-guestbook", "digital-guestbook", "Digital Guestbook"),
    (93044, "video-statik", "video-statik", "Video & Statik"),
    (94871, "wedding-frame", "wedding-frame", "Wedding Frame"),
    (10671, "katalog-website", "katalog", "Katalog Undangan Website"),
    (12993, "katalog-video-statik", "katalog-video-statik", "Katalog Video & Statik"),
    (13031, "katalog-buku-tamu-fix", "katalog-buku-tamu", "Katalog Buku Tamu"),
    (153033, "contact-us", "kontak", "Contact Us"),
    (111735, "404-not-found", "not-found", "404 Not Found"),
]

# Curated card thumbnails taken from the brand's own preview artwork.
THUMBS = {
    "heritage": {
        "Ameera": "/wp-content/uploads/2026/02/AMEERA-SLIDE-1.webp",
        "Utary": "/wp-content/uploads/2026/02/UTARY-SLIDE-1.webp",
        "Sandhayu": "/wp-content/uploads/2026/02/SANDHAYU-SLIDE-1.webp",
        "Sandhayu V2": "/wp-content/uploads/2026/02/SANDHAYU-SLIDE-2.webp",
        "Aruna": "/wp-content/uploads/2026/02/ARUNA-SLIDE-1.webp",
        "Aruna V2": "/wp-content/uploads/2026/02/ARUNA-SLIDE-2.webp",
    },
    "moody": {
        "Papercut": "/wp-content/uploads/2024/05/MOODY-PAPERCUT-1024x1024.webp",
        "Sweetpink": "/wp-content/uploads/2024/05/MOODY-SWEETPINK-1024x1024.webp",
        "Wave": "/wp-content/uploads/2024/05/MOODY-WAVE-1024x1024.webp",
    },
    "premium": {
        "Endless Love 01": "/wp-content/uploads/2024/06/PREVIEW_Endless-Love@500.webp",
        "Flawless 02": "/wp-content/uploads/2024/06/PREVIEW_Flawless@500.webp",
        "Sage 03": "/wp-content/uploads/2024/06/PREVIEW_Sage-2@500.webp",
        "Alyssa 04": "/wp-content/uploads/2024/06/PREVIEW_Alyssa@500.webp",
        "Shakira 05": "/wp-content/uploads/2024/06/PREVIEW_Shakira@500.webp",
        "Danila Redesign 06": "/wp-content/uploads/2025/03/PREVIEW_Danila-2.webp",
        "Ariya 07": "/wp-content/uploads/2024/06/PREVIEW_Ariya@500.webp",
        "Beanca 08": "/wp-content/uploads/2024/06/PREVIEW_Beanca-2@500.webp",
        "Ivanna 09": "/wp-content/uploads/2024/09/PREVIEW_Ivanna-1.webp",
        "Flara 10": "/wp-content/uploads/2024/09/PREVIEW_Flara.webp",
        "Kila 11": "/wp-content/uploads/2025/07/PREVIEW-KATALOG-KILA.webp",
    },
    "watercolor": {
        "Dandelion 01": "/wp-content/uploads/2023/05/pexels-danu-hidayatur-rahman-2802482-scaled-1.jpg",
        "Alyssum 02": "/wp-content/uploads/2023/05/couple-5657196-min-scaled-1.jpg",
        "Lotus 03": "/wp-content/uploads/2023/05/fahmi-ramadhan-lKKZ5nODio8-unsplash-1-scaled-1.jpg",
        "Bluebell 04": "/wp-content/uploads/2023/05/fahmi-ramadhan-HOYnvRn_qiM-unsplash-scaled-1.jpg",
        "Rainlily 05": "/wp-content/uploads/2023/05/galuh-hari-setiawan-ubxrY1M7cq4-unsplash-scaled-1.jpg",
    },
}

CATEGORY_META = {
    "heritage": {
        "name": "Heritage",
        "tagline": "Klasik, hangat, dan penuh detail",
        "description": "Sentuhan warisan Nusantara dengan ornamen, motif, dan tipografi klasik yang dirangkai modern.",
        "accent": "#AD8E70",
        "cover": "/wp-content/uploads/2026/02/AMEERA-SLIDE-2.webp",
    },
    "moody": {
        "name": "Moody",
        "tagline": "Berani, emosional, tak biasa",
        "description": "Palet gelap dan warna berani untuk pasangan yang ingin undangan berbeda dari yang lain.",
        "accent": "#562231",
        "cover": "/wp-content/uploads/2024/05/MOODY-WAVE-1024x1024.webp",
    },
    "premium": {
        "name": "Premium",
        "tagline": "Mewah, sinematik, berkelas",
        "description": "Koleksi signature dengan komposisi sinematik, detail emas, dan pengalaman undangan yang mewah.",
        "accent": "#8D6E44",
        "cover": "/wp-content/uploads/2024/09/PREVIEW_Flara.webp",
    },
    "watercolor": {
        "name": "Watercolor",
        "tagline": "Lembut, artistik, romantis",
        "description": "Lukisan cat air dengan nuansa lembut untuk pernikahan yang intim dan puitis.",
        "accent": "#987070",
        "cover": "/wp-content/uploads/2023/05/couple-5657196-min-scaled-1.jpg",
    },
}


def rewrite(text: str) -> str:
    for host in SITE_HOSTS:
        text = text.replace(host, "")
    # URLs embedded inside JSON attributes escape the slashes.
    for host in ("bydreamy.com", "bydreamy.com", "www.bydreamy.com", "www.bydreamy.com"):
        text = text.replace("https:\\/\\/" + host, "")
        text = text.replace("http:\\/\\/" + host, "")
    # Protocol relative leftovers
    text = text.replace("//bydreamy.com", "")
    text = text.replace("//bydreamy.com", "")
    return text


def sanitize(html: str) -> str:
    # Remove the Meta Pixel fallback and any analytics embeds.
    html = re.sub(r"(?is)<noscript>.*?(facebook\.com/tr|googletagmanager|google-analytics).*?</noscript>", "", html)
    html = re.sub(r"(?is)<script[^>]*src=[\"'][^\"']*(googletagmanager|google-analytics|connect\.facebook|cloudflareinsights)[^\"']*[\"'][^>]*>\s*</script>", "", html)
    html = re.sub(r"(?is)<iframe[^>]*googletagmanager[^>]*>\s*</iframe>", "", html)

    def script_repl(match: re.Match[str]) -> str:
        body = match.group(1)
        bad = ("_0x", "atob(", "googletagmanager", "fbq(", "gtag(", "clarity(", "function(l,m){function v(")
        return "" if any(token in body for token in bad) else match.group(0)

    html = re.sub(r"(?is)<script[^>]*>(.*?)</script>", script_repl, html)
    # WP emoji / oembed leftovers in body text
    html = html.replace("<!-- Meta Pixel Code -->", "")
    return html


def css_relative_urls(css: str, local_path: pathlib.Path) -> str:
    """Rewrite relative url(...) entries using the mirrored asset tree."""
    try:
        rel_dir = local_path.parent.relative_to(PUBLIC).as_posix()
    except ValueError:
        rel_dir = "wp-content/uploads/elementor/css"

    def repl(match: re.Match[str]) -> str:
        raw = match.group(1).strip().strip("\"'")
        if raw.startswith(("data:", "http:", "https:", "//", "#")):
            return match.group(0)
        # resolve against the stylesheet's public directory
        parts = (pathlib.PurePosixPath("/") / rel_dir / raw).as_posix()
        normalized = []
        for part in parts.split("/"):
            if part == "..":
                if normalized:
                    normalized.pop()
            elif part not in ("", "."):
                normalized.append(part)
        return f"url(/{'/'.join(normalized)})"

    return re.sub(r"url\(\s*([^)]+?)\s*\)", repl, css)


def copy_css(local_path: pathlib.Path, flat_name: str) -> str:
    css = local_path.read_text(encoding="utf-8", errors="ignore")
    css = rewrite(css)
    css = css_relative_urls(css, local_path)
    (OUT_CSS / flat_name).write_text(css, encoding="utf-8")
    return flat_name


def find_post_css(page_id: int) -> pathlib.Path | None:
    matches = list((PUBLIC / "wp-content" / "uploads" / "elementor" / "css").glob(f"post-{page_id}_*.css"))
    if matches:
        return matches[0]
    extra = EXTRA / f"{page_id}.css"
    return extra if extra.exists() else None


# ---------------------------------------------------------------------------
# 1. Global stylesheets, in the same cascade order as the WordPress page head.
# ---------------------------------------------------------------------------
css_order: list[pathlib.Path] = []


def add_css(*rel: str) -> None:
    for item in rel:
        p = PUBLIC / item
        if p.exists():
            css_order.append(p)


def add_css_glob(rel_dir: str, pattern: str = "*.css") -> None:
    base = PUBLIC / rel_dir
    if base.exists():
        css_order.extend(sorted(base.glob(pattern)))


add_css(
    "wp-content/plugins/weddingpress/assets/css/modules/bdt-uikit_414d047743.css",
    "wp-content/plugins/weddingpress/assets/css/modules/ep-helper_412573b661.css",
    "wp-content/uploads/useanyfont/uaf_d248c2a220.css",
    "wp-content/plugins/weddingpress/assets/css/exad-styles.min_7f165d7d2d.css",
    "wp-content/plugins/weddingpress/addons/comment-kit2/css/cui_style_96ccbdc32f.css",
    "wp-content/plugins/weddingpress/assets/css/new-icon.min_412573b661.css",
    "wp-content/themes/hello-elementor/style.min_09d0f8346a.css",
    "wp-content/themes/hello-elementor/theme.min_09d0f8346a.css",
    "wp-content/themes/hello-elementor/header-footer.min_09d0f8346a.css",
    "wp-content/plugins/elementor/assets/css/frontend.min_cdbee8ae73.css",
    "wp-content/plugins/elementor/assets/lib/eicons/css/elementor-icons.min_14b453aa9c.css",
    "wp-content/plugins/wpforms-lite/assets/css/frontend/modern/wpforms-full.min_b0d77473ad.css",
    "wp-content/plugins/weddingpress/assets/css/wdp_412573b661.css",
    "wp-content/plugins/weddingpress/assets/css/guest-book_412573b661.css",
    "wp-content/plugins/elementor/assets/lib/font-awesome/css/all.min_cdbee8ae73.css",
    "wp-content/plugins/elementor/assets/lib/font-awesome/css/v4-shims.min_cdbee8ae73.css",
    "wp-content/plugins/elementor/assets/lib/font-awesome/css/fontawesome.min_f88fcb658c.css",
    "wp-content/plugins/elementor/assets/lib/font-awesome/css/regular.min_f88fcb658c.css",
    "wp-content/plugins/elementor/assets/lib/font-awesome/css/solid.min_f88fcb658c.css",
    "wp-content/plugins/elementor/assets/lib/font-awesome/css/brands.min_f88fcb658c.css",
    "wp-content/plugins/powerpack-elements/assets/css/min/extensions.min_ad802dbefd.css",
    "wp-content/plugins/powerpack-elements/assets/css/min/tooltip.min_ad802dbefd.css",
    "wp-content/plugins/powerpack-elements/assets/css/min/pp-swiper.min_ad802dbefd.css",
    "wp-content/plugins/powerpack-elements/assets/css/min/widget-image-slider.min_ad802dbefd.css",
    "wp-content/plugins/powerpack-elements/assets/css/min/widget-one-page-nav.min_ad802dbefd.css",
    "wp-content/plugins/powerpack-elements/assets/css/min/widget-price-menu.min_ad802dbefd.css",
    "wp-content/plugins/powerpack-elements/assets/css/min/widget-testimonials.min_ad802dbefd.css",
    "wp-content/plugins/powerpack-elements/assets/css/min/widget-timeline.min_ad802dbefd.css",
    "wp-content/plugins/powerpack-elements/assets/css/min/widget-advanced-accordion.min_ad802dbefd.css",
    "wp-content/plugins/powerpack-elements/assets/css/min/widget-devices.min_ad802dbefd.css",
    "wp-content/plugins/powerpack-elements/assets/css/min/widget-icon-list.min_ad802dbefd.css",
    "wp-content/plugins/elementor/assets/lib/swiper/v8/css/swiper.min_a6139715ce.css",
    "wp-content/plugins/elementor/assets/css/conditionals/e-swiper.min_cdbee8ae73.css",
    "wp-content/plugins/elementor/assets/lib/e-gallery/css/e-gallery.min_700385cbc3.css",
    "wp-content/plugins/elementor-pro/assets/css/conditionals/transitions.min_cdbee8ae73.css",
    "wp-content/plugins/elementor-pro/assets/css/conditionals/popup.min_cdbee8ae73.css",
    "wp-content/plugins/elementor-pro/assets/css/modules/sticky.min_cdbee8ae73.css",
    "wp-content/plugins/elementor-pro/assets/css/widget-form.min_cdbee8ae73.css",
    "wp-content/plugins/elementor-pro/assets/css/widget-gallery.min_cdbee8ae73.css",
    "wp-content/plugins/elementor-pro/assets/css/widget-countdown.min_cdbee8ae73.css",
    "wp-content/plugins/elementor-pro/assets/css/widget-slides.min_cdbee8ae73.css",
    "wp-content/plugins/elementor-pro/assets/css/widget-animated-headline.min_cdbee8ae73.css",
    "wp-content/plugins/elementor-pro/assets/css/widget-nested-carousel.min_cdbee8ae73.css",
    "wp-content/plugins/elementor-pro/assets/css/widget-lottie.min_cdbee8ae73.css",
)
add_css_glob("wp-content/plugins/elementor/assets/css", "widget-*.css")
add_css_glob("wp-content/plugins/elementor/assets/lib/animations/styles", "*.css")
add_css("wp-content/plugins/happy-elementor-addons/assets/fonts/style.min_eb07a154a5.css",
        "wp-content/plugins/happy-elementor-addons/assets/fonts/huge-icons/huge-icons.min_eb07a154a5.css")
add_css_glob("wp-content/plugins/icon-element/assets", "*.css")
add_css_glob("wp-content/plugins/icon-element/assets/ionicons/css", "*.css")
add_css_glob("wp-content/plugins/icon-element/assets/material-icons/css", "*.css")
add_css_glob("wp-content/plugins/weddingpress/addons/comment-kit2/css", "*.css")
# Self-hosted Google fonts (skip the two giant CJK/Arabic families)
for font_css in sorted((PUBLIC / "wp-content/uploads/elementor/google-fonts/css").glob("*.css")):
    if "notosansjp" in font_css.name or "notosansadlam" in font_css.name:
        continue
    css_order.append(font_css)
add_css("wp-content/uploads/elementor/css/post-7_11033eab72.css")

global_links: list[str] = []
seen: set[pathlib.Path] = set()
for path in css_order:
    if path in seen:
        continue
    seen.add(path)
    flat = "g-" + path.relative_to(PUBLIC).as_posix().replace("/", "__")
    copy_css(path, flat)
    global_links.append(flat)

print(f"global css: {len(global_links)} files")

# ---------------------------------------------------------------------------
# 2. Page content
# ---------------------------------------------------------------------------
manifest: list[dict] = []
template_manifest: list[dict] = []


def load_page(page_id: int) -> dict:
    backup_json = BACKUP / "other" / "wp-json" / "wp" / "v2" / "pages" / f"{page_id}.json"
    if backup_json.exists():
        return json.loads(backup_json.read_text(encoding="utf-8"))
    extra_json = EXTRA / f"{page_id}.json"
    if extra_json.exists():
        return json.loads(extra_json.read_text(encoding="utf-8"))
    raise FileNotFoundError(page_id)


def first_image(html: str) -> str:
    m = re.search(r"<img[^>]+src=[\"']([^\"']+)[\"']", html)
    if m:
        return m.group(1)
    m = re.search(r"url\(([^)]+)\)", html)
    return m.group(1).strip("\"'") if m else ""


def write_page(page_id: int, slug: str, route: str, label: str, category: str | None = None, order: int = 0, template_name: str | None = None) -> dict:
    data = load_page(page_id)
    html = data["content"]["rendered"]
    html = rewrite(html)
    html = sanitize(html)
    (OUT_CONTENT / f"{page_id}.html").write_text(html, encoding="utf-8")

    css_name = f"post-{page_id}.css"
    post_css = find_post_css(page_id)
    if post_css:
        copy_css(post_css, css_name)

    title = re.sub(r"<[^>]+>", "", data.get("title", {}).get("rendered", label))
    desc = ""
    if isinstance(data.get("aioseo_head_json"), dict):
        desc = data["aioseo_head_json"].get("description", "")
    if not desc:
        desc = re.sub(r"<[^>]+>", " ", data.get("excerpt", {}).get("rendered", "")).strip()

    thumb = ""
    if category and template_name:
        thumb = THUMBS.get(category, {}).get(template_name, "")
    if not thumb:
        thumb = first_image(html)

    entry = {
        "id": page_id,
        "slug": slug,
        "route": route,
        "label": label,
        "title": title,
        "description": desc,
        "category": category,
        "order": order,
        "templateName": template_name,
        "file": f"{page_id}.html",
        "css": css_name,
        "thumb": thumb,
        "status": "published",
        "kind": "template" if category else ("home" if route == "/" else "page"),
    }
    manifest.append(entry)
    return entry


for page_id, slug, name, category, order in TEMPLATES:
    entry = write_page(page_id, slug, f"/{slug}", name, category, order, name)
    template_manifest.append(entry)

for page_id, slug, route, label in OTHER_PAGES:
    write_page(page_id, slug, f"/{slug}" if route != "home" else "/", label)

CATEGORIES = []
for key, meta in CATEGORY_META.items():
    CATEGORIES.append({
        "id": key,
        "name": meta["name"],
        "slug": key,
        "tagline": meta["tagline"],
        "description": meta["description"],
        "accent": meta["accent"],
        "cover": meta["cover"],
        "count": sum(1 for t in template_manifest if t["category"] == key),
    })

(OUT_DATA / "pages.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
(OUT_DATA / "categories.json").write_text(json.dumps(CATEGORIES, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"pages: {len(manifest)} templates: {len(template_manifest)} categories: {len(CATEGORIES)}")

# ---------------------------------------------------------------------------
# 3. Write the stylesheet links into index.html
# ---------------------------------------------------------------------------
index = ROOT / "index.html"
index_text = index.read_text(encoding="utf-8")
links = "\n".join(f'    <link rel="stylesheet" href="/site-css/{name}" />' for name in global_links)
start = "<!-- CLONE_STYLES_START -->"
end = "<!-- CLONE_STYLES_END -->"
if start in index_text:
    index_text = re.sub(rf"{start}.*?{end}", f"{start}\n{links}\n{end}", index_text, flags=re.S)
else:
    index_text = index_text.replace("</head>", f"  {start}\n{links}\n{end}\n  </head>")
index.write_text(index_text, encoding="utf-8")
print("index.html styles written")
