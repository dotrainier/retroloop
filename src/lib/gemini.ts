import { GoogleGenAI } from '@google/genai';
import type { OrganizeResult } from '@/lib/board-types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Free-tier Flash model. If your AI Studio shows a newer one (e.g. gemini-3-flash),
// you can swap this single string — the rest of the code is unchanged.
const MODEL = 'gemini-flash-latest';

export async function organizeNotes(
  notes: { id: string; text: string }[],
): Promise<OrganizeResult> {
  const noteList = notes.map((n) => `- [${n.id}] ${n.text}`).join('\n');

  const prompt = `You are helping a team make sense of a retrospective / brainstorm board.
Below are sticky notes, each prefixed with its id in square brackets.

${noteList}

Group the notes into 2-5 themed clusters. Give each cluster a short, clear label
that fits the actual content (for a retro, labels like "What went well",
"What to improve", or "Action items" often fit; otherwise use topic-based labels).
Every note id must appear in exactly one cluster. Do not invent ids.
Then write a 2-3 sentence summary of the board's key takeaways.

Respond ONLY with JSON in exactly this shape, no markdown:
{
  "summary": "string",
  "clusters": [{ "label": "string", "noteIds": ["id", "id"] }]
}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: 'application/json' }, // ask for raw JSON, not prose
  });

  const raw = response.text ?? '';
  // Defensive: strip any stray code fences before parsing.
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned) as OrganizeResult;
}
