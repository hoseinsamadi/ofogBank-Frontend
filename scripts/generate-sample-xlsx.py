"""Generate a sample .xlsx for bulk-transfer upload.

Header must be on row 1 because src/lib/bulk-transfer/parse.ts treats the
first non-empty sheet row as column headers.
"""
from __future__ import annotations

import sys
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.comments import Comment

OUTPUT = Path(__file__).resolve().parents[1] / "public" / "sample-bulk-transfer.xlsx"


def main() -> int:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "انتقال تجمیعی"
    ws.sheet_view.rightToLeft = True

    headers = ["نام و نام خانوادگی", "شماره مقصد", "مبلغ به ریال"]
    # Row 1 = headers (required by the app parser)
    data = [
        ["علی رضایی", "6037997512345678", 12500000],
        ["مریم احمدی", "IR620570028180010203040506", 8700000],
        ["رضا محمدی", "5892101234567890", 35000000],  # not in mock bank
        ["سارا کریمی", "IR120170000000123456789012", 4200000],
        ["حسین کریمی", "6219861012345678", 15200000],
        ["نگار موسوی", "IR999900000000000000000000", 6700000],  # not in mock bank
    ]

    header_fill = PatternFill(start_color="0B1F3A", end_color="0B1F3A", fill_type="solid")
    header_font = Font(name="Vazirmatn", color="FFFFFF", bold=True, size=11)
    body_font = Font(name="Vazirmatn", size=11, color="101828")
    thin = Side(style="thin", color="E2E5EB")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    center = Alignment(horizontal="center", vertical="center")

    ws.row_dimensions[1].height = 26
    for col, header in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center
        cell.border = border

    for row_index, row in enumerate(data, start=2):
        ws.row_dimensions[row_index].height = 22
        for col_index, value in enumerate(row, start=1):
            cell = ws.cell(row=row_index, column=col_index, value=value)
            cell.font = body_font
            cell.alignment = center
            cell.border = border
            if col_index == 2:
                cell.number_format = "@"
            elif col_index == 3:
                cell.number_format = "#,##0"

    ws.column_dimensions["A"].width = 22
    ws.column_dimensions["B"].width = 32
    ws.column_dimensions["C"].width = 18
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = "A1:C1"

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUTPUT)

    # Verify the written workbook
    check = openpyxl.load_workbook(OUTPUT)
    sheet = check.active
    rows = list(sheet.iter_rows(min_row=1, max_row=sheet.max_row, values_only=True))
    assert rows[0] == tuple(headers), rows[0]
    assert len(rows) == len(data) + 1
    print(f"saved={OUTPUT}")
    print(f"rows={len(rows)} cols={len(headers)}")
    print(f"header_ascii_ok=True")
    print(f"data_count={len(data)}")
    return 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    raise SystemExit(main())
