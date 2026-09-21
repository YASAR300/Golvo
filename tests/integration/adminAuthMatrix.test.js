import { describe, it, expect, vi, beforeEach } from "vitest";
import * as serverClient from "@/lib/supabase/server";

// Import all admin route handlers
import { GET as getAnalytics } from "@/app/api/admin/analytics/route";
import { GET as getCharities, POST as postCharities } from "@/app/api/admin/charities/route";
import { PATCH as patchCharity, DELETE as deleteCharity } from "@/app/api/admin/charities/[id]/route";
import { GET as getDraws, POST as postDraws } from "@/app/api/admin/draws/route";
import { GET as getDrawById } from "@/app/api/admin/draws/[id]/route";
import { POST as publishDrawRoute } from "@/app/api/admin/draws/[id]/publish/route";
import { GET as getUsers } from "@/app/api/admin/users/route";
import { GET as getUserById, PATCH as patchUserById } from "@/app/api/admin/users/[id]/route";
import { GET as getUserScores } from "@/app/api/admin/users/[id]/scores/route";
import { GET as getWinners } from "@/app/api/admin/winners/route";
import { GET as reviewWinnerGet, POST as reviewWinnerPost } from "@/app/api/admin/winners/[id]/review/route";
import { POST as payWinnerPost } from "@/app/api/admin/winners/[id]/pay/route";

describe("Admin Authorization Matrix Test", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const adminRoutes = [
    { name: "GET /api/admin/analytics", handler: (req) => getAnalytics(req) },
    { name: "GET /api/admin/charities", handler: (req) => getCharities(req) },
    { name: "POST /api/admin/charities", handler: (req) => postCharities(req) },
    { name: "PATCH /api/admin/charities/[id]", handler: (req) => patchCharity(req, { params: Promise.resolve({ id: "ch-1" }) }) },
    { name: "DELETE /api/admin/charities/[id]", handler: (req) => deleteCharity(req, { params: Promise.resolve({ id: "ch-1" }) }) },
    { name: "GET /api/admin/draws", handler: (req) => getDraws(req) },
    { name: "POST /api/admin/draws", handler: (req) => postDraws(req) },
    { name: "GET /api/admin/draws/[id]", handler: (req) => getDrawById(req, { params: Promise.resolve({ id: "dr-1" }) }) },
    { name: "POST /api/admin/draws/[id]/publish", handler: (req) => publishDrawRoute(req, { params: Promise.resolve({ id: "dr-1" }) }) },
    { name: "GET /api/admin/users", handler: (req) => getUsers(req) },
    { name: "GET /api/admin/users/[id]", handler: (req) => getUserById(req, { params: Promise.resolve({ id: "u-1" }) }) },
    { name: "PATCH /api/admin/users/[id]", handler: (req) => patchUserById(req, { params: Promise.resolve({ id: "u-1" }) }) },
    { name: "GET /api/admin/users/[id]/scores", handler: (req) => getUserScores(req, { params: Promise.resolve({ id: "u-1" }) }) },
    { name: "GET /api/admin/winners", handler: (req) => getWinners(req) },
    { name: "GET /api/admin/winners/[id]/review", handler: (req) => reviewWinnerGet(req, { params: Promise.resolve({ id: "w-1" }) }) },
    { name: "POST /api/admin/winners/[id]/review", handler: (req) => reviewWinnerPost(req, { params: Promise.resolve({ id: "w-1" }) }) },
    { name: "POST /api/admin/winners/[id]/pay", handler: (req) => payWinnerPost(req, { params: Promise.resolve({ id: "w-1" }) }) },
  ];

  for (const route of adminRoutes) {
    describe(route.name, () => {
      it("returns 401 for anonymous / unauthenticated user", async () => {
        vi.spyOn(serverClient, "createClient").mockResolvedValue({
          auth: {
            getUser: async () => ({ data: { user: null }, error: new Error("No session") }),
          },
        });

        const req = new Request("http://localhost/api/admin/test", {
          method: route.name.startsWith("POST") || route.name.startsWith("PATCH") ? "POST" : "GET",
          body: route.name.startsWith("POST") || route.name.startsWith("PATCH") ? JSON.stringify({}) : undefined,
        });

        const res = await route.handler(req);
        expect(res.status).toBe(401);
      });

      it("returns 403 for authenticated regular subscriber user", async () => {
        vi.spyOn(serverClient, "createClient").mockResolvedValue({
          auth: {
            getUser: async () => ({ data: { user: { id: "subscriber-1" } }, error: null }),
          },
          from: (table) => {
            if (table === "profiles") {
              return {
                select: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({ data: { role: "subscriber" }, error: null }),
                  }),
                }),
              };
            }
            return {};
          },
        });

        const req = new Request("http://localhost/api/admin/test", {
          method: route.name.startsWith("POST") || route.name.startsWith("PATCH") ? "POST" : "GET",
          body: route.name.startsWith("POST") || route.name.startsWith("PATCH") ? JSON.stringify({}) : undefined,
        });

        const res = await route.handler(req);
        expect(res.status).toBe(403);
      });
    });
  }
});
