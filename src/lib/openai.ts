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
  mode: "general" | "dev",
  recentFacts: string[]
): Promise<DailyPayload> {
  const systemPrompt = [
    "Tu es un générateur de contenu JSON strict.",
    "Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après.",
    "Style attendu: humoristique simple, accessible, assumant les clichés.",
  ].join(" ");

  const dedupeContext = recentFacts.length
    ? `\nÉvite strictement les faits suivants (ne pas reformuler) :\n- ${recentFacts.join(
        "\n- "
      )}\n`
    : "";

  const userPrompt = `Mode: ${
    mode === "general" ? "Grand public" : "Développeur (dev)"
  }

Génère :
1. Une blague courte (1-2 phrases max), volontairement simple, avec jeux de mots évidents ou clichés assumés.
2. Une information inutile mais vraie (1 phrase), même si elle est assez évidente.
3. Une URL source valide (doit être un vrai lien) qui confirme l'information.

Contraintes :
- Autorise les devinettes simples (type "Pourquoi... ? Parce que...").
- Autorise les jeux de mots faciles et les clichés.
- Ton: bon enfant, pas de vulgarité.
- Interdit la blague : "Pourquoi les plongeurs plongent-ils toujours en arrière et jamais en avant ? Parce que sinon ils tombent dans le bateau !"
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
