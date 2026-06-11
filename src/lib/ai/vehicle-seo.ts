import { optionalEnv } from "@/lib/config";
import { GoogleGenAI, Type, Schema } from "@google/genai";

export async function generateVehicleAutofill(input: {
  make: string;
  model: string;
  year: number;
}): Promise<{
  title: string;
  category: string;
  transmission: string;
  fuel: string;
  seats: number;
  description: string;
}> {
  const apiKey = optionalEnv("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("AI content generation is not configured. Set GEMINI_API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an expert Australian automotive cataloging system.
Analyze the following vehicle:
Year: ${input.year}
Make: ${input.make}
Model: ${input.model}

Provide the standard factory specifications for this vehicle, and write a compelling 2-paragraph SEO-friendly vehicle rental description for it available for hire in Australia. Tone: professional, trustworthy, Australian English. No bullet points. Max 120 words.
Return the data exactly matching the requested JSON schema.`;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "An attractive SEO-friendly listing title, e.g. '2023 Toyota RAV4 Hybrid (AWD)'",
      },
      category: {
        type: Type.STRING,
        description: "The vehicle category",
        enum: ["Sedan", "SUV", "People mover", "Van", "Ute", "Luxury"],
      },
      transmission: {
        type: Type.STRING,
        description: "The transmission type",
        enum: ["Automatic", "Manual"],
      },
      fuel: {
        type: Type.STRING,
        description: "The fuel type",
        enum: ["Petrol", "Diesel", "Hybrid", "Electric"],
      },
      seats: {
        type: Type.INTEGER,
        description: "Standard seating capacity (e.g. 2, 5, 7, 8)",
      },
      description: {
        type: Type.STRING,
        description: "The 2-paragraph SEO description",
      },
    },
    required: ["title", "category", "transmission", "fuel", "seats", "description"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2, // Low temperature for deterministic, factual outputs
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (!response.text) {
      throw new Error("AI returned empty content.");
    }

    const data = JSON.parse(response.text);
    
    // Additional runtime validation to ensure required fields exist
    if (!data.title || !data.category || !data.transmission || !data.fuel || !data.seats || !data.description) {
      throw new Error("AI returned incomplete data structure.");
    }

    return data;
  } catch (err) {
    console.error("[Gemini API Error]:", err);
    throw new Error(err instanceof Error ? err.message : "Failed to generate vehicle specifications via AI.");
  }
}
