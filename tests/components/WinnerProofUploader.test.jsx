import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import toast from "react-hot-toast";
import WinningsPage from "@/app/(dashboard)/winnings/page";

describe("Winner Proof Uploader Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows an error toast when selecting an invalid file type (e.g. PDF)", async () => {
    const mockWinnings = [
      {
        id: "w-1",
        tier: "match4",
        prize_cents: 25000,
        verification_status: "pending_proof",
        payment_status: "pending",
        draw: { month: "2026-09" },
      },
    ];

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/winners") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ winnings: mockWinnings }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<WinningsPage />);

    // Wait for winner card to load
    await waitFor(() => {
      expect(screen.getByText(/Proof Required/i)).toBeInTheDocument();
    });

    // Find the file input
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();

    // Select an invalid file (PDF)
    const invalidFile = new File(["dummy pdf content"], "scorecard.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    // Toast error should have been displayed
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("PNG, JPG, or WEBP")
    );
  });
});
