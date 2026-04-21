import type { Metadata } from "next";
import { Nanum_Myeongjo, IBM_Plex_Sans_KR, Gaegu } from "next/font/google";
import "./globals.css";

const nanumMyeongjo = Nanum_Myeongjo({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-serif",
  display: "swap",
});

const ibmPlexSansKr = IBM_Plex_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const gaegu = Gaegu({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-hand-kr",
  display: "swap",
});

export const metadata: Metadata = {
  title: "너의 목소리가 들려 — 참여자 여정",
  description: "8일 동안 이어지는 목소리의 여정. 오늘의 미션을 만나보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${nanumMyeongjo.variable} ${ibmPlexSansKr.variable} ${gaegu.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
