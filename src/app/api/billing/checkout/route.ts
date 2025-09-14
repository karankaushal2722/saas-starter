const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("host")}`;

const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  // ... your customer / line_items, etc.
  success_url: `${appUrl}/billing/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url:  `${appUrl}/billing/checkout/cancel`,
});
