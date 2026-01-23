import ModeToggle from "@/components/ModeToggle";
import WhyButton from "@/components/WhyButton";
import { db } from "@/lib/firebaseAdmin";

function getParisDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function getDailyData(
  mode: "general" | "dev",
  dateStr: string
): Promise<{ joke: string; fact: string; sourceUrl: string }> {
  const docId = `${dateStr}_${mode}`;
  const docSnap = await db.collection("daily").doc(docId).get();

  if (!docSnap.exists) {
    return {
      joke: "En cours de génération...",
      fact: "En cours de génération...",
      sourceUrl: "#",
    };
  }

  const data = docSnap.data()!;
  return {
    joke: data.joke || "",
    fact: data.fact || "",
    sourceUrl: data.sourceUrl || "#",
  };
}

export default async function HomePage() {
  const dateStr = getParisDateString();
  const [general, dev] = await Promise.all([
    getDailyData("general", dateStr),
    getDailyData("dev", dateStr),
  ]);

  return (
    <main
      style={{
        maxWidth: "720px",
        margin: "40px auto",
        padding: "16px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>
        Inutile donc indispensable
      </h1>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        Édition du {dateStr}
      </p>

      <ModeToggle general={general} dev={dev} />

      <WhyButton />
    </main>
  );
}
