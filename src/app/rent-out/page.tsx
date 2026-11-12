import RentOutClient from "./RentOutClient";
import { isCategoryKey } from "../../lib/categories";

// /rent-out — нове оголошення (?category=pets — з обраною категорією), /rent-out?edit=<id> — редагування
export default async function RentOutPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { edit, category } = await searchParams;
  const editId = typeof edit === "string" && edit ? edit : null;
  const initialCategory = isCategoryKey(category) ? category : "repair";
  return <RentOutClient key={editId ?? `new-${initialCategory}`} editId={editId} initialCategory={initialCategory} />;
}
