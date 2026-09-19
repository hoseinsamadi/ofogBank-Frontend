import { z } from "zod";

const NATIONAL_ID_PATTERN = /^\d{10}$/;

export const loginSchema = z.object({
  nationalId: z
    .string()
    .min(1, "کد ملی را وارد کنید")
    .regex(NATIONAL_ID_PATTERN, "کد ملی باید ۱۰ رقم باشد"),
  password: z
    .string()
    .min(1, "رمز عبور را وارد کنید")
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
