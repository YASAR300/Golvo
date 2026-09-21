import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";

// Load test environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key-00000000000000000000000000000000";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key-0000000000000000000000000";
process.env.STRIPE_SECRET_KEY = "sk_test_fake_key_123456789";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_fake_webhook_12345";
process.env.STRIPE_PRICE_MONTHLY = "price_test_monthly_123";
process.env.STRIPE_PRICE_YEARLY = "price_test_yearly_456";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn((url) => {
    const error = new Error(`NEXT_REDIRECT; replace; ${url}`);
    error.digest = `NEXT_REDIRECT; replace; ${url}`;
    throw error;
  }),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => []),
  }),
  headers: async () => new Headers(),
}));

// Mock framer-motion to render plain HTML tags without animation overhead
vi.mock("framer-motion", () => {
  const actual = vi.importActual("framer-motion");
  const componentHandler = {
    get: (_target, prop) => {
      return ({ children, ...props }) => React.createElement(prop, props, children);
    },
  };
  return {
    ...actual,
    motion: new Proxy({}, componentHandler),
    AnimatePresence: ({ children }) => children,
  };
});

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => "test-toast-id"),
    dismiss: vi.fn(),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => "test-toast-id"),
    dismiss: vi.fn(),
  },
}));
