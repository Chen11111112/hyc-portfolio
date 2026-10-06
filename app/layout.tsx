import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";
import PageEnter from "@/components/PageEnter/PageEnter";
import layoutStyles from "./layout.module.scss";
import {
  PERSON_NAME,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | Hy.C 陳泓毓`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: PERSON_NAME, url: SITE_URL }],
  creator: PERSON_NAME,
  publisher: PERSON_NAME,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: SITE_URL,
    siteName: "Hy.C — 陳泓毓",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/1.png", alt: "Hy.C 陳泓毓 作品集" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/1.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: PERSON_NAME,
      alternateName: ["Hy.C", "HyC", "HYC", "陳毓", "Hy C"],
      url: SITE_URL,
      jobTitle: "全端工程師",
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Hy.C — 陳泓毓",
      alternateName: ["Hy.C", "HyC", "HYC", "陳泓毓", "陳毓"],
      inLanguage: "zh-Hant",
      publisher: { "@id": `${SITE_URL}/#person` },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className={layoutStyles.siteMain}>
          <PageEnter>
            {children}
            {modal}
          </PageEnter>
        </div>
      </body>
    </html>
  );
}
