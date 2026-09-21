# Golvo

> **Golf Performance Tracking & Monthly Charity Jackpot Draws Platform**

Golvo is a web platform connecting golfers with verified Stableford handicap progression, rolling 5-score ticket generation, and automated participation in high-impact monthly jackpot prize draws that fund registered 501(c)(3) charities.

---

## Features

- **Linear-Style Dark Aesthetic**: High-density, minimalist dark UI (`#08090A`), hairline borders, backdrop blur, and pure SVG sparklines.
- **Keyboard-Friendly**: Universal `⌘K` / `Ctrl+K` Command Palette for quick search, navigation, and modal actions.
- **Stableford 5-Score Rolling Engine**: Automatic retention of a golfer's latest 5 verified rounds (1–45) forming their active monthly draw ticket.
- **Monthly Draw Generator**:
  - **Random Mode**: Draws 5 unique numbers (1–45).
  - **Algorithmic Mode**: Weighted by active subscribers' rolling score frequency (`most-frequent` or `least-frequent`).
  - **Prize Pool Distribution**: 40% Match 5 Jackpot (rolls over if unclaimed), 35% Match 4, 25% Match 3.
- **Charity Give-Back**: Configurable 10% to 100% allocation of member subscription fee directed to chosen non-profit partners (e.g. *Youth on Course*, *First Tee*), with support for independent one-time donations.
- **Winner Proof Verification**: Secure scorecard photo upload to private Supabase Storage, temporary signed URL generation for admin audit, approve/reject workflow with feedback, and Stripe payout tracking.
- **Full Admin Console**:
  - **Analytics & Reports**: Platform totals, active subscriber count, charity contribution totals, and SVG prize pool history bar charts.
  - **User Directory**: Search, role management, subscription management, and direct score editing.
  - **Draw Operations**: Simulation preview, payout preview, and one-click publishing.
  - **Charities Manager**: Create, edit, delete, schedule events, and upload media to Supabase Storage bucket `charity-media`.
  - **Winner Claims**: Inspect submitted scorecards via secure signed URLs, approve or reject, and mark payouts completed.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, JavaScript)
- **Styling**: Tailwind CSS v4 (Linear-inspired design system tokens)
- **Database & Auth**: Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Payments & Subscriptions**: Stripe (`stripe`, `@stripe/stripe-js`)
- **Icons & Animation**: Lucide React, Framer Motion
- **Validation & Feedback**: Zod, React Hot Toast

---

## Environment Variables

| Variable Name | Required | Description | Example / Fallback |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project API URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase publishable anonymous key | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase service role secret (server-only) | `sb_secret_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **Yes** | Stripe publishable test/live key | `pk_test_...` |
| `STRIPE_SECRET_KEY` | **Yes** | Stripe secret key (server-only) | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | **Yes** | Signing secret for Stripe webhooks | `whsec_...` |
| `STRIPE_PRICE_MONTHLY` | **Yes** | Stripe Recurring Price ID for $9.99/mo | `price_1UI9vf...` |
| `STRIPE_PRICE_YEARLY` | **Yes** | Stripe Recurring Price ID for $95.88/yr | `price_1UI9vf...` |
| `APP_URL` | Optional | Public application base URL | `https://golvo.vercel.app` or `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Optional | Public application base URL for client | `https://golvo.vercel.app` or `http://localhost:3000` |

---

## Setup Guide

### 1. Database Setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** from the left sidebar in your Supabase project dashboard.
3. Open `supabase/schema.sql` from this repository, paste the entire contents into the SQL Editor, and click **Run**.
   - This provisions all 8 core tables (`profiles`, `charities`, `subscriptions`, `scores`, `donations`, `draws`, `draw_entries`, `winners`).
   - Configures triggers for automatic profile creation on signup and 5-score rolling retention.
   - Applies Row Level Security (RLS) policies and admin helper functions.
4. Go to **Storage** in Supabase and ensure the following buckets exist:
   - `charity-media` (Public bucket for charity partner logos & photos).
   - `winner-proofs` or `scorecard-proofs` (Private bucket for winner scorecards).

### 2. Stripe Configuration

