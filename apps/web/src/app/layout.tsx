import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dikidi UZ - Онлайн-запись и CRM для услуг в Узбекистане",
  description: "Платформа автоматизации записи клиентов для салонов красоты, барбершопов и частных мастеров в Узбекистане",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
