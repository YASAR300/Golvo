"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Plus,
  Minus,
  Calendar,
  Trash2,
  Edit2,
  Check,
  X,
  Lock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { CurlyArrow } from "@/components/doodles";
import { getTodayDateString } from "@/lib/validators/score";

/**
 * ScoreManager Component
 * Rolling 5-score Stableford tracking system for Golvo subscribers.
 */
export function ScoreManager() {
  const [scores, setScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");

  // New Score Form state
  const today = getTodayDateString();
  const [inputScore, setInputScore] = useState(36); // Typical Stableford target
  const [inputDate, setInputDate] = useState(today);
  const [formError, setFormError] = useState("");

  // Inline editing state
  const [editingId, setEditingId] = useState(null);
  const [editScore, setEditScore] = useState(36);
  const [editDate, setEditDate] = useState(today);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Fetch user scores
  useEffect(() => {
    async function loadScores() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/scores");
        if (res.status === 401) {
          setIsLocked(true);
          setLockMessage("Please log in to manage your scores.");
          return;
        }
        if (res.status === 403) {
          const data = await res.json();
          setIsLocked(true);
          setLockMessage(data.error || "Active subscription required to record scores.");
          return;
        }

        const data = await res.json();
        if (data.scores) {
          setScores(data.scores);
        }
      } catch (err) {
        console.error("Failed to load scores:", err);
        toast.error("Failed to load your latest rounds.");
      } finally {
        setIsLoading(false);
      }
    }

    loadScores();
  }, []);

  // Handle Add Score with Optimistic UI Update
  const handleAddScore = async (e) => {
    e.preventDefault();
    setFormError("");

    const scoreNum = Number(inputScore);
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 45) {
      setFormError("Score must be between 1 and 45 points.");
      return;
    }

    if (!inputDate || inputDate > today) {
      setFormError("Played date cannot be in the future.");
      return;
    }

    // Client-side duplicate date check
    const isDuplicate = scores.some((s) => s.played_on === inputDate);
    if (isDuplicate) {
      setFormError(`A round is already recorded for ${inputDate}. You can edit or delete that entry.`);
      return;
    }

    setIsSubmitting(true);
    const previousScores = [...scores];

    // Optimistic item
    const tempId = `temp-${Date.now()}`;
    const optimisticScore = {
      id: tempId,
      score: scoreNum,
      played_on: inputDate,
      created_at: new Date().toISOString(),
    };

    // Keep strictly up to 5 scores, sorted newest date first
    const optimisticList = [optimisticScore, ...previousScores]
      .sort((a, b) => new Date(b.played_on) - new Date(a.played_on))
      .slice(0, 5);

    setScores(optimisticList);

    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: scoreNum, playedOn: inputDate }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Rollback optimistic update
        setScores(previousScores);
        setFormError(data.error || "Failed to record score.");
        toast.error(data.error || "Failed to save score.");
      } else {
        // Replace with server-confirmed list
        setScores(data.scores || optimisticList);
        toast.success("Round successfully logged!");
        // Reset to default
        setInputScore(36);
        setInputDate(today);
      }
    } catch (err) {
      setScores(previousScores);
      setFormError("Network error. Could not connect to server.");
      toast.error("Network connection failure.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start Editing
  const startEdit = (scoreItem) => {
    setEditingId(scoreItem.id);
    setEditScore(scoreItem.score);
    setEditDate(scoreItem.played_on);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Save Edit with Optimistic UI
  const handleSaveEdit = async (id) => {
    const scoreNum = Number(editScore);
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 45) {
      toast.error("Score must be between 1 and 45 points.");
      return;
    }

    if (!editDate || editDate > today) {
      toast.error("Played date cannot be in the future.");
      return;
    }

    setIsSavingEdit(true);
    const previousScores = [...scores];

    // Optimistic update
    const updatedList = scores.map((s) =>
      s.id === id ? { ...s, score: scoreNum, played_on: editDate } : s
    );
    setScores(updatedList);
    setEditingId(null);

    try {
      const res = await fetch(`/api/scores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: scoreNum, playedOn: editDate }),
      });

      const data = await res.json();
      if (!res.ok) {
        setScores(previousScores);
        toast.error(data.error || "Failed to update round.");
      } else {
        toast.success("Round updated!");
      }
    } catch {
      setScores(previousScores);
      toast.error("Network error while updating score.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Score with Optimistic UI
  const handleDeleteScore = async (id, playedOn) => {
    if (!window.confirm(`Delete round played on ${playedOn}?`)) {
      return;
    }

    const previousScores = [...scores];
    setScores(scores.filter((s) => s.id !== id));

    try {
      const res = await fetch(`/api/scores/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setScores(previousScores);
        toast.error(data.error || "Failed to delete round.");
      } else {
        toast.success("Round removed.");
      }
    } catch {
      setScores(previousScores);
      toast.error("Network error while deleting round.");
    }
  };

  // Stepper helpers
  const incrementScore = (val, setter) => {
    setter((prev) => Math.min(45, Number(prev || 0) + 1));
  };
  const decrementScore = (val, setter) => {
    setter((prev) => Math.max(1, Number(prev || 0) - 1));
  };

  // Format date safely
  const formatRoundDate = (dateStr) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // If Non-Subscriber (Locked State)
  if (isLocked) {
    return (
      <Card className="relative overflow-hidden bg-[#0F1011] border-white/[0.08]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#5E6AD2]/5 to-transparent pointer-events-none" />
        <CardContent className="p-8 sm:p-12 text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 flex items-center justify-center mx-auto text-[#8A95FF]">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white tracking-tight">
              Subscription Required
            </h3>
            <p className="text-xs sm:text-sm text-[#8A8F98] leading-relaxed">
              {lockMessage || "An active Golvo subscription is required to log Stableford scores and enter monthly charity draws."}
            </p>
          </div>
          <div className="pt-2">
            <Link href="/pricing">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View Membership Plans
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative bg-[#0F1011] border-white/[0.08] shadow-2xl overflow-hidden">
      {/* Top Ambient Glow */}
      <div
        className="absolute top-0 right-0 w-80 h-32 pointer-events-none -z-0 opacity-40"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(94, 106, 210, 0.35), transparent 70%)",
        }}
      />

      <CardHeader className="p-6 sm:p-7 border-b border-white/[0.06] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg sm:text-xl font-bold text-white">
                Stableford Performance
              </CardTitle>
              <Badge variant="accent" size="sm">
                5-Score System
              </Badge>
            </div>
            <CardDescription className="text-xs text-[#8A8F98]">
              Your 5 latest verified rounds automatically generate your monthly jackpot draw numbers.
            </CardDescription>
          </div>

          {/* Slot Progress Summary */}
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] px-3.5 py-1.5 rounded-full">
            <span className="text-xs text-[#8A8F98]">Active Rounds:</span>
            <span className="text-xs font-bold text-white">
              {scores.length} / 5
            </span>
            {scores.length === 5 && (
              <span className="text-[10px] font-semibold text-[#4CC38A] bg-[#4CC38A]/10 border border-[#4CC38A]/30 px-1.5 py-0.5 rounded">
                Full Ticket
              </span>
            )}
          </div>
        </div>

        {/* 5-Slot Visual Indicator */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {[0, 1, 2, 3, 4].map((index) => {
              const item = scores[index];
              return (
                <div
                  key={index}
                  className={`relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-[8px] transition-all ${
                    item
                      ? "bg-white/[0.05] border border-white/20 shadow-sm"
                      : "border border-dashed border-white/10 bg-white/[0.01]"
                  }`}
                >
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[#8A8F98] mb-1">
                    Slot {index + 1}
                  </span>
                  {item ? (
                    <span className="text-base sm:text-lg font-extrabold text-white">
                      {item.score}
                    </span>
                  ) : (
                    <span className="text-xs text-white/20 font-medium py-0.5">
                      Empty
                    </span>
                  )}
                  {index === 4 && scores.length === 5 && (
                    <span
                      title="Next round replaces this oldest score"
                      className="absolute -top-1.5 -right-1 text-[9px] bg-[#EB5757]/20 border border-[#EB5757]/40 text-[#EB5757] px-1 rounded font-mono"
                    >
                      Oldest
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-[#8A8F98] flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-[#5E6AD2] shrink-0" />
            <span>
              Scores rolling rule: Logging round 6 automatically cycles out Slot 5 (the oldest).
            </span>
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-7 space-y-6">
        {/* Inline Add Score Form */}
        <div className="p-4 sm:p-5 rounded-[10px] bg-white/[0.02] border border-white/[0.08] relative">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-[#5E6AD2]" />
            <span>Log Certified Round</span>
          </h4>

          {formError && (
            <div className="mb-4 p-2.5 rounded-[6px] bg-[#EB5757]/10 border border-[#EB5757]/20 text-xs text-[#EB5757] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddScore} className="flex flex-col sm:flex-row items-end gap-3.5">
            {/* Score Stepper Input */}
            <div className="w-full sm:w-48 space-y-1.5">
              <label className="block text-[11px] font-medium text-[#8A8F98]">
                Points (1–45)
              </label>
              <div className="flex items-center rounded-[6px] bg-[#141516] border border-white/10 overflow-hidden focus-within:border-[#5E6AD2]">
                <button
                  type="button"
                  onClick={() => decrementScore(inputScore, setInputScore)}
                  aria-label="Decrease score"
                  className="px-3 py-2 text-[#8A8F98] hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="45"
                  value={inputScore}
                  onChange={(e) => setInputScore(e.target.value)}
                  required
                  className="w-full text-center bg-transparent text-sm font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => incrementScore(inputScore, setInputScore)}
                  aria-label="Increase score"
                  className="px-3 py-2 text-[#8A8F98] hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Date Input */}
            <div className="w-full sm:flex-1 space-y-1.5">
              <label className="block text-[11px] font-medium text-[#8A8F98]">
                Played On
              </label>
              <div className="relative">
                <input
                  type="date"
                  max={today}
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-[6px] bg-[#141516] border border-white/10 text-xs text-white focus:outline-none focus:border-[#5E6AD2] transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full sm:w-auto h-9 px-5 text-xs font-semibold shrink-0"
              leftIcon={!isSubmitting && <Plus className="w-3.5 h-3.5" />}
            >
              {isSubmitting ? "Logging..." : "Record Score"}
            </Button>
          </form>
        </div>

        {/* Scores List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[#8A8F98] px-1">
            <span className="uppercase tracking-wider font-semibold">
              Current Rolling Rounds (Latest 5)
            </span>
            <span>Sorted Newest First</span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#8A8F98] animate-pulse">
              Loading verified Stableford scores...
            </div>
          ) : scores.length === 0 ? (
            /* Friendly Empty State with Caveat text & CurlyArrow doodle */
            <div className="py-14 text-center relative rounded-[10px] border border-dashed border-white/10 bg-white/[0.01]">
              <div className="max-w-xs mx-auto space-y-3">
                <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto text-[#8A8F98]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h5 className="text-sm font-semibold text-white">
                  No rounds recorded yet
                </h5>
                <p className="text-xs text-[#8A8F98] leading-relaxed">
                  Log your weekend rounds (1–45 pts) to start calculating your performance tier and enter the charity jackpot draw.
                </p>

                {/* Hand-drawn note & Curly Arrow pointing up to the form */}
                <div className="pt-3 flex items-center justify-center gap-2 text-[#8A95FF]">
                  <CurlyArrow size={34} height={24} className="text-[#8A95FF] -rotate-45" />
                  <span className="font-caveat text-base text-[#8A95FF]">
                    add your first round above!
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((item, idx) => {
                const isEditing = editingId === item.id;

                if (isEditing) {
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-[8px] bg-white/[0.05] border border-[#5E6AD2]/50 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200"
                    >
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <span className="text-xs font-mono text-[#8A8F98]">
                          #{idx + 1}
                        </span>
                        <div className="flex items-center rounded bg-[#141516] border border-white/10">
                          <button
                            type="button"
                            onClick={() => decrementScore(editScore, setEditScore)}
                            className="px-2 py-1 text-xs text-[#8A8F98] hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="45"
                            value={editScore}
                            onChange={(e) => setEditScore(e.target.value)}
                            className="w-12 text-center bg-transparent text-xs font-bold text-white focus:outline-none [appearance:textfield]"
                          />
                          <button
                            type="button"
                            onClick={() => incrementScore(editScore, setEditScore)}
                            className="px-2 py-1 text-xs text-[#8A8F98] hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <input
                          type="date"
                          max={today}
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="px-2 py-1 rounded bg-[#141516] border border-white/10 text-xs text-white"
                        />
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                          size="sm"
                          variant="primary"
                          className="h-7 px-2.5 text-xs"
                          isLoading={isSavingEdit}
                          onClick={() => handleSaveEdit(item.id)}
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-[#8A8F98]"
                          onClick={cancelEdit}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="group p-3.5 rounded-[8px] bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Slot Order Number */}
                      <span className="text-xs font-mono text-[#8A8F98]/70 w-5">
                        #{idx + 1}
                      </span>

                      {/* Score Value (Big & Prominent) */}
                      <div className="w-11 h-11 rounded-[8px] bg-white/[0.04] border border-white/10 flex items-center justify-center font-extrabold text-lg text-white group-hover:border-[#5E6AD2]/60 group-hover:text-[#8A95FF] transition-colors">
                        {item.score}
                      </div>

                      {/* Details */}
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          <span>{item.score} Stableford Points</span>
                          {item.score >= 36 && (
                            <span className="text-[10px] text-[#4CC38A] bg-[#4CC38A]/10 border border-[#4CC38A]/25 px-1.5 py-0.2 rounded font-medium">
                              Par+
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8A8F98] flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3 h-3 text-[#8A8F98]" />
                          <span>{formatRoundDate(item.played_on)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions on Hover */}
                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        title="Edit round"
                        aria-label="Edit round"
                        className="p-1.5 rounded text-[#8A8F98] hover:text-white hover:bg-white/[0.08] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteScore(item.id, item.played_on)}
                        title="Delete round"
                        aria-label="Delete round"
                        className="p-1.5 rounded text-[#8A8F98] hover:text-[#EB5757] hover:bg-[#EB5757]/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ScoreManager;
