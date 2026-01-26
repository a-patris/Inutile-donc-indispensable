import OpenAI from "openai";

let client: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }
  client = new OpenAI({ apiKey });
  return client;
}

export type DailyPayload = {
  joke: string;
  fact: string;
  sourceUrl: string;
};

export async function generateDailyPayload(
  mode: "general" | "dev" | "dark",
  recentFacts: string[]
): Promise<DailyPayload> {
  const baseSystemPrompt = [
    "Tu es un générateur de contenu JSON strict.",
    "Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après.",
  ].join(" ");

  const systemPrompt =
    mode === "dark"
      ? [
          baseSystemPrompt,
          "Style attendu: humour noir assumé (macabre léger), plus grinçant.",
          "Interdit: haine, harcèlement, propos discriminatoires, sexualité explicite, gore, violence graphique, suicide ou auto-mutilation.",
          "Ne pas se moquer des handicaps, des maladies ou des tragédies réelles.",
          "OK: ironie noire, fatalisme, absurdité morbide, sans viser des victimes réelles.",
        ].join(" ")
      : [
          baseSystemPrompt,
          "Style attendu: humoristique simple, accessible, assumant les clichés.",
        ].join(" ");
  const dedupeContext = recentFacts.length
    ? `\nÉvite strictement les faits suivants (ne pas reformuler) :\n- ${recentFacts.join(
        "\n- "
      )}\n`
    : "";

  const modeLabel =
    mode === "general" ? "Grand public" : mode === "dev" ? "Développeur (dev)" : "Dark mode";

  const userPrompt = `Mode: ${modeLabel}

Génère :
1. Une blague courte (1-2 phrases max) adaptée au mode.
2. Une information inutile mais vraie (1 phrase).
3. Une URL source valide (doit être un vrai lien) qui confirme l'information.

Contraintes :
- Si mode "general" ou "dev": autorise devinettes simples et clichés.
- Si mode "dark": humour noir plus marqué (macabre léger), sans être choquant.
- Ton: bon enfant, pas de vulgarité.
- Interdit la blague : "Pourquoi les plongeurs plongent-ils toujours en arrière et jamais en avant ? Parce que sinon ils tombent dans le bateau !"
- Évite les blagues qui ne fonctionnent qu'en anglais (jeu de mots intraduisible).
- Les facts "general", "dev" et "dark" du même jour doivent être strictement différentes.
${dedupeContext}

Réponds UNIQUEMENT avec un objet JSON au format exact suivant (sans markdown, sans code block) :
{
  "joke": "la blague ici",
  "fact": "l'info inutile ici",
  "sourceUrl": "https://exemple.com/source"
}

Le champ sourceUrl est OBLIGATOIRE et doit être une URL valide commençant par http:// ou https://.`;

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.8,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  let parsed: DailyPayload;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON from OpenAI: ${error}`);
  }

  if (!parsed.joke || !parsed.fact || !parsed.sourceUrl) {
    throw new Error("Missing required fields in OpenAI response");
  }

  // Validation basique de l'URL
  try {
    new URL(parsed.sourceUrl);
  } catch {
    throw new Error("Invalid sourceUrl format");
  }

  return parsed;
}
