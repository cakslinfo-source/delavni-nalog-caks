import "./globals.css";

export const metadata = {
  title: "Delovni nalogi — Kamnoseštvo Čakš",
  description: "Interno orodje za vodenje delovnih nalogov",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Delovni nalogi",
    statusBarStyle: "black",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
