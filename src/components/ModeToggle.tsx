"use client";

import { useState } from "react";
import WhyButton from "@/components/WhyButton";

type DailyData = {
  joke: string;
  fact: string;
  sourceUrl: string;
  status: "ok" | "loading" | "error";
};

type Props = {
  general: DailyData;
  dev: DailyData;
};

export default function ModeToggle({ general, dev }: Props) {
  const [mode, setMode] = useState<"general" | "dev">("general");
  const data = mode === "general" ? general : dev;
  const isReady = data.status === "ok" && data.joke && data.fact;
  const statusMessage =
    data.status === "error"
      ? "Impossible de charger pour l’instant."
      : "Contenu en cours de préparation…";

  const handleShare = async () => {
    if (!isReady) return;
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
      <div className="segmented">
        <button
          onClick={() => setMode("general")}
          aria-pressed={mode === "general"}
          className={`segmentedButton ${mode === "general" ? "segmentedButtonActive" : ""
            }`}
        >
          Grand public
        </button>
        <button
          onClick={() => setMode("dev")}
          aria-pressed={mode === "dev"}
          className={`segmentedButton ${mode === "dev" ? "segmentedButtonActive" : ""
            }`}
        >
          Mode Dev 🤓
        </button>
      </div>

      {!isReady ? (
        <div className="skeletonWrap">
          <div className="section">
            <div className="skeletonTitle" />
            <div className="skeletonLine" />
            <div className="skeletonLine short" />
          </div>
          <div className="section">
            <div className="skeletonTitle" />
            <div className="skeletonLine" />
            <div className="skeletonLine short" />
          </div>
          <p className="statusMessage">{statusMessage}</p>
        </div>
      ) : (
        <>
          <div className="section">
            <h2 className="sectionTitle">Blague du jour</h2>
            <p className="sectionText">{data.joke}</p>
          </div>

          <div className="section">
            <h2 className="sectionTitle">Info inutile</h2>
            <p className="sectionText">{data.fact}</p>
            <p className="sourceWrap">
              {/* <a
                href={data.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="sourceLink"
              > */}
              Source moi-même 🤓
              {/* </a> */}
            </p>
          </div>
        </>
      )}

      <div className="actions">
        <button
          onClick={handleShare}
          className="shareButton"
          disabled={!isReady}
        >
          Partager
        </button>
      </div>

      <WhyButton mode={mode} />
    </div>
  );
}
