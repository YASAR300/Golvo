/**
 * Golvo Platform Database Seed Script
 *
 * Creates:
 * 1. Admin account: admin@golvo.test / GolvoAdmin2026!
 * 2. Subscriber account: user@golvo.test / GolvoUser2026! (with active subscription & 5 scores)
 * 3. Featured charities (Youth on Course, First Tee, PGA REACH)
 * 4. Sample monthly draws (published & simulated)
 *
 * Usage:
 *   node scripts/seed.js
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Load .env.local manually if not present in process.env
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function getOrCreateUser(email, password, fullName, role = "subscriber") {
  // Check if user already exists
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;

  let user = listData.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createErr) throw createErr;
    user = createData.user;
    console.log(`  ✓ Created user account: ${email}`);
  } else {
    console.log(`  ℹ User already exists: ${email}`);
    const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
      password: password,
      email_confirm: true,
    });
    if (updateErr) {
      console.warn(`  ⚠ Could not update password for ${email}:`, updateErr.message);
    } else {
      console.log(`  ✓ Synced password for: ${email}`);
    }
  }

  // Ensure profile exists with specified role
  const { error: profErr } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: email,
      full_name: fullName,
      role: role,
      charity_percent: 10,
    },
    { onConflict: "id" }
  );

  if (profErr) {
    if (profErr.code === "PGRST205") {
      console.error("\n❌ Supabase database tables not found (PGRST205).");
      console.error("👉 Please open your Supabase project dashboard, navigate to SQL Editor, and execute the queries in 'supabase/schema.sql' to create the database tables.\n");
      process.exit(1);
    }
    throw profErr;
  }
  return user;
}

async function seed() {
  console.log("\n🌱 Starting Golvo Platform Seed...\n");

  // 1. Seed Charities
  console.log("1. Seeding Charity Partners...");
  const charities = [
    {
      name: "Youth on Course",
      slug: "youth-on-course",
      description:
        "Provides youth with access to life-changing opportunities through golf rounds for $5 or less, subsidized clinics, and collegiate scholarships.",
      image_url:
        "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=80",
      is_featured: true,
      events: [
        {
          id: "ev-1",
          title: "100-Hole Hike Charity Marathon",
          date: "2026-10-15",
          location: "Pebble Beach Golf Links, CA",
          description: "Golfers walk 100 holes in one day to fund youth golf memberships.",
        },
      ],
    },
    {
      name: "First Tee Foundation",
      slug: "first-tee",
      description:
        "Empowering kids and teens through golf, building self-confidence, inner strength, and character on and off the course.",
      image_url:
        "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=800&q=80",
      is_featured: true,
      events: [],
    },
    {
      name: "PGA REACH",
      slug: "pga-reach",
      description:
        "The 501(c)(3) charitable foundation of the PGA of America, impacting lives through youth golf, military veterans programs, and diversity initiatives.",
      image_url:
        "https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=800&q=80",
      is_featured: false,
      events: [],
    },
  ];

  let primaryCharityId = null;

  for (const c of charities) {
    const { data, error } = await supabase
      .from("charities")
      .upsert(c, { onConflict: "slug" })
      .select()
      .single();

    if (error) {
      console.warn(`  ⚠ Charity upsert notice for ${c.name}:`, error.message);
    } else {
      console.log(`  ✓ Charity synced: ${c.name}`);
      if (c.slug === "youth-on-course") {
        primaryCharityId = data.id;
      }
    }
  }

  // 2. Seed Admin User
  console.log("\n2. Seeding Administrator...");
  const adminUser = await getOrCreateUser(
    "admin@golvo.test",
    "GolvoAdmin2026!",
    "Golvo Platform Admin",
    "admin"
  );

  // 3. Seed Subscriber User
  console.log("\n3. Seeding Subscriber Golfer...");
  const subUser = await getOrCreateUser(
    "user@golvo.test",
    "GolvoUser2026!",
    "Jordan Spieth (Test)",
    "subscriber"
  );

  // Link subscriber to primary charity
  if (primaryCharityId) {
    await supabase
      .from("profiles")
      .update({ charity_id: primaryCharityId, charity_percent: 15 })
      .eq("id", subUser.id);
  }

  // Seed Active Subscription
  console.log("  ✓ Setting up active subscription...");
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", subUser.id)
    .maybeSingle();

  if (existingSub) {
    await supabase
      .from("subscriptions")
      .update({
        plan: "monthly",
        status: "active",
        current_period_end: thirtyDaysLater,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSub.id);
  } else {
    await supabase.from("subscriptions").insert({
      user_id: subUser.id,
      stripe_subscription_id: "sub_test_" + Math.random().toString(36).substring(2, 9),
      plan: "monthly",
      status: "active",
      current_period_end: thirtyDaysLater,
      cancel_at_period_end: false,
    });
  }

  // Seed 5 Verified Stableford Scores (1-45)
  console.log("  ✓ Seeding rolling 5-score Stableford ticket...");
  const sampleScores = [
    { score: 38, daysAgo: 1 },
    { score: 35, daysAgo: 4 },
    { score: 41, daysAgo: 8 },
    { score: 33, daysAgo: 12 },
    { score: 37, daysAgo: 15 },
  ];

  for (const s of sampleScores) {
    const d = new Date(Date.now() - s.daysAgo * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    await supabase.from("scores").upsert(
      {
        user_id: subUser.id,
        score: s.score,
        played_on: dateStr,
      },
      { onConflict: "user_id,played_on" }
    );
  }

  // 4. Seed Monthly Draws
  console.log("\n4. Seeding Monthly Draws...");
  // Past published draw
  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevMonthStr = prevMonth.toISOString().slice(0, 7);

  await supabase.from("draws").upsert(
    {
      month: prevMonthStr,
      mode: "algorithmic",
      status: "published",
      winning_numbers: [14, 22, 28, 35, 41],
      prize_pool_cents: 1245000,
      jackpot_rollover_cents: 498000,
      published_at: new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1).toISOString(),
    },
    { onConflict: "month" }
  );
  console.log(`  ✓ Seeded published draw for ${prevMonthStr}`);

  // Current month draw
  const curMonthStr = new Date().toISOString().slice(0, 7);
  await supabase.from("draws").upsert(
    {
      month: curMonthStr,
      mode: "random",
      status: "simulated",
      winning_numbers: [7, 18, 25, 33, 42],
      prize_pool_cents: 1450000,
      jackpot_rollover_cents: 498000,
    },
    { onConflict: "month" }
  );
  console.log(`  ✓ Seeded simulated draw for ${curMonthStr}`);

  // Print Summary & Credentials
  console.log("\n========================================================");
  console.log("⛳ GOLVO PLATFORM SEED COMPLETED SUCCESSFULLY");
  console.log("========================================================");
  console.log("\n🔐 TEST CREDENTIALS:\n");
  console.log("1. ADMINISTRATOR ACCOUNT:");
  console.log("   • URL:      https://golvo.vercel.app/admin");
  console.log("   • Email:    admin@golvo.test");
  console.log("   • Password: GolvoAdmin2026!");
  console.log("   • Role:     admin (Full access to Users, Draws, Charities, Winners, Analytics)");
  console.log("\n2. SUBSCRIBER ACCOUNT:");
  console.log("   • URL:      https://golvo.vercel.app/dashboard");
  console.log("   • Email:    user@golvo.test");
  console.log("   • Password: GolvoUser2026!");
  console.log("   • Status:   Active Monthly Subscriber ($9.99/mo)");
  console.log("   • Scores:   5 verified rounds [38, 35, 41, 33, 37]");
  console.log("   • Charity:  Youth on Course (15% allocation)");
  console.log("========================================================\n");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Seed script failed:", err);
    process.exit(1);
  });
