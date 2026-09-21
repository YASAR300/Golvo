import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PricingPage from "@/app/pricing/page";
import { mockRouter } from "@/tests/setup";
import * as supabaseClient from "@/lib/supabase/client";

describe("<PricingPage /> Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRouter.push.mockReset();

    vi.spyOn(supabaseClient, "createClient").mockReturnValue({
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null }),
            }),
          }),
        }),
      }),
    });
  });

  it("toggles between monthly and annual billing with correct price displays", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/subscription/status") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ isSubscribed: false, subscription: null }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const user = userEvent.setup();
    render(<PricingPage />);

    // Check default annual billing selected ($7.99 / mo)
    expect(screen.getByText("$7.99")).toBeInTheDocument();
    expect(screen.getAllByText(/Save 20%/i)[0]).toBeInTheDocument();

    // Click Monthly billing button
    const monthlyToggle = screen.getByRole("button", { name: /Monthly billing/i });
    await user.click(monthlyToggle);

    // Monthly plan card is now active ($9.99 / mo)
    expect(screen.getByText("$9.99")).toBeInTheDocument();
  });

  it("redirects unauthenticated logged-out user to /login when clicking Subscribe", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/subscription/status") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ isSubscribed: false, subscription: null }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const user = userEvent.setup();
    render(<PricingPage />);

    // Click the subscribe button
    const subscribeBtn = screen.getByRole("button", { name: /Subscribe Annual/i });
    await user.click(subscribeBtn);

    // Verify redirection to /login?redirect=/pricing
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/login?redirect=/pricing");
    });
  });
});
