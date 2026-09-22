/**
 * Golvo Platform Rich Database Seed Script
 *
 * Populates diverse realistic production-like data:
 * 1. Admin account: admin@golvo.test / GolvoAdmin2026!
 * 2. Primary Subscriber: user@golvo.test / GolvoUser2026!
 * 3. Additional Diverse Golfers (active, canceled, pending proof claim, etc.)
 * 4. Charities with logos & real events
 * 5. Monthly draws (Past published, current active simulated, future draft)
 * 6. Real Winner Claims (pending proof, submitted proof with sample image, approved & paid)
 * 7. Real Donations history
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

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
  console.error("❌ Error: Supabase credentials not found in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function getOrCreateUser(email, password, fullName, role = "subscriber") {
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
    console.log(`  ℹ User exists: ${email}`);
    await supabase.auth.admin.updateUserById(user.id, {
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    console.log(`  ✓ Synced credentials for: ${email}`);
  }

  const { error: profErr } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: email,
      full_name: fullName,
      role: role,
      charity_percent: 15,
    },
    { onConflict: "id" }
  );

  if (profErr) throw profErr;
  return user;
}

async function richSeed() {
  console.log("\n🌱 Starting Golvo Rich Production Data Seeding...\n");

  // 1. Seed All 6 Official Charities
  console.log("1. Seeding Official Partner Charities...");
  const charities = [
    {
      name: "Youth on Course",
      slug: "youth-on-course",
      description: "Subsidizing rounds of golf for young players nationwide for $5 or less, removing socio-economic barriers to play.",
      image_url: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=80",
      is_featured: true,
      is_active: true,
      events: [
        { id: "e1", name: "100-Hole Hike Charity Marathon", date: "2026-10-15", location: "Pebble Beach Golf Links, CA" },
        { id: "e2", name: "Junior Leadership Invitational", date: "2026-11-20", location: "Bandon Dunes, OR" }
      ],
    },
    {
      name: "First Tee Foundation",
      slug: "first-tee",
      description: "Empowering kids and teens through educational programs that build character and instill life-enhancing values through the game of golf.",
      image_url: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=800&q=80",
      is_featured: true,
      is_active: true,
      events: [
        { id: "e3", name: "Autumn Leadership Summit", date: "2026-11-02", location: "Atlanta, GA" }
      ],
    },
    {
      name: "Adaptive Golf Association",
      slug: "adaptive-golf-association",
      description: "Providing customized instruction, adaptive equipment, and competitive tournaments for individuals with physical and cognitive challenges.",
      image_url: "https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=800&q=80",
      is_featured: false,
      is_active: true,
      events: [
        { id: "e4", name: "Paralympic Hope Invitational", date: "2026-12-05", location: "Scottsdale, AZ" }
      ],
    },
    {
      name: "PGA HOPE",
      slug: "pga-hope",
      description: "Helping Our Patriots Everywhere: introducing golf to active duty military and military veterans to enhance physical and emotional wellbeing.",
      image_url: "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&w=800&q=80",
      is_featured: false,
      is_active: true,
      events: [
        { id: "e5", name: "Veterans Day Cup", date: "2026-11-11", location: "San Diego, CA" }
      ],
    },
    {
      name: "Women in Golf Foundation",
      slug: "women-in-golf-foundation",
      description: "Championing collegiate women golfers and creating pathways to leadership in the professional golf industry.",
      image_url: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=800&q=80",
      is_featured: false,
      is_active: true,
      events: [
        { id: "e6", name: "Collegiate Leadership Invitational", date: "2027-01-20", location: "Pinehurst, NC" }
      ],
    },
    {
      name: "Save the Greens Trust",
      slug: "save-the-greens",
      description: "Restoring natural wetland habitats, promoting zero-chemical turf care, and fostering pollinator sanctuaries across public facilities.",
      image_url: "https://images.unsplash.com/photo-1500932334442-8761ee4810a7?auto=format&fit=crop&w=800&q=80",
      is_featured: false,
      is_active: true,
      events: [
        { id: "e7", name: "Eco-Fairway Stewardship Forum", date: "2027-02-14", location: "Orlando, FL" }
      ],
    },
  ];

  const charityMap = {};
  for (const c of charities) {
    const { data } = await supabase.from("charities").upsert(c, { onConflict: "slug" }).select().single();
    if (data) charityMap[c.slug] = data.id;
  }
  console.log(`  ✓ Synced ${Object.keys(charityMap).length} official charities`);

  // 2. Admin Account
  console.log("\n2. Seeding Platform Administrator...");
  const adminUser = await getOrCreateUser(
    "admin@golvo.test",
    "GolvoAdmin2026!",
    "Golvo Platform Admin",
    "admin"
  );

  // 3. Primary Golfer (user@golvo.test)
  console.log("\n3. Seeding Primary Subscriber Golfer (Jordan Spieth)...");
  const primaryGolfer = await getOrCreateUser(
    "user@golvo.test",
    "GolvoUser2026!",
    "Jordan Spieth (Test)",
    "subscriber"
  );

  // Link primary golfer to Youth on Course with 15%
  await supabase
    .from("profiles")
    .update({ charity_id: charityMap["youth-on-course"], charity_percent: 15 })
    .eq("id", primaryGolfer.id);

  const futurePeriod = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("subscriptions").upsert(
    {
      user_id: primaryGolfer.id,
      stripe_subscription_id: "sub_primary_test_live",
      plan: "monthly",
      status: "active",
      current_period_end: futurePeriod,
      cancel_at_period_end: false,
    },
    { onConflict: "stripe_subscription_id" }
  );

  // 5 verified stableford scores for primary golfer
  const primaryScores = [
    { score: 38, daysAgo: 1 },
    { score: 35, daysAgo: 4 },
    { score: 41, daysAgo: 7 },
    { score: 33, daysAgo: 11 },
    { score: 37, daysAgo: 14 },
  ];
  for (const s of primaryScores) {
    const d = new Date(Date.now() - s.daysAgo * 24 * 60 * 60 * 1000);
    await supabase.from("scores").upsert(
      {
        user_id: primaryGolfer.id,
        score: s.score,
        played_on: d.toISOString().split("T")[0],
      },
      { onConflict: "user_id,played_on" }
    );
  }
  console.log("  ✓ Primary user linked with active subscription and 5 rolling scores");

  // 4. Additional Diverse Test Golfers
  console.log("\n4. Seeding Additional Diverse Platform Golfers...");
  const extraGolfersData = [
    {
      email: "rory.mcilroy@golvo.test",
      password: "GolvoUser2026!",
      name: "Rory McIlroy",
      charitySlug: "first-tee",
      charityPercent: 20,
      subStatus: "active",
      plan: "yearly",
      scores: [42, 39, 44, 38, 40],
    },
    {
      email: "collin.morikawa@golvo.test",
      password: "GolvoUser2026!",
      name: "Collin Morikawa",
      charitySlug: "pga-hope",
      charityPercent: 10,
      subStatus: "active",
      plan: "monthly",
      scores: [36, 37, 39, 34, 42],
    },
    {
      email: "nelly.korda@golvo.test",
      password: "GolvoUser2026!",
      name: "Nelly Korda",
      charitySlug: "women-in-golf-foundation",
      charityPercent: 25,
      subStatus: "active",
      plan: "yearly",
      scores: [43, 41, 45, 39, 40],
    },
    {
      email: "viktor.hovland@golvo.test",
      password: "GolvoUser2026!",
      name: "Viktor Hovland",
      charitySlug: "save-the-greens",
      charityPercent: 12,
      subStatus: "past_due",
      plan: "monthly",
      scores: [33, 31, 35, 38, 36],
    },
    {
      email: "scottie.scheffler@golvo.test",
      password: "GolvoUser2026!",
      name: "Scottie Scheffler",
      charitySlug: "adaptive-golf-association",
      charityPercent: 15,
      subStatus: "active",
      plan: "monthly",
      scores: [44, 42, 45, 41, 43],
    },
  ];

  const extraGolfers = [];
  for (const g of extraGolfersData) {
    const user = await getOrCreateUser(g.email, g.password, g.name, "subscriber");
    extraGolfers.push({ ...g, id: user.id });

    if (charityMap[g.charitySlug]) {
      await supabase
        .from("profiles")
        .update({
          charity_id: charityMap[g.charitySlug],
          charity_percent: g.charityPercent,
        })
        .eq("id", user.id);
    }

    await supabase.from("subscriptions").upsert(
      {
        user_id: user.id,
        stripe_subscription_id: `sub_${g.email.split("@")[0]}_test`,
        plan: g.plan,
        status: g.subStatus,
        current_period_end: futurePeriod,
        cancel_at_period_end: g.subStatus === "canceled",
      },
      { onConflict: "stripe_subscription_id" }
    );

    for (let i = 0; i < g.scores.length; i++) {
      const d = new Date(Date.now() - (i * 3 + 2) * 24 * 60 * 60 * 1000);
      await supabase.from("scores").upsert(
        {
          user_id: user.id,
          score: g.scores[i],
          played_on: d.toISOString().split("T")[0],
        },
        { onConflict: "user_id,played_on" }
      );
    }
  }
  console.log(`  ✓ Synced ${extraGolfers.length} diverse golfers with varying plans & handicaps`);

  // 5. Seed Monthly Draws
  console.log("\n5. Seeding Historical & Live Monthly Draws...");
  const pastMonthDate = new Date();
  pastMonthDate.setMonth(pastMonthDate.getMonth() - 1);
  const pastMonth = pastMonthDate.toISOString().slice(0, 7);

  const curMonth = new Date().toISOString().slice(0, 7);

  const futureMonthDate = new Date();
  futureMonthDate.setMonth(futureMonthDate.getMonth() + 1);
  const futureMonth = futureMonthDate.toISOString().slice(0, 7);

  // Past Published Draw
  const { data: pastDraw } = await supabase.from("draws").upsert(
    {
      month: pastMonth,
      mode: "algorithmic",
      status: "published",
      winning_numbers: [14, 22, 28, 35, 41],
      prize_pool_cents: 1245000,
      jackpot_rollover_cents: 498000,
      published_at: new Date(pastMonthDate.getFullYear(), pastMonthDate.getMonth() + 1, 1).toISOString(),
    },
    { onConflict: "month" }
  ).select().single();

  // Current Simulated Draw
  const { data: curDraw } = await supabase.from("draws").upsert(
    {
      month: curMonth,
      mode: "random",
      status: "simulated",
      winning_numbers: [7, 18, 25, 33, 42],
      prize_pool_cents: 1850000,
      jackpot_rollover_cents: 650000,
    },
    { onConflict: "month" }
  ).select().single();

  // Future Draft Draw
  await supabase.from("draws").upsert(
    {
      month: futureMonth,
      mode: "algorithmic",
      status: "draft",
      winning_numbers: null,
      prize_pool_cents: 500000,
      jackpot_rollover_cents: 0,
    },
    { onConflict: "month" }
  );
  console.log("  ✓ Seeded past published draw, current simulated draw, and future draft draw");

  // 6. Seed Winner Claims
  console.log("\n6. Seeding Winners & Scorecard Audit Workflow...");
  if (pastDraw) {
    const winnerCandidates = [
      {
        user: primaryGolfer,
        tier: "match4",
        prize_cents: 124500, // $1,245.00
        verification_status: "submitted",
        payment_status: "pending",
        proof_url: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=800&q=80",
      },
      {
        user: extraGolfers[0], // Rory
        tier: "match5",
        prize_cents: 622500, // $6,225.00
        verification_status: "approved",
        payment_status: "paid",
        proof_url: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=80",
      },
      {
        user: extraGolfers[2], // Nelly
        tier: "match3",
        prize_cents: 37350, // $373.50
        verification_status: "pending_proof",
        payment_status: "pending",
        proof_url: null,
      },
    ];

    for (const w of winnerCandidates) {
      await supabase.from("winners").upsert(
        {
          draw_id: pastDraw.id,
          user_id: w.user.id,
          tier: w.tier,
          prize_cents: w.prize_cents,
          verification_status: w.verification_status,
          payment_status: w.payment_status,
          proof_url: w.proof_url,
          reviewed_at: w.verification_status === "approved" ? new Date().toISOString() : null,
          paid_at: w.payment_status === "paid" ? new Date().toISOString() : null,
        },
        { onConflict: "id" }
      );
    }
    console.log("  ✓ Seeded realistic winner claim records (Pending Proof, Submitted Audit, Approved Payout)");
  }

  // 7. Seed Real Charity Donations
  console.log("\n7. Seeding Verified Charity Donations...");
  const donations = [
    {
      user_id: primaryGolfer.id,
      charity_id: charityMap["youth-on-course"],
      amount_cents: 5000,
      type: "independent",
      stripe_payment_id: "ch_test_don_1",
    },
    {
      user_id: extraGolfers[0].id,
      charity_id: charityMap["first-tee"],
      amount_cents: 10000,
      type: "independent",
      stripe_payment_id: "ch_test_don_2",
    },
    {
      user_id: extraGolfers[1].id,
      charity_id: charityMap["pga-hope"],
      amount_cents: 2500,
      type: "subscription_share",
      stripe_payment_id: "ch_test_don_3",
    },
    {
      user_id: extraGolfers[2].id,
      charity_id: charityMap["women-in-golf-foundation"],
      amount_cents: 15000,
      type: "independent",
      stripe_payment_id: "ch_test_don_4",
    },
  ];

  for (const d of donations) {
    if (d.charity_id) {
      await supabase.from("donations").insert(d);
    }
  }
  console.log("  ✓ Seeded real donation records across partner non-profits");

  console.log("\n========================================================");
  console.log("⛳ RICH GOLVO PRODUCTION SEED COMPLETED SUCCESSFULLY");
  console.log("========================================================");
  console.log("\nTest accounts available:\n");
  console.log("  1. Admin: admin@golvo.test / GolvoAdmin2026!");
  console.log("  2. Primary Golfer: user@golvo.test / GolvoUser2026! ($1,245 prize claim in audit)");
  console.log("  3. Rory McIlroy: rory.mcilroy@golvo.test / GolvoUser2026! (Approved Match 5 winner)");
  console.log("  4. Nelly Korda: nelly.korda@golvo.test / GolvoUser2026! (Pending proof winner)");
  console.log("========================================================\n");
}

richSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed error:", err);
    process.exit(1);
  });
