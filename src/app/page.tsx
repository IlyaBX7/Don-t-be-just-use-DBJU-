import HomeClient from "./HomeClient";
import { isCategoryKey } from "../lib/categories";

// Категорія та пошук беруться з адреси: /?cat=tech&q=gopro
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cat = isCategoryKey(params.cat) ? params.cat : "all";
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  return <HomeClient key={`${cat}|${q}`} initialCategory={cat} initialQuery={q} />;
}
