import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";
import layoutStyles from "./layout.module.scss";
import "./globals.scss";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const plexSans = localFont({
  src: "./fonts/IBMPlexSans-Bold.woff2",
  weight: "700",
  style: "normal",
  variable: "--font-mark",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hy.C — 陳泓毓",
  description: "陳泓毓個人作品集與介紹",
};

export default function RootLayout({
  children,
  modal,
}: LayoutProps<"/"> & {
  modal: React.ReactNode;
}) {
  return (
    <html
      lang="zh-Hant"
      className={`${inter.variable} ${plexSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full">
        <div className={layoutStyles.siteMain}>
          {children}
          {modal}
        </div>
      </body>
    </html>
  );
}
