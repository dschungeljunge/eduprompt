import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import "./eduprompt.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-v3-display",
});

const sans = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-v3-sans",
});

export const metadata: Metadata = {
  title: "Eduprompt",
  description: "Von der Unterrichtsknacknuss zum KI-Lernaufgabenset.",
  openGraph: {
    title: "Eduprompt",
    description: "Von der Unterrichtsknacknuss zum KI-Lernaufgabenset.",
    url: "https://www.eduprompt.ch",
    siteName: "Eduprompt",
    images: [
      {
        url: "https://www.eduprompt.ch/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "de_CH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eduprompt",
    description: "Von der Unterrichtsknacknuss zum KI-Lernaufgabenset.",
    images: ["https://www.eduprompt.ch/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
