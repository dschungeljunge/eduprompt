import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Eduprompt",
  description: "Vom pädagogischen Ziel zur perfekten KI-Instruktion für den Unterricht.",
  openGraph: {
    title: "Eduprompt",
    description: "Vom pädagogischen Ziel zur perfekten KI-Instruktion für den Unterricht.",
    url: "https://www.eduprompt.ch",
    siteName: "Eduprompt",
    images: [
      {
        url: "https://www.eduprompt.ch/og-image.png", // Muss noch erstellt und hochgeladen werden
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
    description: "Vom pädagogischen Ziel zur perfekten KI-Instruktion für den Unterricht.",
    images: ["https://www.eduprompt.ch/og-image.png"], // Muss noch erstellt und hochgeladen werden
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
