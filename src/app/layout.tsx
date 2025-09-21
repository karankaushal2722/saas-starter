import "./globals.css";

export const metadata = {
  title: "SaaS Starter",
  description: "Starter app"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
