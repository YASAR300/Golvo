import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScoreManager } from "@/components/dashboard/ScoreManager";

describe("<ScoreManager /> Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders 5 slots with dashed placeholders for empty ones and displays empty state when 0 scores exist", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/scores") {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => ({ scores: [] }),
        });
      }
      return Promise.reject(new Error("Unhandled fetch"));
    });

    render(<ScoreManager />);

    // Wait for scores to finish loading
    await waitFor(() => {
      expect(screen.getByText(/No rounds recorded yet/i)).toBeInTheDocument();
    });

    // Verify 5 slots are rendered
    expect(screen.getByText("Slot 1")).toBeInTheDocument();
    expect(screen.getByText("Slot 2")).toBeInTheDocument();
    expect(screen.getByText("Slot 3")).toBeInTheDocument();
    expect(screen.getByText("Slot 4")).toBeInTheDocument();
    expect(screen.getByText("Slot 5")).toBeInTheDocument();

    // Verify empty indicators
    const emptyIndicators = screen.getAllByText("Empty");
    expect(emptyIndicators).toHaveLength(5);
  });

  it("shows validation error when attempting to enter a score of 46", async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/scores") {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => ({ scores: [] }),
        });
      }
      return Promise.reject(new Error("Unhandled fetch"));
    });

    const user = userEvent.setup();
    render(<ScoreManager />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Record Score/i })).toBeInTheDocument();
    });

    // Score input default is 36, change to 46
    const scoreInput = screen.getByLabelText(/Points/i);
    await user.clear(scoreInput);
    await user.type(scoreInput, "46");

    const form = scoreInput.closest("form");
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.submit(form);

    expect(await screen.findByText(/Score must be between 1 and 45 points/i)).toBeInTheDocument();
  });

  it("shows duplicate-date error when entering a score on an existing date", async () => {
    const existingDate = "2026-09-10";
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === "/api/scores") {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => ({
            scores: [
              { id: "s-1", score: 38, played_on: existingDate, created_at: "2026-09-10T10:00:00Z" },
            ],
          }),
        });
      }
      return Promise.reject(new Error("Unhandled fetch"));
    });

    const user = userEvent.setup();
    render(<ScoreManager />);

    await waitFor(() => {
      expect(screen.getByText(/38 Stableford Points/i)).toBeInTheDocument();
    });

    // Set date input to existingDate
    const dateInput = screen.getByLabelText(/Played On/i);
    await user.clear(dateInput);
    await user.type(dateInput, existingDate);

    const submitButton = screen.getByRole("button", { name: /Record Score/i });
    await user.click(submitButton);

    expect(await screen.findByText(new RegExp(`A round is already recorded for ${existingDate}`, "i"))).toBeInTheDocument();
  });

  it("successfully adds a score and updates slot list", async () => {
    const initialScores = [];
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url === "/api/scores" && !opts) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => ({ scores: initialScores }),
        });
      }
      if (url === "/api/scores" && opts?.method === "POST") {
        return Promise.resolve({
          status: 201,
          ok: true,
          json: async () => ({
            success: true,
            score: { id: "s-new", score: 36, played_on: "2026-09-15" },
            scores: [{ id: "s-new", score: 36, played_on: "2026-09-15" }],
          }),
        });
      }
      return Promise.reject(new Error("Unhandled fetch"));
    });

    const user = userEvent.setup();
    render(<ScoreManager />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Record Score/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /Record Score/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/36 Stableford Points/i)).toBeInTheDocument();
    });
  });

  it("deletes a score when delete button is confirmed", async () => {
    const scores = [{ id: "s-del", score: 35, played_on: "2026-09-12" }];
    vi.spyOn(window, "confirm").mockReturnValue(true);

    let deleteCalled = false;
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url === "/api/scores" && !opts) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => ({ scores }),
        });
      }
      if (url === "/api/scores/s-del" && opts?.method === "DELETE") {
        deleteCalled = true;
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => ({ success: true }),
        });
      }
      return Promise.reject(new Error("Unhandled fetch"));
    });

    const user = userEvent.setup();
    render(<ScoreManager />);

    await waitFor(() => {
      expect(screen.getByText(/35 Stableford Points/i)).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle(/Delete round/i);
    await user.click(deleteBtn);

    expect(deleteCalled).toBe(true);
    await waitFor(() => {
      expect(screen.queryByText(/35 Stableford Points/i)).not.toBeInTheDocument();
    });
  });
});
