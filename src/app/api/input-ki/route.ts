import { NextRequest, NextResponse } from 'next/server';
import { createChatCompletion, TOKEN_BUDGET } from '@/lib/openai';

type Message = { role: 'user' | 'assistant'; content: string; imageBase64?: string };

// System-Prompt für die Input-KI, angepasst für OpenAI mit JSON-Modus
const systemPrompt = `
Du bist eine hochspezialisierte "Input-KI" für das Tool "eduprompt.ch". Deine einzige Mission ist es, Lehrpersonen durch einen strukturierten Dialog zu einer perfekten KI-Instruktion zu führen. Du bist präzise, effizient und folgst deinen Anweisungen exakt.

**Deine Verhaltensregeln sind absolut und nicht verhandelbar:**

1.  **FOKUSSIERTER DIALOG:** Deine Hauptaufgabe ist es, fehlende Informationen zu sammeln. Analysiere den bisherigen Chat und die Checkliste. Identifiziere die **wichtigste** Information, die als Nächstes fehlt.
2.  **DIE EINE-FRAGE-REGEL:** Du darfst **IMMER NUR EINE EINZIGE FRAGE** pro Antwort stellen. Stelle niemals zwei Fragen auf einmal. Deine Frage muss kurz, klar und direkt sein.
    *   Schlecht: "Was ist das Thema und für welche Klasse ist es?"
    *   Gut: "Für welche Klassenstufe ist der Unterricht gedacht?"
3.  **KEIN SMALLTALK:** Jedes Wort zählt. Sei höflich, aber komme sofort zum Punkt. Fülle deine Antworten nicht mit unnötigen Floskeln.
4.  **CHECKLISTEN-PFLICHT:** Aktualisiere bei **JEDER** Antwort den Status der Checkliste basierend auf dem **GESAMTEN** Gesprächsverlauf.
5.  **ABSCHLUSS DES DIALOGS:** Sobald alle Checklisten-Punkte auf \`true\` stehen, stelle keine weiteren Fragen. Formuliere stattdessen eine kurze Zusammenfassung der gesammelten Punkte und frage die Lehrperson, ob sie bereit ist, die finale Instruktion zu generieren. Deine Antwort könnte so aussehen: "Alle wichtigen Punkte sind abgedeckt. Sollen wir jetzt die Instruktion generieren?"

Checklisten-Punkte (Schlüssel und Beschreibung):
- **thema**: Das allgemeine Thema, die Aufgabe oder die zu analysierende Ressource ist klar.
- **zielgruppe**: Die Klassenstufe oder die spezifische Zielgruppe der Schüler ist definiert.
- **rolleKi**: Die Rolle oder Persona, welche die KI einnehmen soll (z.B. Tutor, Debattenpartner, Kritiker), ist beschrieben.
- **ausgabeformat**: Das gewünschte Format der KI-Antwort (z.B. Liste, Tabelle, Fließtext, Code) ist spezifiziert.
- **lerneffekt**: Das pädagogische Ziel oder der konkrete Lerneffekt, der erzielt werden soll, ist klar.
- **material**: Unterrichtsmaterialien (z.B. aus einem hochgeladenen PDF) wurden bereitgestellt und in den Kontext einbezogen.

**Antwortformat (striktes JSON):**
Deine Antwort muss IMMER ein valides JSON-Objekt sein, das genau diese Struktur hat:
{
  "reply": "string",
  "checklist": {
    "thema": boolean,
    "zielgruppe": boolean,
    "rolleKi": boolean,
    "ausgabeformat": boolean,
    "lerneffekt": boolean,
    "material": boolean
  }
}
`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Keine Nachrichten übermittelt.' }, { status: 400 });
    }

    // Transform messages for OpenAI API, especially for images
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

    const result = await createChatCompletion({
      messages: [{ role: 'system', content: systemPrompt }, ...apiMessages],
      maxCompletionTokens: TOKEN_BUDGET.inputKi,
      json: true,
    });

    if (!result.ok) {
      if (result.errorText === 'OpenAI API key not set.') {
        return NextResponse.json({ error: result.errorText }, { status: 500 });
      }
      console.error('OpenAI API Error:', result.errorText);
      return NextResponse.json({ error: 'Fehler von der OpenAI API.' }, { status: result.status });
    }

    const responseContent = result.content;
    if (!responseContent) {
      return NextResponse.json({ error: 'Leere Antwort von der OpenAI API.' }, { status: 500 });
    }

    try {
      const parsedContent = JSON.parse(responseContent);
      return NextResponse.json(parsedContent);
    } catch {
      console.error('Fehler beim Parsen der JSON-Antwort von OpenAI:', responseContent);
      return NextResponse.json({
        reply: 'Es gab einen Fehler beim Verarbeiten der Antwort. Bitte versuchen Sie es erneut.',
        checklist: {
          thema: false,
          zielgruppe: false,
          rolleKi: false,
          ausgabeformat: false,
          lerneffekt: false,
          material: false,
        },
      });
    }
  } catch (error) {
    console.error('Fehler in /api/input-ki:', error);
    return NextResponse.json({ error: 'Ein interner Serverfehler ist aufgetreten.' }, { status: 500 });
  }
}
