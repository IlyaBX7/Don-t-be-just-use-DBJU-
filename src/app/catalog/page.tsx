import type { Metadata } from "next";
import CatalogClient, { type CatalogFilters } from "./CatalogClient";
import { isCategoryKey } from "../../lib/categories";
import { isISODate } from "../../lib/dates";

export const metadata: Metadata = {
  title: "Каталог — DBJU",
  description: "Усі речі для оренди: фільтри за категорією, ціною, вільними датами та рейтингом власника.",
};

const SORTS = ["new", "cheap", "expensive", "popular", "rating"];

// /catalog?cat=tech&q=gopro&minPrice=100&maxPrice=500&from=2026-11-20&to=2026-11-22&available=1&verified=1&minRating=4&sort=cheap
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const num = (k: string) => (/^\d{1,7}$/.test(str(k)) ? str(k) : "");

  const initial: CatalogFilters = {
    cat: isCategoryKey(str("cat")) ? str("cat") : "all",
    q: str("q").trim().slice(0, 100),
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    from: isISODate(str("from")) ? str("from") : "",
    to: isISODate(str("to")) ? str("to") : "",
    available: str("available") === "1",
    verified: str("verified") === "1",
    minRating: ["3", "4", "5"].includes(str("minRating")) ? str("minRating") : "",
    city: str("city").trim().slice(0, 80),
    sort: SORTS.includes(str("sort")) ? str("sort") : "new",
  };

  return <CatalogClient key={JSON.stringify(initial)} initial={initial} />;
}
