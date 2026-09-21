import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as uploadProofHandler } from "@/app/api/winners/[id]/proof/route";
import { POST as reviewWinnerHandler } from "@/app/api/admin/winners/[id]/review/route";
import { POST as payWinnerHandler } from "@/app/api/admin/winners/[id]/pay/route";
import * as serverClient from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

describe("Winner Verification & Payout Logic", () => {
  const golferUser = { id: "golfer-1", email: "golfer@test.com" };
  const adminUser = { id: "admin-1", email: "admin@golvo.com" };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/winners/[id]/proof", () => {
    it("rejects non png/jpg/webp file types with 400", async () => {
      vi.spyOn(serverClient, "createClient").mockResolvedValue({
        auth: { getUser: async () => ({ data: { user: golferUser }, error: null }) },
      });

      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "winners") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: "winner-1",
                    user_id: golferUser.id,
                    verification_status: "pending_proof",
                    payment_status: "pending",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const formData = new FormData();
      const pdfFile = new File(["dummy pdf content"], "scorecard.pdf", { type: "application/pdf" });
      formData.append("file", pdfFile);

      const req = new Request("http://localhost/api/winners/winner-1/proof", {
        method: "POST",
      });
      req.formData = async () => formData;

      const res = await uploadProofHandler(req, { params: Promise.resolve({ id: "winner-1" }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("PNG, JPG, or WEBP");
    });

    it("rejects files exceeding 5MB limit with 400", async () => {
      vi.spyOn(serverClient, "createClient").mockResolvedValue({
        auth: { getUser: async () => ({ data: { user: golferUser }, error: null }) },
      });

      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "winners") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: "winner-1",
                    user_id: golferUser.id,
                    verification_status: "pending_proof",
                    payment_status: "pending",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const formData = new FormData();
      // 5.5 MB file
      const bigBuffer = new Uint8Array(5.5 * 1024 * 1024);
      const bigFile = new File([bigBuffer], "large_scorecard.png", { type: "image/png" });
      formData.append("file", bigFile);

      const req = new Request("http://localhost/api/winners/winner-1/proof", {
        method: "POST",
      });
      req.formData = async () => formData;

      const res = await uploadProofHandler(req, { params: Promise.resolve({ id: "winner-1" }) });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("5MB");
    });

    it("allows a previously rejected winner to re-upload proof, returning status to 'submitted'", async () => {
      vi.spyOn(serverClient, "createClient").mockResolvedValue({
        auth: { getUser: async () => ({ data: { user: golferUser }, error: null }) },
      });

      let updatedPayload = null;
      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "winners") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: "winner-1",
                    user_id: golferUser.id,
                    verification_status: "rejected", // previously rejected!
                    payment_status: "pending",
                  },
                  error: null,
                }),
              }),
            }),
            update: (payload) => {
              updatedPayload = payload;
              return {
                eq: () => ({
                  select: () => ({
                    single: async () => ({
                      data: { id: "winner-1", ...payload },
                      error: null,
                    }),
                  }),
                }),
              };
            },
          };
        }
        return {};
      });

      vi.spyOn(adminClient.storage, "from").mockReturnValue({
        upload: async () => ({ data: { path: "proofs/scorecard.png" }, error: null }),
      });

      const formData = new FormData();
      const validFile = new File(["valid image"], "scorecard.png", { type: "image/png" });
      formData.append("file", validFile);

      const req = new Request("http://localhost/api/winners/winner-1/proof", {
        method: "POST",
      });
      req.formData = async () => formData;

      const res = await uploadProofHandler(req, { params: Promise.resolve({ id: "winner-1" }) });
      expect(res.status).toBe(200);
      expect(updatedPayload.verification_status).toBe("submitted");
    });
  });

  describe("Review & Pay Admin APIs", () => {
    it("rejects non-admin users from reviewing proof with 403 Forbidden", async () => {
      vi.spyOn(serverClient, "createClient").mockResolvedValue({
        auth: { getUser: async () => ({ data: { user: golferUser }, error: null }) },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { role: "subscriber" }, error: null }),
            }),
          }),
        }),
      });

      const req = new Request("http://localhost/api/admin/winners/winner-1/review", {
        method: "POST",
        body: JSON.stringify({ action: "approve" }),
      });

      const res = await reviewWinnerHandler(req, { params: Promise.resolve({ id: "winner-1" }) });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Admin privileges required");
    });

    it("allows admin to approve a winner", async () => {
      vi.spyOn(serverClient, "createClient").mockResolvedValue({
        auth: { getUser: async () => ({ data: { user: adminUser }, error: null }) },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { role: "admin" }, error: null }),
            }),
          }),
        }),
      });

      let updatedStatus = null;
      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "winners") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { id: "winner-1", verification_status: "submitted" },
                  error: null,
                }),
              }),
            }),
            update: (payload) => {
              updatedStatus = payload.verification_status;
              return {
                eq: () => ({
                  select: () => ({
                    single: async () => ({ data: { id: "winner-1", ...payload }, error: null }),
                  }),
                }),
              };
            },
          };
        }
        return {};
      });

      const req = new Request("http://localhost/api/admin/winners/winner-1/review", {
        method: "POST",
        body: JSON.stringify({ action: "approve" }),
      });

      const res = await reviewWinnerHandler(req, { params: Promise.resolve({ id: "winner-1" }) });
      expect(res.status).toBe(200);
      expect(updatedStatus).toBe("approved");
    });

    it("STRICT ENFORCEMENT: 'mark paid' is allowed ONLY when verification_status = approved", async () => {
      vi.spyOn(serverClient, "createClient").mockResolvedValue({
        auth: { getUser: async () => ({ data: { user: adminUser }, error: null }) },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { role: "admin" }, error: null }),
            }),
          }),
        }),
      });

      // Test Case 1: verification_status = 'pending_proof' -> Must fail with 400
      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "winners") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { id: "winner-unverified", verification_status: "pending_proof", payment_status: "pending" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const req1 = new Request("http://localhost/api/admin/winners/winner-unverified/pay", {
        method: "POST",
      });

      const res1 = await payWinnerHandler(req1, { params: Promise.resolve({ id: "winner-unverified" }) });
      expect(res1.status).toBe(400);
      const data1 = await res1.json();
      expect(data1.error).toContain("Must be 'approved' first");

      // Test Case 2: verification_status = 'approved' -> Succeeds!
      vi.spyOn(adminClient, "from").mockImplementation((table) => {
        if (table === "winners") {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: "winner-approved",
                    verification_status: "approved",
                    payment_status: "pending",
                    prize_cents: 50000,
                  },
                  error: null,
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: async () => ({
                    data: { id: "winner-approved", payment_status: "paid", prize_cents: 50000 },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const req2 = new Request("http://localhost/api/admin/winners/winner-approved/pay", {
        method: "POST",
      });

      const res2 = await payWinnerHandler(req2, { params: Promise.resolve({ id: "winner-approved" }) });
      expect(res2.status).toBe(200);
      const data2 = await res2.json();
      expect(data2.message).toContain("Paid successfully");
    });
  });
});
