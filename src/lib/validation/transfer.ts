import { z } from "zod";

const CARD_PATTERN = /^\d{16}$/;
const IBAN_PATTERN = /^IR\d{24}$/i;

export const transferSchema = z.object({
  destination: z
    .string()
    .min(1, "شماره کارت یا شماره شبا را وارد کنید")
    .transform((value) => value.replace(/[\s-]/g, ""))
    .refine((value) => CARD_PATTERN.test(value) || IBAN_PATTERN.test(value), {
      message: "شماره کارت (۱۶ رقم) یا شماره شبا (IR + ۲۴ رقم) معتبر وارد کنید",
    }),
  amount: z
    .string()
    .min(1, "مبلغ را وارد کنید")
    .regex(/^\d+$/, "مبلغ باید فقط عدد باشد")
    .refine((value) => Number(value) > 0, "مبلغ باید بیشتر از صفر باشد"),
  description: z.string().optional(),
});

export type TransferFormValues = z.infer<typeof transferSchema>;
