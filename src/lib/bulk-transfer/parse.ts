export type BulkTransferRow = {
  id: string;
  name: string;
  destination: string;
  amountRial: number;
};

export type ParsedBulkFile =
  | { ok: true; rows: BulkTransferRow[] }
  | { ok: false; error: string };

function toAsciiDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value: string) {
  return value
    .replace(/^﻿/, "")
    .replace(/[\s_\-]/g, "")
    .toLowerCase();
}

function matchColumn(header: string, keys: string[]) {
  const normalized = normalizeHeader(header);
  return keys.some((key) => normalized.includes(normalizeHeader(key)));
}

function parseAmountRial(raw: string) {
  const normalized = toAsciiDigits(raw)
    .replace(/[,\s٬]/g, "")
    .replace(/[^\d.]/g, "");

  if (!normalized) return null;

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return Math.floor(amount);
}

function normalizeDestination(raw: string) {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}

function buildRows(records: Record<string, string>[]): ParsedBulkFile {
  const rows: BulkTransferRow[] = [];
  const errors: string[] = [];

  records.forEach((record, index) => {
    const rowNumber = index + 1;
    const name = (record.name ?? "").trim();
    const destination = normalizeDestination(record.destination ?? "");
    const amountRial = parseAmountRial(record.amount ?? "");

    if (!name) {
      errors.push(`ردیف ${rowNumber}: نام و نام خانوادگی خالی است`);
    }
    if (!destination) {
      errors.push(`ردیف ${rowNumber}: شماره مقصد خالی است`);
    }
    if (amountRial === null) {
      errors.push(`ردیف ${rowNumber}: مبلغ به ریال معتبر نیست`);
    }

    if (name && destination && amountRial !== null) {
      rows.push({
        id: `row-${rowNumber}-${destination.slice(-6)}`,
        name,
        destination,
        amountRial,
      });
    }
  });

  if (rows.length === 0) {
    return {
      ok: false,
      error: errors[0] ?? "هیچ ردیف معتبری در فایل یافت نشد",
    };
  }

  return { ok: true, rows };
}

export function parseBulkCsv(text: string): ParsedBulkFile {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      ok: false,
      error: "فایل CSV باید شامل هدر و حداقل یک ردیف انتقال باشد",
    };
  }

  const headers = parseCsvLine(lines[0]);
  const nameIndex = headers.findIndex((header) =>
    matchColumn(header, ["نام و نام خانوادگی", "نام", "name"])
  );
  const destinationIndex = headers.findIndex((header) =>
    matchColumn(header, [
      "شماره مقصد",
      "شماره شبا",
      "شماره کارت",
      "شماره حساب",
      "destination",
      "iban",
      "card",
    ])
  );
  const amountIndex = headers.findIndex((header) =>
    matchColumn(header, ["مبلغ به ریال", "مبلغ", "amount", "rial"])
  );

  if (nameIndex === -1 || destinationIndex === -1 || amountIndex === -1) {
    return {
      ok: false,
      error:
        "ستون‌های ضروری یافت نشد. ستون‌های مورد انتظار: نام و نام خانوادگی، شماره مقصد، مبلغ به ریال",
    };
  }

  const records = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return {
      name: cells[nameIndex] ?? "",
      destination: cells[destinationIndex] ?? "",
      amount: cells[amountIndex] ?? "",
    };
  });

  return buildRows(records);
}

function xmlUnescape(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&");
}

function decodeSharedStrings(xml: string) {
  const strings: string[] = [];
  const items = xml.split(/<si[\s>]/).slice(1);

  for (const item of items) {
    const end = item.indexOf("</si>");
    const chunk = end >= 0 ? item.slice(0, end) : item;
    const texts = [...chunk.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) =>
      xmlUnescape(match[1])
    );
    strings.push(texts.join(""));
  }

  return strings;
}

function columnRefToIndex(ref: string) {
  const letters = ref.replace(/\d+/g, "");
  let index = 0;
  for (let i = 0; i < letters.length; i += 1) {
    index = index * 26 + (letters.charCodeAt(i) - 64);
  }
  return index - 1;
}

