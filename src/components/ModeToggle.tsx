"use client";

import { useState } from "react";

type DailyData = {
  joke: string;
  fact: string;
  sourceUrl: string;
};

type Props = {
  general: DailyData;
  dev: DailyData;
};

export default function ModeToggle({ general, dev }: Props) {
  const [mode, setMode] = useState<"general" | "dev">("general");
  const data = mode === "general" ? general : dev;

  const handleShare = async () => {
    const text = `${data.joke}\n\n${data.fact}\n\nSource: ${data.sourceUrl}`;
    const url = window.location.href;
    const title = "Inutile donc indispensable";

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // L'utilisateur a annulé le partage
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
        return;
      }
    }

    // Fallback: copier dans le presse-papier
    try {
      await navigator.clipboard.writeText(`${title}\n\n${text}\n\n${url}`);
      alert("Lien copié dans le presse-papier !");
    } catch (err) {
      console.error("Error copying to clipboard:", err);
      alert("Impossible de partager. Veuillez copier manuellement.");
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={() => setMode("general")}
          aria-pressed={mode === "general"}
          style={{
            padding: "8px 16px",
            border: "1px solid #ccc",
            background: mode === "general" ? "#000" : "#fff",
            color: mode === "general" ? "#fff" : "#000",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          Grand public
        </button>
        <button
          onClick={() => setMode("dev")}
          aria-pressed={mode === "dev"}
          style={{
            padding: "8px 16px",
            border: "1px solid #ccc",
            background: mode === "dev" ? "#000" : "#fff",
            color: mode === "dev" ? "#fff" : "#000",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          Mode Dev 🤓
        </button>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "12px" }}>
          Blague du jour
        </h2>
        <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>{data.joke}</p>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "12px" }}>
          Info inutile
        </h2>
        <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>{data.fact}</p>
        <p style={{ marginTop: "8px" }}>
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            style={{ color: "#0066cc", textDecoration: "underline" }}
          >
            Source
          </a>
        </p>
      </div>

      <button
        onClick={handleShare}
        style={{
          padding: "10px 20px",
          background: "#0066cc",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        Partager
      </button>
    </div>
  );
}
