import "./globals.css";

export const metadata = {
  title: "Delovni nalogi — Kamnoseštvo Čakš",
  description: "Interno orodje za vodenje delovnih nalogov",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="sl">
      <body>{children}</body>
    </html>
  );
}
