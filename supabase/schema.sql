-- ==============================================================================
-- GOLVO DATABASE SCHEMA
-- Golf Performance + Charity Draw Subscription Platform
-- ==============================================================================

-- Enable standard UUID generator extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. CHARITIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  events JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. PROFILES TABLE
-- References auth.users created by Supabase Auth
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  charity_id UUID REFERENCES public.charities(id) ON DELETE SET NULL,
  charity_percent INT NOT NULL DEFAULT 10 CHECK (charity_percent >= 10 AND charity_percent <= 100),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. SUBSCRIPTIONS TABLE
-- Tracks Stripe subscription lifecycle per golfer
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'past_due', 'canceled', 'lapsed')),
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. SCORES TABLE
-- Keeps user golf scores (1 to 45). Enforces uniqueness per day.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score >= 1 AND score <= 45),
  played_on DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_played_on UNIQUE (user_id, played_on)
);

-- ------------------------------------------------------------------------------
-- 5. DONATIONS TABLE
-- Tracks non-profit charity distribution
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  charity_id UUID NOT NULL REFERENCES public.charities(id) ON DELETE CASCADE,
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  type TEXT NOT NULL CHECK (type IN ('subscription_share', 'independent')),
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. DRAWS TABLE
-- Monthly charity draws with 5 winning numbers (1-45)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL UNIQUE, -- Format: YYYY-MM
  mode TEXT NOT NULL CHECK (mode IN ('random', 'algorithmic')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'simulated', 'published')),
  winning_numbers INT[] CHECK (
    winning_numbers IS NULL OR (
      array_length(winning_numbers, 1) = 5
    )
  ),
  prize_pool_cents INT NOT NULL DEFAULT 0,
  jackpot_rollover_cents INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. DRAW ENTRIES TABLE
-- Golfer draw snapshot entries matching winning numbers
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.draw_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scores_snapshot INT[] NOT NULL,
  match_count INT NOT NULL DEFAULT 0,
  tier TEXT NOT NULL CHECK (tier IN ('match5', 'match4', 'match3', 'none')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_draw_user UNIQUE (draw_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 8. WINNERS TABLE
-- Prize claims and verification workflow
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('match5', 'match4', 'match3')),
  prize_cents INT NOT NULL,
  proof_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending_proof' CHECK (
    verification_status IN ('pending_proof', 'submitted', 'approved', 'rejected')
  ),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'paid')
  ),
  reviewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- INDEXES
