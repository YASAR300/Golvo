# Golvo

> **Golf Performance + Charity Draw Subscription Platform**

Golvo connects golfers to elite performance tracking, handicap progression, and automated entries into high-impact charity prize draws.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, JavaScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Linear-inspired dark design system)
- **Database & Auth**: [Supabase](https://supabase.com/) (`@supabase/supabase-js`, `@supabase/ssr`)
- **Payments & Subscriptions**: [Stripe](https://stripe.com/) (`stripe`, `@stripe/stripe-js`)
- **Animation & Icons**: [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/)
- **Validation & Feedback**: [Zod](https://zod.dev/), [React Hot Toast](https://react-hot-toast.com/)

---

## Project Structure

```text
├── app/
│   ├── (marketing)/       # Public marketing pages & landing experience
│   ├── (auth)/            # Sign in, register, and password recovery
│   ├── (dashboard)/       # Golfer dashboard & handicap tracking
│   │   └── dashboard/
│   ├── (admin)/           # Charity draws & subscriber management
│   │   └── admin/
│   ├── api/               # Next.js Route Handlers & Stripe webhooks
│   ├── globals.css        # Linear-inspired dark tokens & utilities
│   └── layout.js          # Root layout with Inter & Caveat typography
├── components/
│   ├── ui/                # Core reusable UI library (Button, Modal, Card...)
│   ├── doodles/           # Handwritten accents & annotation badges
│   ├── marketing/         # Landing page hero, pricing, feature sections
│   └── dashboard/         # Performance widgets, draw cards, activity logs
├── lib/
│   ├── supabase/          # Supabase client & server session helpers
│   ├── stripe/            # Stripe SDK & subscription helpers
│   ├── utils/             # Styling & format utilities
│   └── validators/        # Zod validation schemas
├── supabase/
│   └── schema.sql         # PostgreSQL schema, RLS, triggers & charity seed
└── public/                # Static assets
```

---

## Database Setup

### 1. Execute SQL Schema in Supabase

1. Open your [Supabase Project Dashboard](https://app.supabase.com/).
2. Navigate to **SQL Editor** from the left navigation panel.
3. Click **New Query**, copy the entire contents of [`supabase/schema.sql`](supabase/schema.sql), and paste them into the editor.
4. Click **Run** to execute the query.

This script configures:
- **8 core tables**: `profiles`, `charities`, `subscriptions`, `scores`, `donations`, `draws`, `draw_entries`, `winners`.
- **Automatic profile trigger**: creates a profile entry whenever a user signs up through Supabase Auth.
- **5-Score retention rule**: automatically purges older scores to keep strictly the 5 latest rounds per golfer.
- **Row Level Security (RLS)**: locks down data with fine-grained access policies and the `is_admin()` security definer function.
- **Storage Bucket (`winner-proofs`)**: sets up private storage and user folder isolation for score verification uploads.
- **Seed Data**: creates 6 realistic golf charity organizations with 1 featured charity (*Youth on Course*).

### 2. Promote a User to Admin

By default, new sign-ups are assigned the `'subscriber'` role. To grant administrator privileges to a user:

1. Have the user sign up or create an account via Supabase Auth.
2. In the Supabase SQL Editor, run:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

3. Confirm role update:

```sql
SELECT id, email, full_name, role FROM public.profiles WHERE role = 'admin';
```

Once promoted, the user will have unrestricted access to `/admin` routes and administrative APIs.

---

## Getting Started

### 1. Prerequisites

- Node.js `20.x` or later
- npm or yarn

### 2. Environment Configuration

Copy the example environment file and fill in your keys:

```bash
cp .env.example .env.local
```

Required keys:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

- `npm run dev`: Launch local development server
- `npm run build`: Compile production build
- `npm run start`: Start production server
- `npm run lint`: Run ESLint checks
