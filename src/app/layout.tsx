import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mirr — See yourself through AI",
  description: "We meten niet alleen of AI je kent. We meten of AI je begrijpt.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className={`${geist.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
