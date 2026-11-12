// Клієнтський помічник для запитів до власного API.
// Кидає Error з українським текстом помилки від сервера.
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: json !== undefined ? { "Content-Type": "application/json", ...rest.headers } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // порожня відповідь
  }
  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error || "Щось пішло не так. Спробуйте ще раз.";
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const { url } = await api<{ url: string }>("/api/uploads", { method: "POST", body: form });
  return url;
}
