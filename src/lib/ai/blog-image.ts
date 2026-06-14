import { optionalEnv } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { GoogleGenAI } from "@google/genai";

const BUCKET = "blog-images";
const IMAGEN_MODELS = ["imagen-4.0-generate-001", "imagen-3.0-generate-002"] as const;

export interface BlogImageResult {
  url: string;
  alt: string;
  source: "imagen" | "unsplash";
}

async function generateImagenImage(prompt: string): Promise<Buffer | null> {
  const apiKey = optionalEnv("GEMINI_API_KEY");
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  for (const model of IMAGEN_MODELS) {
    try {
      const response = await ai.models.generateImages({
        model,
        prompt,
        config: { numberOfImages: 1 },
      });

      const bytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (bytes) {
        return Buffer.from(bytes, "base64");
      }
    } catch (err) {
      console.warn(`[blog-image] Imagen model ${model} failed:`, err);
    }
  }

  return null;
}

async function fetchUnsplashImage(query: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const accessKey = optionalEnv("UNSPLASH_ACCESS_KEY");
  if (!accessKey) return null;

  try {
    const searchUrl = new URL("https://api.unsplash.com/search/photos");
    searchUrl.searchParams.set("query", query);
    searchUrl.searchParams.set("per_page", "1");
    searchUrl.searchParams.set("orientation", "landscape");

    const searchRes = await fetch(searchUrl.toString(), {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });

    if (!searchRes.ok) return null;

    const searchData = (await searchRes.json()) as {
      results?: { urls?: { regular?: string } }[];
    };
    const imageUrl = searchData.results?.[0]?.urls?.regular;
    if (!imageUrl) return null;

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) return null;

    const mimeType = imageRes.headers.get("content-type") ?? "image/jpeg";
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    return { buffer, mimeType };
  } catch (err) {
    console.warn("[blog-image] Unsplash fallback failed:", err);
    return null;
  }
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("png")) return "png";
  return "jpg";
}

async function uploadToStorage(
  slug: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string | null> {
  const supabase = createAdminClient();
  const ext = extensionForMime(mimeType);
  const path = `${slug}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimeType,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    console.error("[blog-image] Upload failed:", error.message);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function resolveBlogFeaturedImage(input: {
  slug: string;
  imagePrompt: string;
  alt: string;
  searchQuery: string;
}): Promise<BlogImageResult | null> {
  let buffer: Buffer | null = await generateImagenImage(input.imagePrompt);
  let mimeType = "image/png";
  let source: BlogImageResult["source"] = "imagen";

  if (!buffer) {
    const unsplash = await fetchUnsplashImage(input.searchQuery);
    if (!unsplash) return null;
    buffer = unsplash.buffer;
    mimeType = unsplash.mimeType;
    source = "unsplash";
  }

  const url = await uploadToStorage(input.slug, buffer, mimeType);
  if (!url) return null;

  return { url, alt: input.alt, source };
}
