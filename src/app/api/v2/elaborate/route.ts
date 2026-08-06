import { NextRequest, NextResponse } from 'next/server';
import { createChatCompletion, TOKEN_BUDGET } from '@/lib/openai';

const systemPrompt = `
Du arbeitest für eduprompt.ch V2. Die Lehrperson hat einen Vorschlag gewählt. Du arbeitest ihn zu einer flachen Unterrichtsskizze aus und formulierst **einsatzbereite, robuste Prompts** nur für KI-Schritte.

**Unterrichtsskizze (alle Schritte):**
- Behalte die gewählte Schrittlogik bei.
- artifactOut / feedsInto setzen, wenn ein Übergang existiert.
- kind "human": prompt, contextHint, functionsHint, boundaries = null.

**summary – je nach Schritttyp:**
- **kind "human" (vor/nach KI):** Gehaltvoller didaktischer Kommentar, **3–4 Sätze**. Nicht nur "Lernende tun X", sondern auch **warum** dieser Schritt wirkungsvoll ist (z. B. eigene Texte → Relevanz, Ownership, Transfer; Peer-Austausch → soziale Verarbeitung des KI-Outputs). Konkrete Handlungsanweisung + Begründung.
- **kind "ai":** 1–2 Sätze, was Lernende mit der KI tun (die Tiefe steckt im Prompt und den Hinweisen).

**Beispiel human (Qualität):** Nicht "Die Schüler:innen wählen einen Text." Sondern z. B. Begründung, warum eigene Texte Motivation und Fehlerbewusstsein stärken, und was konkret zu tun ist.

**Prompt-Qualität (kind "ai") – PFLICHT, nicht knapper Einzeiler:**
Ein Prompt muss so vollständig sein, dass Lernende oder Lehrperson ihn direkt in ChatGPT/Claude o. ä. kopieren und zuverlässig nutzen können. Orientier dich an starkem Prompt Engineering + Pädagogik:

1. Rolle/Persona in Du-Form ("Du bist …")
2. Ziel und Situation (Stufe/Fach aus dem Dialog, was Lernende gerade tun)
3. Konkrete Arbeitsweise: Schritte, Fragerhythmus, Antwortstruktur
4. Explizite Grenzen / Verbote (keine Fertiglösung, kein Umschreiben des ganzen Texts, Fokus nur auf das Lernziel – gegen Cognitive Offloading)
5. Wenn Folgeschritt existiert: erweiterte Funktion mit klarem Output-Format (z. B. nach X Runden: Kurzzusammenfassung / 3 Stärken + 3 Fragen), das Schritt n+1 speist
6. Optional: kurzes Beispiel für gewünschtes Verhalten

**Länge:** Typisch 150–400 Wörter pro KI-Prompt. Ein Satz wie "Überprüfe die Kommasetzung…" ist **unzulässig**. Lieber etwas ausführlicher als zu dünn.

**Didaktische Hinweise (nur KI-Schritte) – ausführlich genug zum Handeln:**
- contextHint: 2–4 Sätze oder Stichpunkte – was der Prompt/Kontext noch braucht (Niveau, Auftrag, Material, dass der Text von Lernenden stammt, Kriterien).
- functionsHint: 2–3 Sätze – welche erweiterte Funktion eingebaut ist und wie der Output im Folgeschritt genutzt wird.
- boundaries: 2–3 Sätze oder klare Aufzählung – was die KI bewusst nicht darf und warum (lernwirksam).

Die UI zeigt Hinweise kompakt; der Inhalt darf trotzdem gehaltvoll sein (mehrere Sätze, mit " · " oder Zeilenumbrüchen im String).

**Nicht:** Wochenprojekte, Essays zur Didaktik-Theorie, leere Floskeln.

**Antwortformat (striktes JSON):**
{
  "title": "string",
  "duration": "string",
  "fitsBecause": "string",
  "steps": [
    {
      "id": "s1",
      "number": 1,
      "title": "string",
      "kind": "human" | "ai",
      "summary": "string",
      "artifactOut": "string oder null",
      "feedsInto": number oder null,
      "prompt": "string oder null",
      "contextHint": "string oder null",
      "functionsHint": "string oder null",
      "boundaries": "string oder null"
    }
  ]
}
`;

export async function POST(req: NextRequest) {
  try {
    const { messages, proposal } = await req.json();

    if (!proposal) {
      return NextResponse.json({ error: 'Kein Vorschlag.' }, { status: 400 });
    }

    const chatText = Array.isArray(messages)
      ? messages
          .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Lehrperson' : 'Assistent'}: ${m.content}`)
          .join('\n\n')
      : '';

    const result = await createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Dialog-Kontext:\n${chatText}\n\nGewählter Vorschlag (JSON):\n${JSON.stringify(proposal, null, 2)}\n\nArbeite diesen Vorschlag aus.
- Jeden KI-Prompt vollständig und einsatzbereit (nicht als Einzeiler).
- Kontext-, Funktions- und Grenzen-Hinweise gehaltvoll.
- Bei Schritten ohne KI (vor/nach der KI): summary als didaktischer Kommentar mit 3–4 Sätzen inkl. Begründung der Wirkung.`,
        },
      ],
      maxCompletionTokens: TOKEN_BUDGET.elaborate,
      json: true,
    });

    if (!result.ok) {
      if (result.errorText === 'OpenAI API key not set.') {
        return NextResponse.json({ error: result.errorText }, { status: 500 });
      }
      console.error('OpenAI API Error:', result.errorText);
      return NextResponse.json({ error: 'Fehler von der OpenAI API.' }, { status: result.status });
    }

    const content = result.content;
    if (!content) {
      return NextResponse.json({ error: 'Leere Antwort.' }, { status: 500 });
    }

    const parsed = JSON.parse(content);
    if (!parsed.steps || !Array.isArray(parsed.steps)) {
      return NextResponse.json({ error: 'Ungültiges Ausarbeitungsformat.' }, { status: 500 });
    }

    parsed.steps = parsed.steps.map(
      (s: { id?: string; number: number }, i: number) => ({
        ...s,
        id: s.id || `s${s.number || i + 1}`,
      })
    );

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Fehler in /api/v2/elaborate:', error);
    return NextResponse.json({ error: 'Ein interner Serverfehler ist aufgetreten.' }, { status: 500 });
  }
}
