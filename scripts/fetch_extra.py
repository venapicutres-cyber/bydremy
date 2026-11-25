"""Fetch the handful of pages that were not included in the offline REST dump.

Only pages that are part of the public navigation / template catalogue are
requested, one page at a time.  Everything is written to capture/extra-pages
so the original backup stays untouched.
"""
import json
import pathlib
import re
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "capture" / "extra-pages"
OUT.mkdir(parents=True, exist_ok=True)

IDS = [
    10671, 12993, 13031, 153033, 111735, 111732,
    10755, 11323, 11938, 12008, 12058,
]


def get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 bydreamy-rebuild"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")


for page_id in IDS:
    try:
        raw = get(
            "https://bydreamy.com/wp-json/wp/v2/pages/"
            f"{page_id}?context=view&_fields=id,slug,link,title,content,excerpt,modified,template,aioseo_head_json"
        )
        data = json.loads(raw)
        (OUT / f"{page_id}.json").write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        print(f"page {page_id} {data['slug']} {len(data['content']['rendered'])}")
    except Exception as exc:  # noqa: BLE001
        print(f"page {page_id} FAILED {exc}")

# Grab the elementor post CSS for each fetched page from the live page head.
for page_id in IDS:
    try:
        html = get(f"https://bydreamy.com/?p={page_id}")
    except Exception as exc:  # noqa: BLE001
        print(f"head {page_id} FAILED {exc}")
        continue
    links = re.findall(
        r"<link[^>]+id=['\"]elementor-post-%d-css['\"][^>]+href=['\"]([^'\"]+)" % page_id,
        html,
    )
    if not links:
        print(f"css {page_id} not listed")
        continue
    href = links[0].replace("&#038;", "&")
    try:
        css = get(href)
    except Exception as exc:  # noqa: BLE001
        print(f"css {page_id} FAILED {exc}")
        continue
    (OUT / f"{page_id}.css").write_text(css, encoding="utf-8")
    print(f"css {page_id} {len(css)} {href}")
