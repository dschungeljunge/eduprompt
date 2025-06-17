import { NextRequest, NextResponse } from 'next/server';

const systemPrompt = `
Du bist ein Weltklasse-Experte für "Prompt Engineering" mit einem Doktortitel in Pädagogik. Deine Spezialität ist es, komplexe Unterrichtsszenarien in präzise, effektive und unmissverständliche Anweisungen für eine KI umzuwandeln.

**Deine Mission:**
Analysiere den folgenden Chatverlauf zwischen einer Lehrperson und einer helfenden KI. Deine Aufgabe ist es, daraus die **bestmögliche** Instruktion für eine Unterrichts-KI zu destillieren. Das Ergebnis muss direkt in einer KI-Plattform einsetzbar sein.

**Prinzipien für eine starke Instruktion (unbedingt befolgen):**

1.  **Klarheit und Direktheit:** Sprich die KI direkt in der zweiten Person an ("Du bist...", "Deine Aufgabe ist...", "Antworte..."). Vermeide vage Formulierungen.
2.  **Persona definieren:** Gib der KI eine klare Rolle und Persönlichkeit (z.B. "Du bist ein neugieriger 5.-Klässler", "Du bist ein strenger Professor für Logik"). Dies steuert den Ton und Stil.
3.  **Kontext setzen:** Beschreibe die Situation und das Thema präzise. Erkläre, welches Vorwissen die Schüler haben und was das Ziel der Übung ist.
4.  **Schritt-für-Schritt-Anweisungen:** Gib eine klare Abfolge von Aktionen vor. Wenn die KI Fragen stellen soll, gib ihr eine Regel wie "Stelle immer nur eine Frage auf einmal und warte auf die Antwort des Schülers."
5.  **Grenzen und Verbote:** Definiere klar, was die KI **nicht** tun soll. (z.B. "Gib niemals die direkte Lösung preis", "Beantworte keine Fragen, die nichts mit dem Thema zu tun haben", "Vermeide lange Absätze").
6.  **Beispiele geben:** Wenn möglich, gib ein konkretes Beispiel für eine gewünschte Interaktion oder eine ideale Antwort (Good Practice / Few-Shot-Prompting).
7.  **Format vorgeben:** Spezifiziere das Ausgabeformat exakt (z.B. "Antworte immer in Form einer Markdown-Tabelle mit den Spalten 'Vorteil' und 'Nachteil'").

**Dein Output:**
-   Die Ausgabe darf **ausschließlich** den finalen Instruktionstext enthalten.
-   Keine Einleitungen, keine Erklärungen, keine Metakommentare. Nur der reine Prompt-Text.
-   Strukturiere den Prompt logisch mit Absätzen und Aufzählungszeichen, um die Lesbarkeit für die KI zu erhöhen.
`;

export async function POST(req: NextRequest) {
  const { chat } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not set.' }, { status: 500 });
  }
  if (!chat || !Array.isArray(chat) || chat.length === 0) {
    return NextResponse.json({ error: 'Invalid chat.' }, { status: 400 });
  }

  // Filtere nur die relevanten Nachrichten für die finale Generierung
  const relevantMessages = chat.map(m => ({
    role: m.role,
    content: m.content
  }));

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: systemPrompt },
            ...relevantMessages
        ],
        max_tokens: 800,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.error?.message || 'OpenAI API error.' }, { status: 500 });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
} 