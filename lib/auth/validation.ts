import { z } from "zod";

function isAdult(dateValue: string) {
  const birthDate = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return false;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayHasPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!birthdayHasPassed) age -= 1;
  return age >= 18;
}

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must contain at least 8 characters."),
});

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required.").max(80),
    lastName: z.string().trim().min(1, "Last name is required.").max(80),
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Password must contain at least 8 characters."),
    confirmPassword: z.string(),
    dateOfBirth: z.string().refine(isAdult, "You must be at least 18 years old to join SINNER."),
    adultConfirmation: z.literal("on", { message: "You must confirm that you are at least 18." }),
    legalAcceptance: z.literal("on", { message: "You must accept the Terms and Privacy Policy." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const emailSchema = z.object({ email: z.email("Enter a valid email address.") });

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must contain at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  displayName: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(500).optional(),
});

export function firstValidationError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please review the form.";
}

