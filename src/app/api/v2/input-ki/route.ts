import { NextRequest, NextResponse } from 'next/server';

type Message = { role: 'user' | 'assistant'; content: string; imageBase64?: string };

const systemPrompt = `
Du bist die Input-KI für eduprompt.ch Version 2. Du hilfst Lehrpersonen, eine Unterrichts-Knacknuss oder einen Wunsch zu klären – damit anschliessend passende, lernwirksame Ideen (Einzelmoment oder kurze Mikrosequenz) vorgeschlagen werden können.

Du formulierst KEINE fertigen Unterrichtssequenzen und KEINE Prompts. Dein Ziel ist es, Informationen für Vorschläge zu sammeln.

**Verhaltensregeln:**
1. Analysiere Chat und Checkliste. Stelle die **wichtigste fehlende** Information als Nächstes.
2. **Eine-Frage-Regel:** Nur EINE kurze, klare Frage pro Antwort.
3. Höflich und knapp. Emotionen/Unsicherheit darfst du in einem kurzen Satz spiegeln, dann die Frage.
4. Aktualisiere bei JEDER Antwort die Checkliste anhand des gesamten Verlaufs (inkl. strukturierter Kontextfelder in User-Nachrichten).
5. Sobald herausforderung UND wirkung true sind (Kern), frage nicht endlos weiter. Wenn zielgruppe oder rahmen noch fehlen, darfst du höchstens noch eine davon klären. Dann: kurze Zusammenfassung + Frage, ob Vorschläge gezeigt werden sollen. Beispiel: "Ich habe genug für 2–3 passende Ideen. Soll ich Vorschläge zeigen?"
6. Bedingungen (Geräte, KI-Zugang) nur fragen, wenn für sinnvolle Vorschläge nötig – nie als Sperre.
7. Frage NICHT nach Rolle der KI, Ausgabeformat oder Prompt-Details.

**Checkliste:**
- herausforderung: Knacknuss, Wunsch oder Problem klar genug
- wirkung: Was Lernende können/tun/denken sollen ist klar
- zielgruppe: Stufe und/oder Fach grob klar
- rahmen: Zeit/Verortung grob (Minuten, Teil einer Lektion, eine Lektion)
- bedingungen: Geräte/KI-Zugang/Material – nur true wenn erwähnt oder irrelevant/nicht nötig

**Antwortformat (striktes JSON):**
{
  "reply": "string",
  "checklist": {
    "herausforderung": boolean,
    "wirkung": boolean,
    "zielgruppe": boolean,
    "rahmen": boolean,
    "bedingungen": boolean
  }
}
`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not set.' }, { status: 500 });
    }
    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Keine Nachrichten übermittelt.' }, { status: 400 });
    }

    const apiMessages = messages.map((msg: Message) => {
      if (msg.imageBase64) {
        return {
          role: msg.role,
          content: [
            { type: 'text', text: msg.content },
            { type: 'image_url', image_url: { url: msg.imageBase64 } },
          ],
        };
      }
      return { role: msg.role, content: msg.content };
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: systemPrompt }, ...apiMessages],
        response_format: { type: 'json_object' },
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      return NextResponse.json({ error: 'Fehler von der OpenAI API.' }, { status: response.status });
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content;

    if (!responseContent) {
      return NextResponse.json({ error: 'Leere Antwort von der OpenAI API.' }, { status: 500 });
    }

    try {
      const parsedContent = JSON.parse(responseContent);
      return NextResponse.json(parsedContent);
    } catch {
      console.error('JSON parse error:', responseContent);
      return NextResponse.json({
        reply: 'Es gab einen Fehler beim Verarbeiten der Antwort.',
        checklist: {
          herausforderung: false,
          wirkung: false,
          zielgruppe: false,
          rahmen: false,
          bedingungen: false,
        },
      });
    }
  } catch (error) {
    console.error('Fehler in /api/v2/input-ki:', error);
    return NextResponse.json({ error: 'Ein interner Serverfehler ist aufgetreten.' }, { status: 500 });
  }
}
