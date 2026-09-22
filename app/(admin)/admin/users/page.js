"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Users,
  Search,
  Filter,
  Shield,
  CreditCard,
  Trophy,
  Calendar,
  X,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Edit2,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/constants";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected user for modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // Score management inside modal
  const [newScore, setNewScore] = useState("");
  const [newScoreDate, setNewScoreDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  // Form states for profile edit
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("subscriber");

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all") params.set("subStatus", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      toast.error(err.message || "Could not load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function openUserDetail(user) {
    setSelectedUser(user);
    setEditName(user.full_name || "");
    setEditRole(user.role || "subscriber");
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`);
      if (!res.ok) throw new Error("Failed to load user details");
      const data = await res.json();
      setDetailData(data.user);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleSaveProfile() {
    if (!selectedUser) return;
    setIsUpdatingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editName,
          role: editRole,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Update failed");
      }

      toast.success("User profile updated successfully");
      fetchUsers();
      // Update local detail
      setDetailData((prev) => ({
        ...prev,
        full_name: editName,
        role: editRole,
      }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUpdatingUser(false);
    }
  }

  async function handleToggleSubscription(newStatus) {
    if (!selectedUser) return;
    setIsUpdatingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription_status: newStatus,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Subscription update failed");
      }

      toast.success(`Subscription marked as ${newStatus}`);
      fetchUsers();
      // Reload detail
      const detailRes = await fetch(`/api/admin/users/${selectedUser.id}`);
      if (detailRes.ok) {
        const d = await detailRes.json();
        setDetailData(d.user);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsUpdatingUser(false);
    }
  }

  async function handleAddScore() {
    if (!selectedUser) return;
    const s = parseInt(newScore, 10);
    if (isNaN(s) || s < 1 || s > 45) {
      toast.error("Enter a valid score between 1 and 45");
      return;
    }

    setIsSavingScore(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: s,
          played_on: newScoreDate,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add score");
      }

      toast.success("Score added successfully");
      setNewScore("");
      // Refresh user scores
      const scoreRes = await fetch(`/api/admin/users/${selectedUser.id}/scores`);
      if (scoreRes.ok) {
        const data = await scoreRes.json();
        setDetailData((prev) => ({
          ...prev,
          scores: data.scores || [],
        }));
      }
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSavingScore(false);
    }
  }

  async function handleDeleteScore(scoreId) {
    if (!selectedUser) return;
    try {
      const res = await fetch(
        `/api/admin/users/${selectedUser.id}/scores?scoreId=${scoreId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to remove score");
      }

      toast.success("Score deleted");
      setDetailData((prev) => ({
        ...prev,
        scores: (prev.scores || []).filter((s) => s.id !== scoreId),
      }));
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            User Directory
            <span className="text-xs font-mono text-[#8A8F98]">
              ({users.length} registered)
            </span>
          </h1>
          <p className="text-xs text-[#8A8F98] mt-1">
            Search golfer profiles, edit handicap scores, and manage membership subscriptions.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/20 text-xs text-[#8A8F98] hover:text-white transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F98]" />
          <input
            type="text"
            data-testid="admin-user-search"
            placeholder="Search by golfer name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0F1011] border border-white/[0.08] rounded-lg text-xs text-white placeholder-[#8A8F98] focus:outline-none focus:border-[#5E6AD2] transition-colors"
          />
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 bg-[#0F1011] border border-white/[0.08] rounded-lg text-xs text-white focus:outline-none focus:border-[#5E6AD2]"
        >
          <option value="all">All Roles</option>
          <option value="subscriber">Subscribers</option>
          <option value="admin">Administrators</option>
        </select>

        {/* Sub Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 bg-[#0F1011] border border-white/[0.08] rounded-lg text-xs text-white focus:outline-none focus:border-[#5E6AD2]"
        >
          <option value="all">All Subscription States</option>
          <option value="active">Active Members</option>
          <option value="inactive">Inactive</option>
          <option value="canceled">Canceled</option>
          <option value="none">No Subscription</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0F1011] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[#8A8F98] font-medium">
                <th className="py-3 px-4">Golfer</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Subscription</th>
                <th className="py-3 px-4">Charity</th>
                <th className="py-3 px-4 text-center">Scores</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#8A8F98]">
                    <div className="inline-block w-5 h-5 rounded-full border-2 border-white/20 border-t-[#5E6AD2] animate-spin mb-2" />
                    <div>Loading golfer directory...</div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#8A8F98]">
                    No golfers match the specified search or filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const subStatus = u.subscription?.status;
                  return (
                    <tr
                      key={u.id}
                      data-testid="user-row"
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center font-semibold text-white uppercase text-[11px] shrink-0">
                            {(u.full_name || u.email || "G")[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-white truncate max-w-[160px]">
                              {u.full_name || "Anonymous Golfer"}
                            </div>
                            <div className="text-[11px] text-[#8A8F98] truncate max-w-[160px]">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {u.role === "admin" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[#5E6AD2]/15 text-[#8590EA] border border-[#5E6AD2]/30">
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-[#8A8F98] border border-white/[0.08]">
                            Subscriber
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {subStatus === "active" ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {u.subscription.plan}
                          </span>
                        ) : subStatus === "canceled" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/20">
                            Canceled
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8A8F98]">Inactive</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[11px] text-white truncate max-w-[120px]">
                          {u.charity_name || "Platform Pool"}
                        </div>
                        <div className="text-[10px] text-[#8A8F98]">
                          {u.charity_percent || 10}% share
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] ${
                            u.scores_count >= 5
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-white/[0.04] text-[#8A8F98]"
                          }`}
                        >
                          {u.scores_count} / 5
                        </span>
                      </td>

                      <td className="py-3 px-4 text-[#8A8F98] text-[11px] font-mono whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openUserDetail(u)}
                          className="px-2.5 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedUser(null)}
          />

          <div className="relative w-full max-w-2xl bg-[#0F1011] border border-white/[0.12] rounded-xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#5E6AD2]/20 border border-[#5E6AD2]/30 flex items-center justify-center text-sm font-bold text-white">
                  {(selectedUser.full_name || selectedUser.email || "G")[0]}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {selectedUser.full_name || "Golfer Profile"}
                  </h2>
                  <p className="text-xs text-[#8A8F98] font-mono">{selectedUser.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-md text-[#8A8F98] hover:text-white hover:bg-white/[0.06]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-16 text-center text-xs text-[#8A8F98]">
                <div className="inline-block w-6 h-6 rounded-full border-2 border-white/20 border-t-[#5E6AD2] animate-spin mb-2" />
                <div>Fetching details...</div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile Edit Section */}
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-4">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                    Profile & Role
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-[#8A8F98] mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#08090A] border border-white/[0.08] rounded-md text-xs text-white focus:outline-none focus:border-[#5E6AD2]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#8A8F98] mb-1">
                        Role
                      </label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#08090A] border border-white/[0.08] rounded-md text-xs text-white focus:outline-none focus:border-[#5E6AD2]"
                      >
                        <option value="subscriber">Subscriber</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isUpdatingUser}
                    className="px-3 py-1.5 rounded-md bg-[#5E6AD2] hover:bg-[#4E5AC0] text-white text-xs font-medium transition-colors"
                  >
                    {isUpdatingUser ? "Saving..." : "Save Profile Details"}
                  </button>
                </div>

                {/* Subscription Management */}
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                    Subscription Lifecycle
                  </h3>
                  {detailData?.subscriptions?.length > 0 ? (
                    <div className="space-y-3">
                      {detailData.subscriptions.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md bg-[#08090A] border border-white/[0.06]"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-white capitalize">
                                {sub.plan} Plan
                              </span>
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                  sub.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                }`}
                              >
                                {sub.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#8A8F98] mt-1 font-mono">
                              Period End:{" "}
                              {sub.current_period_end
                                ? new Date(sub.current_period_end).toLocaleDateString()
                                : "N/A"}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {sub.status === "active" ? (
                              <button
                                type="button"
                                onClick={() => handleToggleSubscription("canceled")}
                                disabled={isUpdatingUser}
                                className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] transition-colors"
                              >
                                Cancel Subscription
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleSubscription("active")}
                                disabled={isUpdatingUser}
                                className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] transition-colors"
                              >
                                Reactivate
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8A8F98]">No active subscription recorded in Stripe.</p>
                  )}
                </div>

                {/* Score Management */}
                <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                        Handicap Scores ({detailData?.scores?.length || 0})
                      </h3>
                      <p className="text-[11px] text-[#8A8F98]">
                        The golfer&apos;s 5 most recent scores form their draw ticket.
                      </p>
                    </div>
                  </div>

                  {/* Add Score Row */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min="1"
                      max="45"
                      placeholder="Score (1-45)"
                      value={newScore}
                      onChange={(e) => setNewScore(e.target.value)}
                      className="w-28 px-3 py-1.5 bg-[#08090A] border border-white/[0.08] rounded-md text-xs text-white focus:outline-none focus:border-[#5E6AD2]"
                    />
                    <input
                      type="date"
                      value={newScoreDate}
                      onChange={(e) => setNewScoreDate(e.target.value)}
                      className="px-3 py-1.5 bg-[#08090A] border border-white/[0.08] rounded-md text-xs text-white focus:outline-none focus:border-[#5E6AD2]"
                    />
                    <button
                      type="button"
                      onClick={handleAddScore}
                      disabled={isSavingScore}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#5E6AD2] hover:bg-[#4E5AC0] text-white text-xs font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isSavingScore ? "Adding..." : "Add Score"}</span>
                    </button>
                  </div>

                  {/* Scores List */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {detailData?.scores?.length === 0 ? (
                      <p className="text-xs text-[#8A8F98]">No scores recorded.</p>
                    ) : (
                      detailData?.scores?.map((s, idx) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2 rounded-md bg-[#08090A] border border-white/[0.04]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded bg-white/[0.06] text-white font-mono text-[10px] flex items-center justify-center font-bold">
                              #{idx + 1}
                            </span>
                            <span className="text-sm font-semibold text-white">
                              {s.score}
                            </span>
                            <span className="text-[10px] text-[#8A8F98] font-mono">
                              Played on {s.played_on}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteScore(s.id)}
                            className="p-1 rounded text-[#8A8F98] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete score"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
