import { z } from "zod";

const normalizeDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

export const loginSchema = z.object({
  nationalId: z
    .string()
    .min(1, "کد ملی را وارد کنید")
    .transform((value) => normalizeDigits(value.trim()))
    .refine((value) => /^\d{10}$/.test(value), "کد ملی باید ۱۰ رقم باشد"),
  password: z
    .string()
    .min(1, "رمز عبور را وارد کنید")
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
