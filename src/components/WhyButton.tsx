"use client";

import { useState } from "react";

export default function WhyButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid #eee" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        style={{
          padding: "8px 16px",
          background: "transparent",
          border: "1px solid #ccc",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.9rem",
        }}
      >
        Pourquoi ce site existe ? {isOpen ? "−" : "+"}
      </button>
      {isOpen && (
        <p
          style={{
            marginTop: "12px",
            padding: "12px",
            background: "#f5f5f5",
            borderRadius: "4px",
            lineHeight: "1.6",
          }}
        >
          Parce que parfois, une blague et un fait inutile suffisent à améliorer
          la journée. Parce que le savoir inutile est le plus précieux. Parce
          que rire et apprendre ne devraient jamais être optionnels.
        </p>
      )}
    </div>
  );
}
