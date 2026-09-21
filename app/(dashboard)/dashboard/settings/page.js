"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { CreditCard, ArrowLeft, ShieldCheck, Heart, ExternalLink, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

export default function DashboardSettingsPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData?.session?.user;

        if (currentUser) {
          setUser(currentUser);

          const { data: p } = await supabase
            .from("profiles")
            .select("id, full_name, email, role, charity_percent")
            .eq("id", currentUser.id)
            .maybeSingle();
          setProfile(p);

          const { data: sub } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", currentUser.id)
            .eq("status", "active")
            .maybeSingle();
          setSubscription(sub);
        }
      } catch (err) {
        console.warn("Failed to load settings data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleOpenPortal = async () => {
    setIsLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error(data?.error || "Could not open billing portal.");
        setIsLoadingPortal(false);
      }
    } catch {
      toast.error("Billing portal request failed.");
      setIsLoadingPortal(false);
    }
  };

  const isSubscribed = subscription?.status === "active";
  const fullName = profile?.full_name || user?.user_metadata?.full_name || "Golfer";
  const email = user?.email || "golfer@golvo.com";

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-[#8A8F98]">Loading settings...</div>;
  }

  return (
    <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="p-6 sm:p-7 rounded-[12px] bg-[#0F1011] border border-white/[0.08] relative overflow-hidden backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="text-[#8A8F98] hover:text-white transition-colors p-1 -ml-1 rounded hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              Settings &amp; Billing
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#8A8F98]">
            Manage your golfer subscription plan, invoices, and profile details.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Subscription & Payment Details */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-[#0F1011] border-white/[0.08] p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-[#5E6AD2]" />
                <h3 className="text-base font-bold text-white">Subscription Membership</h3>
              </div>

              {isSubscribed ? (
                <Badge variant="success" size="sm" withDot>
                  Active Subscription
                </Badge>
              ) : (
                <Badge variant="secondary" size="sm">
                  Free Preview
                </Badge>
              )}
            </div>

            {isSubscribed ? (
              <div className="space-y-4">
                <div className="p-4 rounded-[10px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-white text-sm">
                      {subscription.plan === "yearly" ? "Annual Champion" : "Monthly Golfer"}
                    </span>
                    <p className="text-[#8A8F98]">
                      {subscription.plan === "yearly"
                        ? "$95.88 / year ($7.99/mo equivalent)"
                        : "$9.99 / month"}
                    </p>
                  </div>

                  {subscription.current_period_end && (
                    <div className="text-right">
                      <span className="text-[11px] text-[#8A8F98] block">Next Invoice Date</span>
                      <span className="font-mono text-white font-medium">
                        {new Date(subscription.current_period_end).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-[10px] bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-center justify-between gap-4 text-xs text-[#8A95FF]">
                  <span>
                    Manage credit cards, view past invoices, or update plan directly on Stripe Customer Portal.
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenPortal}
                    isLoading={isLoadingPortal}
                    className="shrink-0 text-xs bg-[#5E6AD2] hover:bg-[#6875E8]"
                    rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Stripe Portal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs text-[#8A8F98]">
                <p>
                  You do not currently have an active golfer subscription. Subscribe to enter every monthly charity draw and track your certified handicap.
                </p>
                <Link href="/pricing">
                  <Button variant="primary" size="sm">
                    View Membership Plans
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (5 cols): Golfer Profile Details */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-[#0F1011] border-white/[0.08] p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.06]">
              <User className="w-4 h-4 text-[#8A8F98]" />
              <h3 className="text-sm font-bold text-white">Profile Information</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-[#8A8F98]">Full Name</span>
                <span className="font-semibold text-white">{fullName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8A8F98]">Email Address</span>
                <span className="font-mono text-white">{email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8A8F98]">Role</span>
                <span className="capitalize text-white font-medium">{profile?.role || "Subscriber"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8A8F98]">Charity Pledged</span>
                <span className="text-[#4CC38A] font-semibold">{profile?.charity_percent || 10}%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
