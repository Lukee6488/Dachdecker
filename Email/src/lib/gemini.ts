import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EmailMessage } from "./gmail";

const CATEGORIES = [
  "Neueindeckung",
  "Sanierung / Reparatur",
  "Flachdach / Abdichtung",
  "Dachausbau / Dachgauben",
  "Dachrinne / Entwässerung",
  "Sturmschaden / Notfall",
  "Sonstiges / Beratung",
] as const;

export type Category = (typeof CATEGORIES)[number];

function getModel() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

export async function classifyEmail(subject: string, body: string): Promise<Category> {
  const model = getModel();

  const prompt = `Du bist ein Assistent für eine Dachdeckerfirma (Güldenarm GmbH, Warendorf).
Klassifiziere die folgende E-Mail in GENAU EINE der folgenden Kategorien:
${CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join("\n")}

E-Mail Betreff: ${subject}
E-Mail Text: ${body.slice(0, 1500)}

Antworte NUR mit dem exakten Kategorienamen, ohne Erklärung.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const matched = CATEGORIES.find(
    (c) => c.toLowerCase() === text.toLowerCase() || text.toLowerCase().includes(c.toLowerCase())
  );

  return matched ?? "Sonstiges / Beratung";
}

export async function generateReply(email: EmailMessage, category: Category): Promise<string> {
  const model = getModel();

  const prompt = `Du bist der Kundenservice von Güldenarm GmbH, einem Dachdeckerbetrieb in Warendorf.
Schreibe eine professionelle, freundliche Antwort-E-Mail auf Deutsch.

Absender: ${email.senderName} (${email.senderEmail})
Betreff: ${email.subject}
Kategorie: ${category}
Nachricht des Kunden:
${email.body.slice(0, 2000)}

Regeln:
- Sieze den Kunden (Sie/Ihnen)
- Bestätige den Eingang der Anfrage
- Erkläre kurz, dass wir uns melden werden (ggf. für eine Besichtigung oder ein Angebot)
- Bei "Sturmschaden / Notfall": weise auf mögliche Soforthilfe hin
- Schreibe maximal 150 Wörter
- Kein Betreff, nur der E-Mail-Text
- Unterschrift: "Mit freundlichen Grüßen\nGüldenarm GmbH\nDachdeckermeisterbetrieb\nTel: [Telefon]\nWarendorf"`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
