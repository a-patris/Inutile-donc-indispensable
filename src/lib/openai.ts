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
  mode: "general" | "dev"
): Promise<DailyPayload> {
  const systemPrompt = `Tu es un générateur de contenu JSON strict. Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après.`;

  const userPrompt = `Mode: ${mode === "general" ? "Grand public" : "Développeur (dev)"}

Génère :
1. Une blague courte (1-2 phrases maximum)
2. Une information inutile mais vraie (1 phrase)
3. Une URL source valide pour l'information (doit être un vrai lien)

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
