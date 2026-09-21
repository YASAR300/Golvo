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
└── public/                # Static assets
```

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