1. Create a free account at [stripe.com](https://stripe.com) and enable **Test Mode**.
2. Run the price provisioning script to automatically create products and prices:
   ```bash
   node scripts/setup-stripe.js
   ```
3. Copy the generated `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY` into `.env.local`.
4. In **Stripe Dashboard > Settings > Customer Portal**, enable:
   - Allow customers to cancel subscriptions.
   - Allow customers to switch plans.
   - Add your business logo and terms of service link.

### 3. Local Webhook Forwarding

Install the [Stripe CLI](https://docs.stripe.com/stripe-cli) and forward events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the printed `whsec_...` secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`.

### 4. Seed Test Data

Run the database seed script to populate sample charities, draws, and pre-configured test users:

```bash
npm run seed
# or: node scripts/seed.js
```

---

## Test Credentials

After running `npm run seed`:

### 1. Platform Administrator
- **Email**: `admin@golvo.test`
- **Password**: `GolvoAdmin2026!`
- **Access**: Full access to `/admin` (Users, Draws, Charities, Winners, Analytics).

### 2. Active Subscriber Golfer
- **Email**: `user@golvo.test`
- **Password**: `GolvoUser2026!`
- **Status**: Active Monthly Subscriber ($9.99/mo).
- **Scores**: 5 verified rounds pre-populated (`38, 35, 41, 33, 37`).
- **Charity**: *Youth on Course* (15% allocated).

---

## Vercel Deployment (Step-by-Step for a New Account)

1. Push this repository to GitHub or GitLab.
2. Sign in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import the `Golvo` repository.
4. In **Configure Project > Environment Variables**, add all keys from the table above:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_MONTHLY`
   - `STRIPE_PRICE_YEARLY`
   - `NEXT_PUBLIC_APP_URL` = `https://<your-project-name>.vercel.app`
   - `APP_URL` = `https://<your-project-name>.vercel.app`
5. Click **Deploy**.
6. In **Stripe Dashboard > Developers > Webhooks**:
   - Add endpoint: `https://<your-project-name>.vercel.app/api/stripe/webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the live endpoint's signing secret and update `STRIPE_WEBHOOK_SECRET` in Vercel project settings.

---

## Verification & QA Checklist (PRD Conformance)

| Feature Area | Verification Procedure | Expected Result | Status |
|---|---|---|---|
| **1. Authentication** | Sign up with email/password; log out; sign in with valid & invalid passwords; trigger password reset. | Profile record auto-created in Supabase; auth tokens stored; redirection to `/dashboard`. | ✅ Verified |
| **2. Subscription Checkout** | Click "Upgrade" on `/pricing` for Monthly ($9.99) or Annual ($95.88). | Stripe Checkout opens with authenticated user prefilled; upon payment, redirects to `/dashboard?checkout=success` and immediately transitions tier pill to active. | ✅ Verified |
| **3. Non-Subscriber Gate** | Visit `/dashboard` or `/dashboard/scores` as unsubscribed user. | Restricted banner displayed; score logging locked with clear upgrade CTA; draw preview accessible without ticket entry. | ✅ Verified |
| **4. 5-Score Rolling Engine** | Log 5 scores (1–45). Add a 6th score on a newer date. | Oldest (5th) score is automatically purged; ticket always maintains exactly the 5 latest rounds. Duplicate dates rejected. | ✅ Verified |
| **5. Charity Give-Back Slider** | Move allocation slider from 10% to 100% on `/dashboard/charity`. Save changes. | Live monthly dollar calculation updates; saved to `profiles.charity_percent`; invoice shares disburse correctly. | ✅ Verified |
| **6. Draw Simulation** | Navigate to `/admin/draws`; choose `random` or `algorithmic`; click "Run Simulation". | 5 balls drawn; user tickets evaluated; Match 5, 4, 3 tier winners and payouts computed; rollover carried forward. | ✅ Verified |
| **7. Draw Publishing** | Click "Publish Official Draw" in Admin. | Results locked, marked `published`; winners created in `winners` table; visible on public and golfer draws history. | ✅ Verified |
| **8. Winner Proof & Audit** | Winner uploads scorecard screenshot in `/winnings`. Admin audits in `/admin/winners`. | Image stored in Supabase Storage; admin views via temporary signed URL; Approve activates payout; Reject prompts reason and allows re-upload. | ✅ Verified |
| **9. Admin Security** | Attempt accessing `/admin` as subscriber. Make GET request to `/api/admin/analytics`. | Access denied screen; API returns `403 Forbidden: Admin privileges required`. | ✅ Verified |
| **10. Responsive & Mobile** | Resize browser to 375px (iPhone SE). Open drawer menu. | Sidebar collapses to drawer with backdrop; top header hamburger triggers smooth overlay; zero horizontal overflow. | ✅ Verified |
| **11. Loading Skeletons** | Navigate between dashboard and admin routes on slow 3G. | Clean pulsing skeleton placeholders (`Skeleton`, `CardSkeleton`, `TableSkeleton`) display without layout shifts. | ✅ Verified |
| **12. Error Boundaries** | Simulate offline error or invalid URL (e.g. `/invalid-route-404`). | Sleek dark 404 page with "Out of Bounds" theme and global error boundary with retry action. | ✅ Verified |

---

## License

Private repository. All rights reserved © 2026 Golvo.
