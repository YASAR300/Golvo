import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSubscriptionStatus, requireActiveSubscription } from "@/lib/subscription";
import { POST as webhookHandler } from "@/app/api/stripe/webhook/route";
import { adminClient } from "@/lib/supabase/admin";
import * as serverClient from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";

describe("Subscription & Billing Logic", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getSubscriptionStatus()", () => {
    it("returns isActive: false when user has no subscription", async () => {
      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "subscriptions" || table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    maybeSingle: async () => ({ data: null, error: null }),
                  }),
                }),
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await getSubscriptionStatus("user-none");
      expect(res.isActive).toBe(false);
      expect(res.subscription).toBeNull();
    });

    it("returns isActive: true when subscription is active and period is valid", async () => {
      const futurePeriodEnd = new Date(Date.now() + 30 * 86400000).toISOString();
      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "subscriptions") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    maybeSingle: async () => ({
                      data: {
                        id: "sub-1",
                        user_id: "user-1",
                        status: "active",
                        plan: "yearly",
                        current_period_end: futurePeriodEnd,
                        cancel_at_period_end: false,
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await getSubscriptionStatus("user-1");
      expect(res.isActive).toBe(true);
      expect(res.plan).toBe("yearly");
      expect(res.currentPeriodEnd).toBe(futurePeriodEnd);
    });

    it("returns isActive: false when current_period_end has expired", async () => {
      const pastPeriodEnd = new Date(Date.now() - 5 * 86400000).toISOString();
      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "subscriptions") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    maybeSingle: async () => ({
                      data: {
                        id: "sub-expired",
                        user_id: "user-2",
                        status: "active",
                        current_period_end: pastPeriodEnd,
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await getSubscriptionStatus("user-2");
      expect(res.isActive).toBe(false);
    });

    it("returns isActive: false for past_due, canceled, and lapsed subscriptions", async () => {
      for (const status of ["past_due", "canceled", "lapsed"]) {
        vi.spyOn(adminClient, "from").mockImplementation((table) => {
          if (table === "subscriptions" || table === "profiles") {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    order: () => ({
                      maybeSingle: async () => ({
                        data: { id: `sub-${status}`, status, current_period_end: null },
                        error: null,
                      }),
                    }),
                  }),
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            };
          }
          return {};
        });

        const res = await getSubscriptionStatus(`user-${status}`);
        expect(res.isActive).toBe(false);
      }
    });

    it("returns isActive: false when userId is null or empty", async () => {
      const res = await getSubscriptionStatus(null);
      expect(res.isActive).toBe(false);
      expect(res.subscription).toBeNull();
    });

    it("falls back to Stripe customer subscription list when DB has no active record", async () => {
      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "subscriptions") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    maybeSingle: async () => ({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { email: "fallback@example.com", stripe_customer_id: "cus_fallback_123" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      vi.spyOn(stripe.customers, "list").mockResolvedValue({ data: [] });
      vi.spyOn(stripe.subscriptions, "list").mockResolvedValue({
        data: [
          {
            id: "sub_from_stripe_1",
            status: "active",
            current_period_end: Math.floor(Date.now() / 1000) + 86400,
            cancel_at_period_end: false,
            items: {
              data: [{ price: { recurring: { interval: "year" } } }],
            },
          },
        ],
      });

      const res = await getSubscriptionStatus("user-stripe-fallback");
      expect(res.isActive).toBe(true);
      expect(res.plan).toBe("yearly");
      expect(res.subscription.stripe_subscription_id).toBe("sub_from_stripe_1");
    });
  });

  describe("requireActiveSubscription()", () => {
    it("returns authorized: false with login redirect for unauthenticated visitors", async () => {
      vi.spyOn(serverClient, "createClient").mockResolvedValue({
        auth: {
          getUser: async () => ({ data: { user: null }, error: new Error("Not logged in") }),
        },
      });

      const res = await requireActiveSubscription();
      expect(res.authorized).toBe(false);
      expect(res.redirectUrl).toBe("/login");
    });

    it("grants full access to admins regardless of subscription state", async () => {
      vi.spyOn(serverClient, "createClient").mockResolvedValue({
        auth: {
          getUser: async () => ({
            data: { user: { id: "admin-1", email: "admin@golvo.com" } },
            error: null,
          }),
        },
        from: (table) => {
          if (table === "profiles") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { role: "admin" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        },
      });

      const res = await requireActiveSubscription();
      expect(res.authorized).toBe(true);
      expect(res.role).toBe("admin");
      expect(res.plan).toBe("admin");
    });

    it("grants access to authorized active subscribers", async () => {
      const futurePeriodEnd = new Date(Date.now() + 10 * 86400000).toISOString();
      vi.spyOn(serverClient, "createClient").mockResolvedValue({
        auth: {
          getUser: async () => ({
            data: { user: { id: "sub-user-active", email: "subscriber@golvo.com" } },
            error: null,
          }),
        },
        from: (table) => {
          if (table === "profiles") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { role: "subscriber" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        },
      });

      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "subscriptions") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  order: () => ({
                    maybeSingle: async () => ({
                      data: {
                        id: "sub-act-1",
                        user_id: "sub-user-active",
                        status: "active",
                        plan: "monthly",
                        current_period_end: futurePeriodEnd,
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await requireActiveSubscription();
      expect(res.authorized).toBe(true);
      expect(res.role).toBe("subscriber");
      expect(res.isActive).toBe(true);
      expect(res.plan).toBe("monthly");
    });
  });

  describe("Stripe Webhook Handler", () => {
    it("returns 400 when Stripe signature verification fails", async () => {
      vi.spyOn(stripe.webhooks, "constructEvent").mockImplementation(() => {
        throw new Error("Invalid signature verification failed");
      });

      const req = new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "bad_sig" },
        body: JSON.stringify({ type: "customer.subscription.updated" }),
      });

      const res = await webhookHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Webhook Error");
    });

    it("processes customer.subscription.deleted by setting status to canceled", async () => {
      vi.spyOn(stripe.webhooks, "constructEvent").mockReturnValue({
        type: "customer.subscription.deleted",
        data: {
          object: { id: "sub_canceled_123" },
        },
      });

      let updatedPayload = null;
      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "subscriptions") {
          return {
            update: (payload) => {
              updatedPayload = payload;
              return {
                eq: () => Promise.resolve({ error: null }),
              };
            },
          };
        }
        return {};
      });

      const req = new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "valid_sig" },
        body: JSON.stringify({ type: "customer.subscription.deleted" }),
      });

      const res = await webhookHandler(req);
      expect(res.status).toBe(200);
      expect(updatedPayload.status).toBe("canceled");
    });

    it("processes invoice.payment_failed by setting status to past_due", async () => {
      vi.spyOn(stripe.webhooks, "constructEvent").mockReturnValue({
        type: "invoice.payment_failed",
        data: {
          object: { subscription: "sub_failed_123" },
        },
      });

      let updatedPayload = null;
      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "subscriptions") {
          return {
            update: (payload) => {
              updatedPayload = payload;
              return {
                eq: () => Promise.resolve({ error: null }),
              };
            },
          };
        }
        return {};
      });

      const req = new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "valid_sig" },
        body: JSON.stringify({ type: "invoice.payment_failed" }),
      });

      const res = await webhookHandler(req);
      expect(res.status).toBe(200);
      expect(updatedPayload.status).toBe("past_due");
    });

    it("handles invoice.paid with correct charity percentage (10% and 25%) and updates prize pool", async () => {
      // Test 10% on $9.99 (999 cents) -> $1.00 (100 cents)
      const testCases = [
        { percent: 10, amountPaid: 999, expectedDonation: 100 },
        { percent: 25, amountPaid: 999, expectedDonation: 250 },
      ];

      for (const tc of testCases) {
        vi.spyOn(stripe.webhooks, "constructEvent").mockReturnValue({
          type: "invoice.paid",
          data: {
            object: {
              id: `in_test_${tc.percent}`,
              customer: "cus_test_123",
              amount_paid: tc.amountPaid,
              payment_intent: `pi_test_${tc.percent}`,
            },
          },
        });

        let insertedDonation = null;
        vi.spyOn(adminClient, "from").mockImplementation((table) => {
          if (table === "profiles") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: {
                      id: "user-123",
                      charity_id: "charity-yoc",
                      charity_percent: tc.percent,
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "donations") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }), // not already recorded
                }),
              }),
              insert: async (d) => {
                insertedDonation = d;
                return { error: null };
              },
            };
          }
          if (table === "draws") {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { id: "draw-1", prize_pool_cents: 5000 },
                    error: null,
                  }),
                }),
              }),
              update: () => ({
                eq: () => Promise.resolve({ error: null }),
              }),
            };
          }
          return {};
        });

        const req = new Request("http://localhost/api/stripe/webhook", {
          method: "POST",
          headers: { "stripe-signature": "valid_sig" },
          body: JSON.stringify({ type: "invoice.paid" }),
        });

        const res = await webhookHandler(req);
        expect(res.status).toBe(200);
        expect(insertedDonation).not.toBeNull();
        expect(insertedDonation.amount_cents).toBe(tc.expectedDonation);
        expect(insertedDonation.charity_id).toBe("charity-yoc");
      }
    });

    it("guarantees idempotency: processing invoice.paid twice does not create duplicate donations", async () => {
      vi.spyOn(stripe.webhooks, "constructEvent").mockReturnValue({
        type: "invoice.paid",
        data: {
          object: {
            id: "in_idempotent_123",
            customer: "cus_test_123",
            amount_paid: 999,
            payment_intent: "pi_idempotent_123",
          },
        },
      });

      let insertCallCount = 0;
      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "profiles") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "user-123",
                    charity_id: "charity-yoc",
                    charity_percent: 10,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
          if (table === "donations") {
            return {
              select: () => ({
                eq: () => ({
                  // Simulates donation already recorded on second webhook attempt
                  maybeSingle: async () => ({
                    data: { id: "existing-donation-123" },
                    error: null,
                  }),
                }),
              }),
              insert: async () => {
                insertCallCount++;
                return { error: null };
              },
            };
          }
          return {};
        });

        const req = new Request("http://localhost/api/stripe/webhook", {
          method: "POST",
          headers: { "stripe-signature": "valid_sig" },
          body: JSON.stringify({ type: "invoice.paid" }),
        });

        const res = await webhookHandler(req);
        expect(res.status).toBe(200);
        // Because existingDonation was returned, insert must NOT be called
        expect(insertCallCount).toBe(0);
    });
  });
});
