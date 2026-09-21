import { Inter, Caveat } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://golvo.vercel.app"),
  title: {
    default: "Golvo — Golf Performance & Monthly Charity Draws",
    template: "%s | Golvo",
  },
  description:
    "Track your golf handicap, elevate your game with rolling 5-score Stableford analysis, and win monthly prize pools while funding non-profit causes.",
  keywords: [
    "golf handicap",
    "stableford",
    "charity golf",
    "golf draw",
    "prize pool",
    "youth on course",
  ],
  authors: [{ name: "Golvo Team" }],
  openGraph: {
    title: "Golvo — Golf Performance & Monthly Charity Draws",
    description:
      "Play your rounds. Log certified scores. Win monthly jackpot prize pools while giving back to causes you care about.",
    url: "https://golvo.vercel.app",
    siteName: "Golvo",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Golvo — Golf Performance & Monthly Charity Draws",
    description: "Track Stableford scores and enter automated monthly charity jackpot draws.",
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport = {
  themeColor: "#08090A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${caveat.variable} dark`}>
      <body className="font-sans bg-background text-primary min-h-screen flex flex-col antialiased selection:bg-[#5E6AD2]/30 selection:text-white">
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#0F1011",
              color: "#F7F8F8",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              fontSize: "14px",
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
            },
            success: {
              iconTheme: {
                primary: "#4CC38A",
                secondary: "#0F1011",
              },
            },
            error: {
              iconTheme: {
                primary: "#EB5757",
                secondary: "#0F1011",
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
