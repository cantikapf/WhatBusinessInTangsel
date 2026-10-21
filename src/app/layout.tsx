import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WhatBusinessInTangsel — Studi Kasus Analisis Lokasi Usaha",
  description:
    "Bantu calon pengusaha melihat seberapa ramai sebuah sektor usaha di tiap kecamatan Kota Tangerang Selatan, supaya tidak membuka usaha di pasar yang sudah penuh. Indeks relatif, bukan penilaian kelayakan usaha.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={plusJakartaSans.className}>{children}</body>
    </html>
  );
}
