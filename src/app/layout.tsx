import type { Metadata } from "next";
import { Header } from "../components/Header/Header";
import { AppProvider } from "../components/AppProvider";
import { AssistantWidget } from "../components/AssistantWidget";
import { MobileNav } from "../components/MobileNav";
import "./globals.css";

// Адреса сайту (наприклад https://dbju.com.ua) — для посилань у превʼю соцмереж
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: "DBJU — Don't Buy, Just Use | Оренда речей між людьми",
  description: "Орендуй потрібні речі на день, тиждень чи місяць — і заробляй на тих, що лежать удома без діла.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>
        <AppProvider>
          <Header />
          {children}
          <AssistantWidget />
          <MobileNav />
        </AppProvider>
      </body>
    </html>
  );
}
