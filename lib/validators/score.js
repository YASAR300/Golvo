import { z } from "zod";

/**
 * Returns today's date in YYYY-MM-DD format (local date)
 */
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Validation schema for recording a new Stableford score
 */
export const scoreSchema = z.object({
  score: z
    .number({
      required_error: "Score is required",
      invalid_type_error: "Score must be a number",
    })
    .int({ message: "Score must be an integer" })
    .min(1, { message: "Stableford score must be at least 1 point" })
    .max(45, { message: "Stableford score cannot exceed 45 points" }),
  playedOn: z
    .string({
      required_error: "Played date is required",
      invalid_type_error: "Date must be a string in YYYY-MM-DD format",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format" })
    .refine(
      (val) => {
        const today = getTodayDateString();
        return val <= today;
      },
      { message: "Played date cannot be in the future" }
    ),
});

/**
 * Validation schema for updating an existing score
 */
export const updateScoreSchema = scoreSchema.partial();
