import ModeToggle from "@/components/ModeToggle";
import { db } from "@/lib/firebaseAdmin";

// Force le rendu dynamique pour éviter le pré-rendu statique au build
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const fetchCache = "force-no-store";
export const revalidate = 0;

type DailyData = {
  joke: string;
  fact: string;
  sourceUrl: string;
  status: "ok" | "loading" | "error";
};

function getParisDateString(date: Date = new Date()): string {
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

async function getDailyData(
  mode: "general" | "dev",
  dateStr: string
): Promise<DailyData> {
  try {
    const docId = `${dateStr}_${mode}`;
    const docSnap = await db.collection("daily").doc(docId).get();

    if (!docSnap.exists) {
      return {
        joke: "",
        fact: "",
        sourceUrl: "",
        status: "loading",
      };
    }

    const data = docSnap.data()!;
    return {
      joke: data.joke || "",
      fact: data.fact || "",
      sourceUrl: data.sourceUrl || "#",
      status: "ok",
    };
  } catch (error) {
    console.error(`Error fetching daily data for ${mode}:`, error);
    return {
      joke: "",
      fact: "",
      sourceUrl: "",
      status: "error",
    };
  }
}

export default async function HomePage() {
  const dateStr = getParisDateString();
  const [general, dev] = await Promise.all([
    getDailyData("general", dateStr),
    getDailyData("dev", dateStr),
  ]);

  return (
    <main className="page">
      <div className="card">
        <header className="header">
          <h1 className="title">Inutile donc indispensable</h1>
          <p className="subtitle">Édition du {dateStr}</p>
        </header>

        <ModeToggle general={general} dev={dev} />

        <footer className="footer">
          Mis à jour chaque jour à 06:05 (Paris)
        </footer>
      </div>
    </main>
  );
}
