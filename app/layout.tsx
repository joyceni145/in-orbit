import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const interfaceFont = Inter({ subsets: ["latin"], variable: "--font-interface", display: "swap" });
const editorial = localFont({
  src: "./fonts/DTNightingale-Light.otf",
  variable: "--font-editorial",
  display: "swap",
  weight: "300",
  style: "normal",
});

export const metadata: Metadata = {
  title: "In Orbit — A personal library",
  description: "A constellation of things I read, save, revisit, and keep coming back to.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${editorial.variable} ${interfaceFont.variable}`}>{children}</body></html>;
}
