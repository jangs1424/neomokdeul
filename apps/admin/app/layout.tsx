import type { Metadata } from "next";
import { Nanum_Myeongjo, IBM_Plex_Sans_KR } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Socially · Admin",
  description: "너목들 호스트 어드민 대시보드",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${nanumMyeongjo.variable} ${ibmPlexSansKr.variable}`}>
      <body>{children}</body>
    </html>
  );
}
