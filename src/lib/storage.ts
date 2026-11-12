import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { UPLOAD_DIR } from "./uploads";

// Сховище фотографій. Драйвер обирається змінними оточення:
//   STORAGE_DRIVER=s3  — будь-яке S3-сумісне сховище (Cloudflare R2, AWS S3, Backblaze B2, Supabase…)
//   інакше             — локальна папка <проєкт>/uploads
// Посилання в БД однакові для обох драйверів: /api/uploads/<ім'я>.

export interface Storage {
  readonly name: "local" | "s3";
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  remove(key: string): Promise<void>;
}

class LocalStorage implements Storage {
  readonly name = "local" as const;

  private file(key: string) {
    return path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, key);
  }

  async put(key: string, data: Buffer) {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(this.file(key), data);
  }

  async get(key: string) {
    try {
      return await readFile(this.file(key));
    } catch {
      return null;
    }
  }

  async remove(key: string) {
    await unlink(this.file(key)).catch(() => {});
  }
}

class S3Storage implements Storage {
  readonly name = "s3" as const;
  private client: S3Client;
  private bucket: string;
  private prefix: string;

  constructor() {
    const required = ["S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"] as const;
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length) {
      throw new Error(`STORAGE_DRIVER=s3, але не задано: ${missing.join(", ")}`);
    }
    this.bucket = process.env.S3_BUCKET!;
    this.prefix = (process.env.S3_PREFIX ?? "uploads/").replace(/^\/+/, "");
    this.client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT || undefined, // порожньо = AWS S3
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }

  private key(key: string) {
    return this.prefix + key;
  }

  async put(key: string, data: Buffer, contentType: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.key(key),
        Body: data,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  }

  async get(key: string) {
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: this.key(key) }));
      if (!res.Body) return null;
      return Buffer.from(await res.Body.transformToByteArray());
    } catch (err) {
      if (err instanceof NoSuchKey || (err as { name?: string }).name === "NoSuchKey") return null;
      throw err;
    }
  }

  async remove(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: this.key(key) }));
  }
}

const globalForStorage = globalThis as unknown as { dbjuStorage?: Storage };

export function getStorage(): Storage {
  if (!globalForStorage.dbjuStorage) {
    globalForStorage.dbjuStorage = process.env.STORAGE_DRIVER === "s3" ? new S3Storage() : new LocalStorage();
  }
  return globalForStorage.dbjuStorage;
}
