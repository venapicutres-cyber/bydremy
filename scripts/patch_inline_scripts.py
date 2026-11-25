"""Patch tiny defects in the extracted inline scripts.

The WordPress pages in the backup contain a few inline handlers that assume
markup which is not part of the exported HTML (for example the demo-only
`symbutton`).  They throw `Cannot read properties of null` in the clone and
abort the rest of their script block.  The fixes below keep the original
behaviour whenever the element exists and silently skip it otherwise.

The script is idempotent and only touches the derived files in
`src/content/pages`, never the original backup.
"""
from __future__ import annotations

import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / "src" / "content" / "pages"

# HTMLCollection has no addEventListener; fan the click handler out to every
# button wrapper like the original plugin does in the browser.
WRAPPER_RE = re.compile(
    r"""document\.getElementsByClassName\((["'])wdp-button-wrapper\1\)\.addEventListener\((["'])click\2, function\(\)\s*\{\s*toggleFullscreen\(\);\s*\}\);"""
)
WRAPPER_FIX = (
    'Array.prototype.forEach.call(document.getElementsByClassName("wdp-button-wrapper"), '
    "function (__el) {\n\t\t__el.addEventListener('click', function () { toggleFullscreen(); });\n\t});"
)

GALLERY_IDS = ("tombol-gallery-collapse", "tombol-gallery-all")

SYM_RE = re.compile(r"""symButton\.addEventListener\("click", function\(event\) \{""")
SYM_FIX = 'if (symButton) symButton.addEventListener("click", function(event) {'


def patch(text: str) -> str:
    text = WRAPPER_RE.sub(WRAPPER_FIX, text)
    for element_id in GALLERY_IDS:
        needle = f'document.getElementById("{element_id}").addEventListener("click", function () {{'
        if needle in text:
            text = text.replace(
                needle,
                f'var __btn = document.getElementById("{element_id}"); if (__btn) __btn.addEventListener("click", function () {{',
            )
    if 'var symButton = document.getElementById("symbutton");' in text:
        text = SYM_RE.sub(SYM_FIX, text)
    return text


def main() -> None:
    changed = 0
    for path in PAGES.glob("*.html"):
        original = path.read_text(encoding="utf-8")
        updated = patch(original)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            changed += 1
    print(f"patched {changed} page files")


if __name__ == "__main__":
    main()
