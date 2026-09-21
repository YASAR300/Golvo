import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/utils/url";

/**
 * POST /api/donations
 * Creates a one-time Stripe Checkout Session for independent charity donations (mode: "payment").
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json().catch(() => ({}));
    const { charityId, amountDollars } = body;

    const amount = parseFloat(amountDollars);
    if (!amount || isNaN(amount) || amount < 1) {
      return NextResponse.json(
        { error: "Minimum donation amount is $1.00" },
        { status: 400 }
      );
    }

    if (!charityId) {
      return NextResponse.json({ error: "Missing charity ID" }, { status: 400 });
    }

    // Verify charity exists
    const { data: charity, error: chErr } = await adminClient
      .from("charities")
      .select("id, name, slug")
      .eq("id", charityId)
      .single();

    if (chErr || !charity) {
      return NextResponse.json({ error: "Charity not found" }, { status: 404 });
    }

    const amountCents = Math.round(amount * 100);
    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: user?.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Independent Donation — ${charity.name}`,
              description: `100% direct charitable donation to ${charity.name} via Golvo.`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "independent",
        charity_id: charity.id,
        user_id: user?.id || "anonymous",
      },
      success_url: `${appUrl}/charities/${charity.slug}?donation=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/charities/${charity.slug}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Donation checkout session error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create donation session" },
      { status: 500 }
    );
  }
}