-- Optimized for user lookups, active draws, and date sorting
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_played_on ON public.scores(played_on DESC);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_charity_id ON public.donations(charity_id);
CREATE INDEX IF NOT EXISTS idx_draws_month ON public.draws(month);
CREATE INDEX IF NOT EXISTS idx_draw_entries_draw_id ON public.draw_entries(draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_user_id ON public.draw_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_draw_id ON public.winners(draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_user_id ON public.winners(user_id);

-- ------------------------------------------------------------------------------
-- TRIGGER 1: Auto-create profiles row on auth.users insert
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    'subscriber'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = CASE 
      WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = '' 
      THEN EXCLUDED.full_name 
      ELSE public.profiles.full_name 
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- TRIGGER 2: Retain ONLY the latest 5 scores per user
-- Deletes the oldest scores by played_on when a user exceeds 5 recorded scores
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_five_scores_retention()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.scores
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id
      FROM public.scores
      WHERE user_id = NEW.user_id
      ORDER BY played_on DESC, created_at DESC
      LIMIT 5
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_five_scores ON public.scores;
CREATE TRIGGER trg_enforce_five_scores
  AFTER INSERT ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.enforce_five_scores_retention();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) & HELPER FUNCTIONS
-- ==============================================================================

-- Admin helper function (Security Definer)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES: PROFILES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own profile or admins view all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update their own profile or admins update all"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert their profile or admins insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS POLICIES: CHARITIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Active charities are readable by all users"
  ON public.charities FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins have full write access to charities"
  ON public.charities FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS POLICIES: SUBSCRIPTIONS
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own subscriptions or admins view all"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins have full write access to subscriptions"
  ON public.subscriptions FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS POLICIES: SCORES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own scores or admins view all"
  ON public.scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert their own scores"
  ON public.scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores"
  ON public.scores FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scores or admins delete"
  ON public.scores FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS POLICIES: DONATIONS
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own donations or admins view all"
  ON public.donations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins have full write access to donations"
  ON public.donations FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS POLICIES: DRAWS
-- ------------------------------------------------------------------------------
CREATE POLICY "Published draws are readable by everyone"
  ON public.draws FOR SELECT
  TO anon, authenticated
  USING (status = 'published' OR public.is_admin());

CREATE POLICY "Admins have full write access to draws"
  ON public.draws FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS POLICIES: DRAW ENTRIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own draw entries or admins view all"
  ON public.draw_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert their own draw entries"
  ON public.draw_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins have full write access to draw entries"
  ON public.draw_entries FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS POLICIES: WINNERS
-- ------------------------------------------------------------------------------
CREATE POLICY "Approved winners are readable by all or users see own winnings"
  ON public.winners FOR SELECT
  TO anon, authenticated
  USING (verification_status = 'approved' OR auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Winners can update their own proof submission"
  ON public.winners FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins have full write access to winners"
  ON public.winners FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- STORAGE BUCKET: winner-proofs
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'winner-proofs',
  'winner-proofs',
  FALSE,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Users can upload their own winner proof into their user folder
CREATE POLICY "Users can upload their own winner proof"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'winner-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: Users can view their own proof or admins can view all
CREATE POLICY "Users can view their own winner proof or admins view all"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'winner-proofs' AND
    ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

-- Storage RLS: Admins have full access to manage winner proofs
CREATE POLICY "Admins have full access to winner proofs"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'winner-proofs' AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'winner-proofs' AND public.is_admin()
  );

-- ==============================================================================
-- SAMPLE SEED DATA: 6 CHARITIES (1 FEATURED)
-- ==============================================================================
INSERT INTO public.charities (name, slug, description, image_url, is_featured, is_active, events)
VALUES
  (
    'Youth on Course',
    'youth-on-course',
    'Subsidizing rounds of golf for young players nationwide for $5 or less, removing socio-economic barriers to play.',
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=800&q=80',
    TRUE,
    TRUE,
    '[{"name": "National Junior Championship", "date": "2026-10-15", "location": "Pebble Beach"}]'::jsonb
  ),
  (
    'First Tee Foundation',
    'first-tee',
    'Empowering kids and teens through educational programs that build character and instill life-enhancing values through the game of golf.',
    'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=800&q=80',
    FALSE,
    TRUE,
    '[{"name": "Autumn Leadership Summit", "date": "2026-11-02", "location": "Atlanta, GA"}]'::jsonb
  ),
  (
    'Adaptive Golf Association',
    'adaptive-golf-association',
    'Providing customized instruction, adaptive equipment, and competitive tournaments for individuals with physical and cognitive challenges.',
    'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=800&q=80',
    FALSE,
    TRUE,
    '[{"name": "Paralympic Hope Invitational", "date": "2026-12-05", "location": "Scottsdale, AZ"}]'::jsonb
  ),
  (
    'PGA HOPE',
    'pga-hope',
    'Helping Our Patriots Everywhere: introducing golf to active duty military and military veterans to enhance physical, mental, and emotional wellbeing.',
    'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&w=800&q=80',
    FALSE,
    TRUE,
    '[{"name": "Veterans Day Cup", "date": "2026-11-11", "location": "San Diego, CA"}]'::jsonb
  ),
  (
    'Women in Golf Foundation',
    'women-in-golf-foundation',
    'Championing collegiate women golfers and creating pathways to leadership in the professional golf industry through development initiatives.',
    'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=800&q=80',
    FALSE,
    TRUE,
    '[{"name": "Collegiate Leadership Invitational", "date": "2027-01-20", "location": "Pinehurst, NC"}]'::jsonb
  ),
  (
    'Save the Greens Trust',
    'save-the-greens',
    'Restoring natural wetland habitats, promoting zero-chemical turf care, and fostering pollinator sanctuaries across public golf facilities.',
    'https://images.unsplash.com/photo-1500932334442-8761ee4810a7?auto=format&fit=crop&w=800&q=80',
    FALSE,
    TRUE,
    '[{"name": "Eco-Fairway Stewardship Forum", "date": "2027-02-14", "location": "Orlando, FL"}]'::jsonb
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  is_featured = EXCLUDED.is_featured,
  is_active = EXCLUDED.is_active,
  events = EXCLUDED.events;
