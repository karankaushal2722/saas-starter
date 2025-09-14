// src/app/layout.tsx
export const metadata = {
  title: "SaaS Starter",
  description: "Subscription demo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
