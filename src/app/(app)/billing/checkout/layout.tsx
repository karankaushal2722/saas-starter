// src/app/billing/checkout/layout.tsx
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section style={{ maxWidth: 680, margin: "40px auto" }}>{children}</section>;
}