function parseSheetXml(xml: string, sharedStrings: string[]) {
  const rows: string[][] = [];
  const rowMatches = xml.match(/<row[\s\S]*?<\/row>/g) ?? [];

  for (const rowXml of rowMatches) {
    const cells: string[] = [];
    const cellMatches = rowXml.match(/<c[\s\S]*?(?:\/>|<\/c>)/g) ?? [];

    for (const cellXml of cellMatches) {
      const refMatch = cellXml.match(/r="([A-Z]+\d+)"/);
      const typeMatch = cellXml.match(/t="([^"]+)"/);
      const colIndex = refMatch ? columnRefToIndex(refMatch[1]) : cells.length;
      const type = typeMatch?.[1];

      if (type === "inlineStr") {
        const texts = [...cellXml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(
          (match) => xmlUnescape(match[1])
        );
        cells[colIndex] = texts.join("");
        continue;
      }

      const valueMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/);
      const rawValue = valueMatch ? xmlUnescape(valueMatch[1]) : "";

      if (type === "s") {
        cells[colIndex] = sharedStrings[Number(rawValue)] ?? "";
      } else {
        cells[colIndex] = rawValue;
      }
    }

    if (cells.some((cell) => cell !== undefined && cell !== "")) {
      rows.push(cells.map((cell) => cell ?? ""));
    }
  }

  return rows;
}

async function readZipEntry(bytes: Uint8Array, entryName: string) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= 0; i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error("فایل Excel معتبر نیست");
  }

  const entryCount = view.getUint16(eocdOffset + 10, true);
  let offset = view.getUint32(eocdOffset + 16, true);
  let target: { method: number; compressedSize: number; dataStart: number } | null =
    null;

  for (let i = 0; i < entryCount; i += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;

    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const nameStart = offset + 46;
    const name = new TextDecoder().decode(
      bytes.subarray(nameStart, nameStart + nameLength)
    );

    if (name === entryName) {
      const localNameLength = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
      target = {
        method,
        compressedSize,
        dataStart: localHeaderOffset + 30 + localNameLength + localExtraLength,
      };
      break;
    }

    offset = nameStart + nameLength + extraLength + commentLength;
  }

  if (!target) {
    throw new Error(`بخش ${entryName} در فایل Excel پیدا نشد`);
  }

  const data = bytes.slice(
    target.dataStart,
    target.dataStart + target.compressedSize
  );

  if (target.method === 0) {
    return new TextDecoder().decode(data);
  }

  if (target.method !== 8) {
    throw new Error("روش فشرده‌سازی فایل Excel پشتیبانی نمی‌شود");
  }

  if (typeof DecompressionStream === "undefined") {
    throw new Error("مرورگر شما از خواندن فایل Excel پشتیبانی نمی‌کند");
  }

  const stream = new DecompressionStream("deflate-raw");
  const writer = stream.writable.getWriter();
  await writer.write(data);
  await writer.close();
  const buffer = await new Response(stream.readable).arrayBuffer();
  return new TextDecoder().decode(buffer);
}

async function extractSheetCsv(arrayBuffer: ArrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const sharedStringsXml = await readZipEntry(bytes, "xl/sharedStrings.xml").catch(
    () => ""
  );
  const sheetXml = await readZipEntry(bytes, "xl/worksheets/sheet1.xml");
  const sharedStrings = sharedStringsXml
    ? decodeSharedStrings(sharedStringsXml)
    : [];
  const rows = parseSheetXml(sheetXml, sharedStrings);

  if (rows.length === 0) {
    throw new Error("فایل Excel خالی است");
  }

  const escape = (value: string) =>
    /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

  return rows.map((row) => row.map(escape).join(",")).join("\n");
}

export async function parseBulkExcel(arrayBuffer: ArrayBuffer): Promise<ParsedBulkFile> {
  try {
    const text = await extractSheetCsv(arrayBuffer);
    return parseBulkCsv(text);
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? `خواندن فایل Excel ناموفق بود: ${error.message}`
          : "خواندن فایل Excel ناموفق بود",
    };
  }
}
