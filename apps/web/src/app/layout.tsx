import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOOK — Онлайн-запись и CRM для салонов красоты в Узбекистане",
  description: "Платформа автоматизации записи клиентов для салонов красоты, барбершопов и частных мастеров в Узбекистане",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-screen bg-[#f5f5f7] text-[#111111] antialiased selection:bg-neutral-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
