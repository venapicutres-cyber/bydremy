"""Download assets referenced by the cloned pages that the offline backup missed.

The backup mirrors most of /wp-content but not every image, audio file or
Elementor thumbnail.  This script scans the extracted page HTML plus the local
Elementor CSS, checks which /wp-content paths are absent from public/ and
downloads only those from the live site.  The original backup is never touched.
"""
from __future__ import annotations

import concurrent.futures
import pathlib
import re
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
PAGES = ROOT / "src" / "content" / "pages"
CSS = PUBLIC / "site-css"
HOST = "https://bydreamy.com"

URL_RE = re.compile(r"""(?:src|href|data-src|data-thumbnail)=["'](/wp-content/[^"']+)["']""")
CSS_URL_RE = re.compile(r"""url\((['"]?)(/wp-content/[^)'"]+)\1\)""")
IMAGE_SET_RE = re.compile(r"""(?:srcset|data-srcset)=["']([^"']+)["']""")


def collect() -> set[str]:
    urls: set[str] = set()
    for path in PAGES.glob("*.html"):
        text = path.read_text(encoding="utf-8", errors="ignore")
        urls.update(URL_RE.findall(text))
        for group in IMAGE_SET_RE.findall(text):
            for candidate in group.split(","):
                piece = candidate.strip().split(" ")[0]
                if piece.startswith("/wp-content/"):
                    urls.add(piece)
    for path in CSS.glob("*.css"):
        text = path.read_text(encoding="utf-8", errors="ignore")
        urls.update(match[1] for match in CSS_URL_RE.findall(text))
    cleaned = set()
    for url in urls:
        url = urllib.parse.unquote(url).split("?")[0].split("#")[0]
        if url.startswith("/wp-content/"):
            cleaned.add(url)
    return cleaned


def download(url: str) -> tuple[str, str]:
    target = PUBLIC / url.lstrip("/")
    if target.exists() and target.stat().st_size > 0:
        return url, "exists"
    target.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(
        HOST + urllib.parse.quote(url),
        headers={"User-Agent": "Mozilla/5.0 bydreamy-rebuild"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            data = response.read()
        if not data:
            return url, "empty"
        target.write_bytes(data)
        return url, f"ok {len(data)}"
    except Exception as exc:  # noqa: BLE001
        return url, f"FAILED {exc}"


def main() -> None:
    urls = collect()
    missing = sorted(url for url in urls if not (PUBLIC / url.lstrip("/")).exists())
    print(f"{len(urls)} referenced assets, {len(missing)} missing", flush=True)
    ok = failed = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
        for index, (url, status) in enumerate(pool.map(download, missing), start=1):
            if status.startswith("ok"):
                ok += 1
            elif status.startswith("FAILED"):
                failed += 1
                print(f"[{index}/{len(missing)}] {status} {url}", flush=True)
            if index % 25 == 0:
                print(f"progress {index}/{len(missing)} ok={ok} failed={failed}", flush=True)
    print(f"done ok={ok} failed={failed}", flush=True)


if __name__ == "__main__":
    main()
