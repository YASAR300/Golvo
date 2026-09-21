import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/scores/route";
import { PATCH, DELETE } from "@/app/api/scores/[id]/route";
import * as serverClient from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import * as subscriptionLib from "@/lib/subscription";

describe("Score Business Logic — API Routes", () => {
  const mockUser = { id: "user-test-123", email: "golfer@test.com" };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/scores", () => {
    it("rejects unauthenticated requests with 401", async () => {
      vi.spyOn(subscriptionLib, "requireActiveSubscription").mockResolvedValue({
        authorized: false,
        user: null,
        error: "Authentication required",
      });

      const req = new Request("http://localhost/api/scores", {
        method: "POST",
        body: JSON.stringify({ score: 36, playedOn: "2026-09-15" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403); // requireActiveSubscription returns 403 when not authorized
    });

    it("rejects non-subscribers with 403", async () => {
      vi.spyOn(subscriptionLib, "requireActiveSubscription").mockResolvedValue({
        authorized: false,
        user: mockUser,
        error: "Active subscription required",
        redirectUrl: "/pricing",
      });

      const req = new Request("http://localhost/api/scores", {
        method: "POST",
        body: JSON.stringify({ score: 36, playedOn: "2026-09-15" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.redirectUrl).toBe("/pricing");
    });

    it("rejects duplicate dates with 409 Conflict", async () => {
      vi.spyOn(subscriptionLib, "requireActiveSubscription").mockResolvedValue({
        authorized: true,
        user: mockUser,
      });

      // Mock duplicate date query
      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "scores") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { id: "existing-score", score: 38, played_on: "2026-09-15" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const req = new Request("http://localhost/api/scores", {
        method: "POST",
        body: JSON.stringify({ score: 36, playedOn: "2026-09-15" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toContain("already been recorded");
    });

    it("successfully adds a score for an active subscriber", async () => {
      vi.spyOn(subscriptionLib, "requireActiveSubscription").mockResolvedValue({
        authorized: true,
        user: mockUser,
      });

      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "scores") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }), // No duplicate date
                }),
                order: () => ({
                  order: () => ({
                    limit: async () => ({
                      data: [{ id: "new-score-1", score: 36, played_on: "2026-09-15" }],
                    }),
                  }),
                }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: { id: "new-score-1", score: 36, played_on: "2026-09-15" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const req = new Request("http://localhost/api/scores", {
        method: "POST",
        body: JSON.stringify({ score: 36, playedOn: "2026-09-15" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.score.score).toBe(36);
    });

    it("enforces rolling 5 retention by pruning the OLDEST by played_on (not created_at)", async () => {
      vi.spyOn(subscriptionLib, "requireActiveSubscription").mockResolvedValue({
        authorized: true,
        user: mockUser,
      });

      let deletedIds = [];

      // 6 scores in out-of-order created_at dates
      // Notice: score-oldest has the oldest played_on ('2026-08-01'), even if created_at was recent
      const sixScoresSortedByPlayedOnDesc = [
        { id: "score-1", played_on: "2026-09-20", created_at: "2026-09-20T10:00:00Z" },
        { id: "score-2", played_on: "2026-09-18", created_at: "2026-09-18T10:00:00Z" },
        { id: "score-3", played_on: "2026-09-15", created_at: "2026-09-15T10:00:00Z" },
        { id: "score-4", played_on: "2026-09-10", created_at: "2026-09-10T10:00:00Z" },
        { id: "score-5", played_on: "2026-09-05", created_at: "2026-09-05T10:00:00Z" },
        { id: "score-oldest", played_on: "2026-08-01", created_at: "2026-09-21T10:00:00Z" }, // Inserted recently, but oldest played date!
      ];

      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "scores") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
                order: () => ({
                  order: () => ({
                    then: (cb) => Promise.resolve({ data: sixScoresSortedByPlayedOnDesc }).then(cb),
                    limit: async () => ({
                      data: sixScoresSortedByPlayedOnDesc.slice(0, 5),
                    }),
                  }),
                }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: { id: "score-1", score: 36, played_on: "2026-09-20" },
                  error: null,
                }),
              }),
            }),
            delete: () => ({
              in: (col, ids) => {
                deletedIds = ids;
                return Promise.resolve({ error: null });
              },
            }),
          };
        }
        return {};
      });

      const req = new Request("http://localhost/api/scores", {
        method: "POST",
        body: JSON.stringify({ score: 36, playedOn: "2026-09-20" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      // Verify that the 6th score (the oldest played_on) was deleted
      expect(deletedIds).toContain("score-oldest");
      expect(deletedIds).toHaveLength(1);
    });
  });

  describe("GET /api/scores", () => {
    it("returns scores in reverse chronological order", async () => {
      vi.spyOn(serverClient, "createClient").mockResolvedValue({
        auth: {
          getUser: async () => ({ data: { user: mockUser }, error: null }),
        },
      });

      const sampleScores = [
        { id: "s1", score: 38, played_on: "2026-09-20" },
        { id: "s2", score: 34, played_on: "2026-09-18" },
      ];

      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "scores") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  order: () => ({
                    limit: async () => ({ data: sampleScores, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.scores).toHaveLength(2);
      expect(body.scores[0].played_on).toBe("2026-09-20");
      expect(body.scores[1].played_on).toBe("2026-09-18");
    });
  });

  describe("PATCH & DELETE /api/scores/[id]", () => {
    it("prevents editing a score that belongs to another user (404 Not Found)", async () => {
      vi.spyOn(subscriptionLib, "requireActiveSubscription").mockResolvedValue({
        authorized: true,
        user: mockUser,
      });

      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "scores") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }), // Does not belong to caller
                }),
              }),
            }),
          };
        }
        return {};
      });

      const req = new Request("http://localhost/api/scores/other-user-score", {
        method: "PATCH",
        body: JSON.stringify({ score: 40 }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: "other-user-score" }) });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain("permission");
    });

    it("prevents deleting a score that does not belong to caller", async () => {
      vi.spyOn(subscriptionLib, "requireActiveSubscription").mockResolvedValue({
        authorized: true,
        user: mockUser,
      });

      let calledUserId = null;
      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "scores") {
          return {
            delete: () => ({
              eq: (col1, val1) => ({
                eq: (col2, val2) => {
                  if (col2 === "user_id") calledUserId = val2;
                  return Promise.resolve({ error: null });
                },
              }),
            }),
          };
        }
        return {};
      });

      const req = new Request("http://localhost/api/scores/score-123", {
        method: "DELETE",
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: "score-123" }) });
      expect(res.status).toBe(200);
      // Ensures the SQL query forced user_id = caller id
      expect(calledUserId).toBe(mockUser.id);
    });
  });
});
