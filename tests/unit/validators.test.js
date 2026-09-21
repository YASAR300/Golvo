import { describe, it, expect } from "vitest";
import { scoreSchema, getTodayDateString } from "@/lib/validators/score";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validators/auth";
import { charityPercentSchema, validateCharityPercent } from "@/lib/validators/charity";

describe("Validators — Score Schema", () => {
  const today = getTodayDateString();

  it("accepts valid boundary scores (1 and 45) with today's date", () => {
    const minRes = scoreSchema.safeParse({ score: 1, playedOn: today });
    expect(minRes.success).toBe(true);

    const maxRes = scoreSchema.safeParse({ score: 45, playedOn: today });
    expect(maxRes.success).toBe(true);
  });

  it("rejects score < 1, > 45, negative numbers, and decimals", () => {
    expect(scoreSchema.safeParse({ score: 0, playedOn: today }).success).toBe(false);
    expect(scoreSchema.safeParse({ score: 46, playedOn: today }).success).toBe(false);
    expect(scoreSchema.safeParse({ score: -1, playedOn: today }).success).toBe(false);
    expect(scoreSchema.safeParse({ score: 36.5, playedOn: today }).success).toBe(false);
    expect(scoreSchema.safeParse({ score: "not-a-number", playedOn: today }).success).toBe(false);
  });

  it("rejects future dates", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const d = String(tomorrow.getDate()).padStart(2, "0");
    const tomorrowStr = `${y}-${m}-${d}`;

    const res = scoreSchema.safeParse({ score: 36, playedOn: tomorrowStr });
    expect(res.success).toBe(false);
    expect(res.error?.issues[0].message).toContain("future");
  });
});

describe("Validators — Auth Schemas", () => {
  it("rejects invalid email and missing password on login", () => {
    expect(loginSchema.safeParse({ email: "invalid-email", password: "123" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "user@test.com", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "user@test.com", password: "password123" }).success).toBe(true);
  });

  it("rejects missing name, invalid email, or weak password on signup", () => {
    // Missing name
    expect(
      signupSchema.safeParse({
        fullName: "",
        email: "user@test.com",
        password: "ValidPassword1",
        charityId: "charity-1",
      }).success
    ).toBe(false);

    // Weak password (< 8 chars or no number)
    expect(
      signupSchema.safeParse({
        fullName: "Tiger Woods",
        email: "tiger@test.com",
        password: "short1",
        charityId: "charity-1",
      }).success
    ).toBe(false);

    expect(
      signupSchema.safeParse({
        fullName: "Tiger Woods",
        email: "tiger@test.com",
        password: "passwordwithoutnumber",
        charityId: "charity-1",
      }).success
    ).toBe(false);

    // Valid signup
    expect(
      signupSchema.safeParse({
        fullName: "Tiger Woods",
        email: "tiger@test.com",
        password: "ValidPass123",
        charityId: "charity-1",
      }).success
    ).toBe(true);
  });

  it("rejects non-matching passwords on password reset", () => {
    const mismatch = resetPasswordSchema.safeParse({
      password: "NewPassword1",
      confirmPassword: "DifferentPassword2",
    });
    expect(mismatch.success).toBe(false);

    const match = resetPasswordSchema.safeParse({
      password: "NewPassword1",
      confirmPassword: "NewPassword1",
    });
    expect(match.success).toBe(true);
  });
});

describe("Validators — Charity Percentage Schema", () => {
  it("accepts boundary values of 10% and 100%", () => {
    expect(charityPercentSchema.safeParse(10).success).toBe(true);
    expect(charityPercentSchema.safeParse(100).success).toBe(true);
    expect(validateCharityPercent(50).success).toBe(true);
  });

  it("rejects < 10% and > 100%", () => {
    expect(charityPercentSchema.safeParse(9).success).toBe(false);
    expect(charityPercentSchema.safeParse(0).success).toBe(false);
    expect(charityPercentSchema.safeParse(-5).success).toBe(false);
    expect(charityPercentSchema.safeParse(101).success).toBe(false);
    expect(charityPercentSchema.safeParse(250).success).toBe(false);
  });
});
