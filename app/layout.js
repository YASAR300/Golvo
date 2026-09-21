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
  title: "Golvo — Golf Performance & Charity Draws",
  description: "Track your golf handicap, elevate your game, and enter exclusive charity prize draws.",
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
