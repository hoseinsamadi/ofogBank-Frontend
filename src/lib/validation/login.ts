import { z } from "zod";

const MOBILE_PATTERN = /^09\d{9}$/;

export const loginSchema = z.object({
  mobile: z
    .string()
    .min(1, "شماره موبایل را وارد کنید")
    .regex(MOBILE_PATTERN, "شماره موبایل معتبر نیست، مثل ۰۹۱۲۳۴۵۶۷۸۹"),
  password: z
    .string()
    .min(1, "رمز عبور را وارد کنید")
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
