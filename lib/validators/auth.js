import { z } from "zod";

/**
 * Validation schema for user login
 */
export const loginSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

/**
 * Validation schema for user registration
 */
export const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Full name must be at least 2 characters" })
    .max(80, { message: "Full name must be under 80 characters" }),
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  charityId: z
    .string()
    .min(1, { message: "Please select a partner charity for your subscription" }),
});

/**
 * Validation schema for password recovery request
 */
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
});

/**
 * Validation schema for setting a new password
 */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "New password must be at least 8 characters" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
