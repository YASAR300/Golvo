import { vi } from "vitest";

export function createMockStripe(overrides = {}) {
  return {
    customers: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      create: vi.fn().mockImplementation(async (params) => ({
        id: "cus_mock_test_123",
        email: params.email,
        name: params.name,
      })),
      ...overrides.customers,
    },
    subscriptions: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      retrieve: vi.fn().mockResolvedValue({
        id: "sub_mock_test_123",
        status: "active",
        items: {
          data: [{ price: { recurring: { interval: "year" } } }],
        },
        current_period_end: Math.floor(Date.now() / 1000) + 365 * 86400,
      }),
      cancel: vi.fn().mockResolvedValue({ id: "sub_mock_test_123", status: "canceled" }),
      ...overrides.subscriptions,
    },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: "cs_test_mock_session_123",
          url: "https://checkout.stripe.com/test-session",
        }),
        ...overrides.checkout?.sessions,
      },
      ...overrides.checkout,
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: "portal_mock_test_123",
          url: "https://billing.stripe.com/test-portal",
        }),
        ...overrides.billingPortal?.sessions,
      },
      ...overrides.billingPortal,
    },
    webhooks: {
      constructEvent: vi.fn().mockImplementation((payload, signature, secret) => {
        if (!signature || signature === "invalid_sig") {
          throw new Error("Invalid Stripe signature");
        }
        return typeof payload === "string" ? JSON.parse(payload) : payload;
      }),
      ...overrides.webhooks,
    },
    ...overrides,
  };
}

export const mockStripe = createMockStripe();
