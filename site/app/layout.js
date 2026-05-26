import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://portaldot-pdk.vercel.app"),
  title: "pdk — Portaldot Dev Kit",
  description:
    "A developer toolkit for the Portaldot blockchain. FailLens turns cryptic transaction failures into clear, actionable diagnoses — with fixes.",
  icons: { icon: "/logo.png" },
  openGraph: {
    type: "website",
    url: "https://portaldot-pdk.vercel.app",
    title: "pdk — Portaldot Dev Kit",
    description:
      "FailLens turns cryptic Portaldot transaction failures into clear, actionable diagnoses — live, as failures happen.",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary",
    title: "pdk — Portaldot Dev Kit",
    description:
      "FailLens turns cryptic Portaldot transaction failures into clear, actionable diagnoses.",
    images: ["/logo.png"],
  },
};

export const viewport = {
  themeColor: "#0a0c10",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Progressive enhancement: if JS is off, scroll-reveal never fires —
            keep all content visible. */}
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
