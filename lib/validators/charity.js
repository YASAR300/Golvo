import { z } from "zod";

/**
 * Validation schema for charity contribution percentage (10% to 100%)
 */
export const charityPercentSchema = z
  .number({
    required_error: "Charity percentage is required",
    invalid_type_error: "Charity percentage must be a number",
  })
  .int({ message: "Charity percentage must be an integer" })
  .min(10, { message: "Charity contribution must be at least 10%" })
  .max(100, { message: "Charity contribution cannot exceed 100%" });

export function validateCharityPercent(percent) {
  return charityPercentSchema.safeParse(Number(percent));
}
