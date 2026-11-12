import type { Metadata } from "next";
import { Header } from "../components/Header/Header";
import { AppProvider } from "../components/AppProvider";
import { AssistantWidget } from "../components/AssistantWidget";
import { MobileNav } from "../components/MobileNav";
import "./globals.css";

export const metadata: Metadata = {
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
