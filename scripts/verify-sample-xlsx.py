"""Verify the sample xlsx matches what src/lib/bulk-transfer/parse.ts expects."""
from __future__ import annotations

import re
import sys
import zipfile
from pathlib import Path

SAMPLE = Path(__file__).resolve().parents[1] / "public" / "sample-bulk-transfer.xlsx"


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    with zipfile.ZipFile(SAMPLE) as zf:
        names = zf.namelist()
        assert "xl/worksheets/sheet1.xml" in names, names
        sheet = zf.read("xl/worksheets/sheet1.xml").decode("utf-8")
        has_shared = "xl/sharedStrings.xml" in names
        print(f"has_sharedStrings={has_shared}")
        print(f"sheet_has_inlineStr={'inlineStr' in sheet}")
        print(f"sheet_has_shared_ref={'t=\"s\"' in sheet}")

        rows = re.findall(r"<row[\s\S]*?</row>", sheet)
        print(f"row_count={len(rows)}")

        cell_types = re.findall(r'<c[^>]*t="([^"]+)"', sheet)
        from collections import Counter

        print(f"cell_types={dict(Counter(cell_types))}")

        # Show first data row cell snippets
        if rows:
            cells = re.findall(r"<c[\s\S]*?(?:/>|</c>)", rows[min(1, len(rows) - 1)])
            print(f"row2_cell_count={len(cells)}")
            for c in cells[:6]:
                print("cell:", c[:200])

    print("verification=ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
