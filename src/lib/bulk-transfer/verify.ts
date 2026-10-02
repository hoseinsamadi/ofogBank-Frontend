import { checkBankAccount, type BankAccountStatus } from "@/lib/mock/bank";
import type { BulkTransferRow } from "@/lib/bulk-transfer/parse";

export type VerifiedTransfer = BulkTransferRow & {
  status: BankAccountStatus | "checking";
};

/**
 * بررسی شماره حساب هر ردیف در بانک (نسخه آزمایشی با شبیه‌سازی تأخیر).
 * نتیجه به‌صورت تدریجی برمی‌گردد تا UI «در حال بررسی» قابل نمایش باشد.
 */
export async function verifyBulkTransfers(
  rows: BulkTransferRow[],
  onProgress?: (results: VerifiedTransfer[]) => void
): Promise<VerifiedTransfer[]> {
  const results: VerifiedTransfer[] = [];

  for (const row of rows) {
    results.push({ ...row, status: "checking" });
  }
  onProgress?.([...results]);

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const status = await checkBankAccount(row.destination);
    results[index] = { ...row, status };
    onProgress?.([...results]);
  }

  return results;
}
