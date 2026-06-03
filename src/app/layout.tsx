import type { Metadata, Viewport } from "next";
import { PwaPrompts } from "@/components/PwaPrompts";
import { Toaster } from "@/components/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "IV Medicatie Verdeler",
  description:
    "Verdeel IV-medicijnen veilig over infuuslumens op basis van Y-site compatibiliteit",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IV Medicatie",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-512.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('thema');
                  if (t === 'donker' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen">
        {children}
        <Toaster />
        <PwaPrompts />
      </body>
    </html>
  );
}
