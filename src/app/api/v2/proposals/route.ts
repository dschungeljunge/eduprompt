import { NextRequest, NextResponse } from 'next/server';

const systemPrompt = `
Du bist didaktische Beratungs-KI für eduprompt.ch V2. Aus dem Chat einer Lehrperson erzeugst du genau 2 oder 3 Vorschläge für den Unterricht – kontrollierte Alternativen zur SELBEN Knacknuss, keine Ideenlotterie.

**Passungsregel:** Jeder Vorschlag muss den zentralen Wunsch/die Knacknuss treffen und einen Satz "fitsBecause" haben. Kein Vorschlag, der nur thematisch verwandt ist.

**Alternativen-Matrix (typisch):**
- Vorschlag A: Enger Treffer (oft Mikrosequenz 2–4 Schritte)
- Vorschlag B: Variante derselben Logik (kürzer, strengere KI-Grenzen, andere Intensität)
- Vorschlag C (wenn sinnvoll): Echte Alternative, oft Strategie 0 ohne KI oder mit deutlich weniger KI

**Leitplanken:**
- Punktuell: eine Lektion, max. zwei – keine Wochenprojekte
- Schritte ohne KI sind erwünscht, wo sie Offloading mindern
- KI nur wo nötig; Schritte klar benannt
- Outputs von KI-Schritten sollen Folgeschritte speisen (artifactOut / feedsInto)
- kind "ai" oder "human" pro Schritt; Prompts NOCH NICHT ausformulieren (nur Skizze)

**Strategien:** 0 = ohne KI, 1 = selbstbestimmte KI-Nutzung, 2 = KI-Lernaufgabe (KI führt)

**Antwortformat (striktes JSON):**
{
  "proposals": [
    {
      "id": "string-kurz",
      "title": "string",
      "fitsBecause": "string (ohne die Worte Passt weil am Anfang)",
      "duration": "z.B. ca. 45 Min.",
      "strategy": "0|1|2",
      "steps": [
        {
          "number": 1,
          "title": "string",
          "kind": "human" | "ai",
          "summary": "Was Lernende tun (ein Satz)",
          "artifactOut": "optional",
          "feedsInto": null oder Nummer des Folgeschritts
        }
      ]
    }
  ]
}
`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not set.' }, { status: 500 });
    }
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Kein Chatverlauf.' }, { status: 400 });
    }

    const chatText = messages
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Lehrperson' : 'Assistent'}: ${m.content}`)
      .join('\n\n');

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
          {
            role: 'user',
            content: `Erzeuge 2–3 passende Vorschläge aus diesem Dialog:\n\n${chatText}`,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      return NextResponse.json({ error: 'Fehler von der OpenAI API.' }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Leere Antwort.' }, { status: 500 });
    }

    const parsed = JSON.parse(content);
    if (!parsed.proposals || !Array.isArray(parsed.proposals)) {
      return NextResponse.json({ error: 'Ungültiges Vorschlagsformat.' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Fehler in /api/v2/proposals:', error);
    return NextResponse.json({ error: 'Ein interner Serverfehler ist aufgetreten.' }, { status: 500 });
  }
}
