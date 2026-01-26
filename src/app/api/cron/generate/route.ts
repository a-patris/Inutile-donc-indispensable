import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { generateDailyPayload } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getParisDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function ensureDailyDoc(
  mode: "general" | "dev" | "dark",
  dateStr: string,
  recentFacts: string[]
): Promise<{ id: string; created: boolean; fact: string }> {
  const docId = `${dateStr}_${mode}`;
  const docRef = db.collection("daily").doc(docId);

  // Vérifier si le document existe déjà
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    const data = docSnap.data();
    return { id: docId, created: false, fact: (data?.fact as string) || "" };
  }

  // Générer le contenu avec retry si sourceUrl manquante
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const payload = await generateDailyPayload(mode, recentFacts);

      // Double vérification que sourceUrl existe
      if (!payload.sourceUrl) {
        throw new Error("sourceUrl is missing from OpenAI response");
      }

      const normalizedFact = payload.fact.trim().toLowerCase();
      const recentNormalized = new Set(
        recentFacts.map((fact) => fact.trim().toLowerCase())
      );
      if (recentNormalized.has(normalizedFact)) {
        throw new Error("Duplicate fact detected");
      }

      await docRef.set({
        date: dateStr,
        mode,
        joke: payload.joke,
        fact: payload.fact,
        sourceUrl: payload.sourceUrl,
        createdAt: new Date(),
      });

      return { id: docId, created: true, fact: payload.fact };
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

function getAuthSecret(request: NextRequest) {
  const headerSecret = request.headers.get("X-CRON-SECRET");
  if (headerSecret) return headerSecret;

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return null;
  return token || null;
}

async function getRecentFacts(
  mode: "general" | "dev" | "dark",
  limit = 14
) {
  const snapshot = await db
    .collection("daily")
    .where("mode", "==", mode)
    .orderBy("date", "desc")
    .limit(limit)
    .get();

  return snapshot.docs
    .map((doc) => doc.data()?.fact)
    .filter(
      (fact): fact is string =>
        typeof fact === "string" && fact.trim().length > 0
    );
}

async function handleCron(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = getAuthSecret(request);

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (!providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dateStr = getParisDateString();
    const [generalFacts, devFacts, darkFacts] = await Promise.all([
      getRecentFacts("general"),
      getRecentFacts("dev"),
      getRecentFacts("dark"),
    ]);
    const combinedFacts = Array.from(
      new Set([...generalFacts, ...devFacts, ...darkFacts])
    );

    const generalResult = await ensureDailyDoc(
      "general",
      dateStr,
      combinedFacts
    );
    const devResult = await ensureDailyDoc("dev", dateStr, [
      ...combinedFacts,
      generalResult.fact,
    ]);
    const darkResult = await ensureDailyDoc("dark", dateStr, [
      ...combinedFacts,
      generalResult.fact,
      devResult.fact,
    ]);

    return NextResponse.json({
      success: true,
      date: dateStr,
      results: {
        general: generalResult,
        dev: devResult,
        dark: darkResult,
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

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}
