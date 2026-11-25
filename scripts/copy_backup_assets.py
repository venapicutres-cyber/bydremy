"""Copy assets referenced by the clone from the offline backup when possible.

`fetch_missing_assets.py` recovers assets from the live site, but a few files
were removed there while the backup still has them (or exposes them under a
different mirrored root).  This script only fills gaps in `public/`, so it
never overwrites downloaded or generated files.
"""
from __future__ import annotations

import pathlib
import re
import shutil
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
PAGES = ROOT / "src" / "content" / "pages"
CSS = PUBLIC / "site-css"
BACKUP = ROOT / "BYDREAMY_FULL_BACKUP"

URL_RE = re.compile(r"""(?:src|href|data-src|data-thumbnail)=["'](/wp-content/[^"']+)["']""")
CSS_URL_RE = re.compile(r"""url\((['"]?)(/wp-content/[^)'"]+)\1\)""")
IMAGE_SET_RE = re.compile(r"""(?:srcset|data-srcset)=["']([^"']+)["']""")
ROOTS = (BACKUP / "images", BACKUP / "images" / "bydreamy.com", BACKUP / "fonts", BACKUP / "fonts" / "bydreamy.com")

# A few WordPress uploads live in a different year/month folder in the mirror
# (the backup captured them after a re-organisation).  Falling back to a unique
# filename match restores the original picture without touching the markup.
_BY_NAME: dict[str, list[pathlib.Path]] | None = None


def by_name() -> dict[str, list[pathlib.Path]]:
    global _BY_NAME
    if _BY_NAME is None:
        _BY_NAME = {}
        for root in (BACKUP / "images", BACKUP / "images" / "bydreamy.com"):
            if not root.exists():
                continue
            for path in root.rglob("*"):
                if path.is_file() and path.stat().st_size > 0:
                    _BY_NAME.setdefault(path.name, []).append(path)
    return _BY_NAME


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


def main() -> None:
    copied = 0
    missing = []
    for url in sorted(collect()):
        target = PUBLIC / url.lstrip("/")
        if target.exists() and target.stat().st_size > 0:
            continue
        source = None
        for root in ROOTS:
            candidate = root / url.lstrip("/")
            if candidate.exists() and candidate.stat().st_size > 0:
                source = candidate
                break
        if not source:
            # Same filename, different upload folder.
            candidates = by_name().get(pathlib.PurePosixPath(url).name, [])
            if len(candidates) == 1:
                source = candidates[0]
        if not source:
            missing.append(url)
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        copied += 1
    print(f"copied {copied} files from backup, {len(missing)} still missing")
    for url in missing:
        print("missing", url)


if __name__ == "__main__":
    main()
