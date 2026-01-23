import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { generateDailyPayload } from "@/lib/openai";

function getParisDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function ensureDailyDoc(
  mode: "general" | "dev",
  dateStr: string
): Promise<{ id: string; created: boolean }> {
  const docId = `${dateStr}_${mode}`;
  const docRef = db.collection("daily").doc(docId);

  // Vérifier si le document existe déjà
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    return { id: docId, created: false };
  }

  // Générer le contenu avec retry si sourceUrl manquante
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const payload = await generateDailyPayload(mode);

      // Double vérification que sourceUrl existe
      if (!payload.sourceUrl) {
        throw new Error("sourceUrl is missing from OpenAI response");
      }

      await docRef.set({
        date: dateStr,
        mode,
        joke: payload.joke,
        fact: payload.fact,
        sourceUrl: payload.sourceUrl,
        createdAt: new Date(),
      });

      return { id: docId, created: true };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Si c'est le dernier essai, on lance l'erreur
      if (attempt === 2) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error("Failed to generate daily payload");
}

export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get("X-CRON-SECRET");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (!cronSecret || cronSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dateStr = getParisDateString();

    const [generalResult, devResult] = await Promise.all([
      ensureDailyDoc("general", dateStr),
      ensureDailyDoc("dev", dateStr),
    ]);

    return NextResponse.json({
      success: true,
      date: dateStr,
      results: {
        general: generalResult,
        dev: devResult,
      },
    });
  } catch (error) {
    console.error("Error generating daily content:", error);
    return NextResponse.json(
      {
        error: "Failed to generate daily content",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
