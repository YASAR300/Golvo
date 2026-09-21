/**
 * Stripe Price Setup Script
 * Creates Product and Recurring Prices in Stripe Test Mode.
 *
 * Usage:
 *   node scripts/setup-stripe.js
 */

const fs = require("fs");
const path = require("path");

// Manually load .env.local if not present in process.env
const envLocalPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      const val = values.join("=").trim().replace(/^["']|["']$/g, "");
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  });
}

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("Error: STRIPE_SECRET_KEY is missing from environment variables.");
  process.exit(1);
}

const Stripe = require("stripe");
const stripe = new Stripe(secretKey, {
  apiVersion: "2024-06-20",
});

async function setupStripe() {
  console.log("Connecting to Stripe (test mode)...");

  try {
    // 1. Create or find Product
    const products = await stripe.products.list({ limit: 10 });
    let product = products.data.find((p) => p.name === "Golvo Golf Subscription");

    if (!product) {
      console.log("Creating product: Golvo Golf Subscription...");
      product = await stripe.products.create({
        name: "Golvo Golf Subscription",
        description:
          "Performance tracking, monthly charity jackpot draws, and 10%+ non-profit donation.",
        active: true,
      });
      console.log(`Product created with ID: ${product.id}`);
    } else {
      console.log(`Found existing product: ${product.id}`);
    }

    // 2. Create Monthly Price ($9.99 / month)
    console.log("Creating Monthly Price ($9.99 / month)...");
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 999, // $9.99 in cents
      currency: "usd",
      recurring: {
        interval: "month",
      },
      metadata: {
        plan: "monthly",
      },
    });
    console.log(`Monthly Price created: ${monthlyPrice.id}`);

    // 3. Create Yearly Price ($95.88 / year ~20% discount)
    console.log("Creating Yearly Price ($95.88 / year)...");
    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 9588, // $95.88 in cents
      currency: "usd",
      recurring: {
        interval: "year",
      },
      metadata: {
        plan: "yearly",
      },
    });
    console.log(`Yearly Price created: ${yearlyPrice.id}`);

    // 4. Update .env.local automatically
    if (fs.existsSync(envLocalPath)) {
      let envContent = fs.readFileSync(envLocalPath, "utf-8");
      envContent = envContent.replace(
        /STRIPE_PRICE_MONTHLY=.*/g,
        `STRIPE_PRICE_MONTHLY=${monthlyPrice.id}`
      );
      envContent = envContent.replace(
        /STRIPE_PRICE_YEARLY=.*/g,
        `STRIPE_PRICE_YEARLY=${yearlyPrice.id}`
      );
      fs.writeFileSync(envLocalPath, envContent, "utf-8");
      console.log(".env.local successfully updated with new price IDs!");
    }

    console.log("\n========================================================");
    console.log("STRIPE SETUP COMPLETED SUCCESSFULLY!");
    console.log("========================================================");
    console.log(`STRIPE_PRICE_MONTHLY=${monthlyPrice.id}`);
    console.log(`STRIPE_PRICE_YEARLY=${yearlyPrice.id}`);
    console.log("========================================================\n");
  } catch (error) {
    console.error("Stripe setup failed:", error.message);
    process.exit(1);
  }
}

setupStripe();
