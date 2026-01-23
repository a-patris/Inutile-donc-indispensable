"use client";

import { useMemo, useState } from "react";

type Props = {
  mode: "general" | "dev";
};

const COPY = {
  general:
    "Parce qu’une blague et une info inutile suffisent parfois à améliorer la journée.",
  dev:
    "Parce qu’un fait inutile et un clin d’œil tech peuvent rendre le quotidien plus léger.",
};

export default function WhyButton({ mode }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const content = useMemo(() => COPY[mode], [mode]);

  return (
    <div className="whyWrap">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="whyButton"
      >
        Pourquoi ce site existe ? <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
      </button>
      <div
        className={`whyPanel ${isOpen ? "open" : ""}`}
        aria-hidden={!isOpen}
      >
        <p className="whyText">{content}</p>
      </div>
    </div>
  );
}
