import type { Metadata } from "next";
import { Nanum_Myeongjo, IBM_Plex_Sans_KR, Gaegu, Caveat } from "next/font/google";
import "./globals.css";

const nanumMyeongjo = Nanum_Myeongjo({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-serif",
  display: "swap",
});

const ibmPlexSansKr = IBM_Plex_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const gaegu = Gaegu({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-hand-kr",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-hand-en",
  display: "swap",
});

export const metadata: Metadata = {
  title: "너의 목소리가 들려 · Socially",
  description: "익명 전화로 만나는 소울메이트 매칭 실험",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${nanumMyeongjo.variable} ${ibmPlexSansKr.variable} ${gaegu.variable} ${caveat.variable}`}
    >
      <body style={{ background: "var(--cream)" }}>{children}</body>
    </html>
  );
}
