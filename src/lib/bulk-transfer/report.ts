export type BulkTransferReport = {
  id: string;
  generatedAt: string;
  fileName: string | null;
  totalCount: number;
  validCount: number;
  invalidCount: number;
  validTotalRial: number;
  invalidTotalRial: number;
};

const STORAGE_KEY = "ofogbank_bulk_transfer_report";
const CHANGE_EVENT = "ofogbank-bulk-transfer-report-change";

let cachedReport: BulkTransferReport | null | undefined;

function readStoredReport(): BulkTransferReport | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BulkTransferReport;
    if (typeof parsed?.totalCount !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function subscribeToBulkTransferReport(onStoreChange: () => void) {
  const handleChange = () => {
    cachedReport = undefined;
    onStoreChange();
  };

  window.addEventListener("storage", handleChange);
  window.addEventListener(CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(CHANGE_EVENT, handleChange);
  };
}

export function getStoredBulkTransferReport(): BulkTransferReport | null {
  if (cachedReport === undefined) {
    cachedReport = readStoredReport();
  }
  return cachedReport;
}

export function saveBulkTransferReport(report: BulkTransferReport) {
  cachedReport = report;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(report));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearBulkTransferReport() {
  cachedReport = null;
  sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
