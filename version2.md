# Eduprompt Version 2 – Konzept

## 1. Produktversprechen

Eduprompt V2 hilft Lehrpersonen, **unterrichtsnah und lernwirksam** zu klären: *Was könnte in meiner nächsten Stunde sinnvoll passieren – und wo braucht es dafür einen Prompt?*

Lösungen sind oft **nicht nur ein isolierter KI-Moment**, sondern eine **kurze Folge von wenigen aufeinander aufbauenden Lernaufgaben** (Mikrosequenz), in der KI nur an der Stelle vorkommt, wo sie lernwirksam ist.

Kernverschiebung gegenüber V1:

| | Version 1 | Version 2 |
|---|---|---|
| Einstieg | „Was soll die KI tun?“ (Lösung schon gedacht) | „Was ist meine Herausforderung / mein Wunsch?“ (Problemraum offen) |
| Rolle des Tools | Prompt-Formulierungshelfer | Didaktische Kurzberatung + ggf. Prompt(s) |
| Fokus | Gute Instruktion schreiben | Erst: lohnt sich KI hier? Dann: welcher Einsatz / welche kurze Aufgabenfolge? Dann: Prompt(s) |
| Output | Kopierbarer Prompt | Vorschlagspaket: Sinn + Schrittfolge (Scan) + Prompt(s)/Ebenen (Detail), Übergänge zwischen Schritten |

Tagline-Richtung (Arbeitstitel):  
**„Von der Unterrichtsknacknuss zur lernwirksamen Aufgaben-Skizze – in wenigen Minuten.“**

---

## 2. Nutzungssituation (entscheidend für das Design)

### Primäre Situation: Unterrichtsplanung, situativ und niederschwellig

Das Tool ist für Momente ausgelegt, in denen Unterricht **geplant oder feinjustiert** wird – typisch:

- am Morgen vor der ersten Lektion
- in der Pause zwischen Stunden
- kurz vor dem Einstieg in ein Thema
- beim Nachbereiten einer Stunde, in der etwas „nicht geklappt“ hat

**Anforderungen an diese Situation:**

- **Schnell:** Zielhorizont oft 3–10 Minuten, nicht 45 Minuten Workshop.
- **Situativ:** Bezogen auf *diese* Klasse, *dieses* Thema, *heute/morgen*.
- **Niederschwellig:** Kein Pflichtformular, kein Fachjargon-Zwang, Start mit einem Satz möglich.
- **Robust gegen Unschärfe:** Vage Ideen, Unsicherheit, Frustration, „irgendwie hakt es“ sind gültige Inputs – nicht Fehlerzustände.
- **Gefühle und Reflexion erlaubt:** „Ich bin genervt, dass niemand mitmacht“, „Ich habe Angst, dass sie nur abschreiben“, „Mir fehlt die Idee für den Einstieg“ – das Tool nimmt das ernst und übersetzt es in didaktische Optionen.

### Lösungseinheit: in sich geschlossen und sinnvoll

Entscheidend ist **nicht**, ob das Tool eher Einzelmomente oder Sequenzen vorschlägt – sondern dass jede Lösung **in sich geschlossen** ist und für die geäusserte Knacknuss **einen klaren Sinn** ergibt.

Zwei gültige Formen (gleichwertig):

1. **Einzelmoment** – eine klar begrenzte Intervention (z. B. 10–15 Min. Tutor, Simulation, Feedback-Slot).  
2. **Mikrosequenz** – **wenige** (typisch **2–4**) **aneinanderhängende Lernaufgaben**, die aufeinander aufbauen und gemeinsam eine Herausforderung lösen. KI ist oft nur in *einem* Schritt zentral; die anderen Schritte sind ohne KI (Schreiben, Austausch, Transfer).

**Sinn-Test für jede Lösung:** Kann die Lehrperson in wenigen Sekunden sagen: *Was sollen Lernende am Ende dieses Blocks können / getan haben – und warum hängt das zusammen?* Wenn nein, ist die Skizze zu lose oder zu gross.

**Beispiel-Logik (illustrativ, nicht Idealrezept):**

| Aufgabe | Was Lernende tun | Rolle der KI | Übergang / Output |
|---|---|---|---|
| 1 | Eigenen Text schreiben | keine | Text als Artefakt |
| 2 | Text mit KI überarbeiten / Feedback einholen | Prompt + ggf. erweiterte Funktionen | z. B. Feedback-Zusammenfassung |
| 3 | In Gruppen Erkenntnisse austauschen | keine | nutzt Output aus Schritt 2 |

So wird sichtbar: Ein gutes Feedback-Prompt allein reicht oft nicht – ohne vorgelagertes Schreiben und nachgelagerte soziale Verarbeitung fehlt der Lernbogen. Und: **Outputs der KI** (Feedback, Zusammenfassung, offene Fragen) sollen im Folgeschritt **weiterverarbeitet** werden – nicht als Sackgasse enden.

**Leitplanken:**

- In sich geschlossen und morgen-tauglich (typisch **eine, max. zwei Lektionen**).  
- Wenige Schritte, klar benannt, mit grober Zeitangabe und erkennbarem **Übergang** zwischen den Schritten.  
- Prompts nur wo KI wirklich vorkommt; Features (Ebene 3) so wählen, dass sie den **nächsten Schritt speisen**.  
- Die Sequenz ist eine **Skizze zur Planung**, kein ausformuliertes Arbeitsblatt-Paket.

### Was das Tool bewusst *nicht* ist

Eduprompt V2 ist **nicht** gedacht für:

- den Aufbau grosser Lernumgebungen über Wochen
- lange Stationenarbeit, komplette Projektwochen, Curriculum-Redesign
- Materialgeneratoren für ganze Unterrichtsreihen

Wenn die Lehrperson etwas Umfangreiches beschreibt, soll das Tool **herunterbrechen** auf: *Was ist die kleinste sinnvolle Mikrosequenz oder der eine Einstiegsmoment für heute/morgen?*

---

## 3. Anschluss an den Workshop-Input (Kanti Aarau / KI@Alti)

Das Konzept baut auf denselben Leitgedanken auf wie der Workshop „Lernprozesse mit KI“:

### 3.1 Lernwirksamkeit vor Prompt-Schreiben

Bezug: Studien-Narrativ GPT Base vs. GPT Tutor – ungefilterte KI kann Übungsleistung steigern, aber Transfer/Prüfung schwächen; didaktisierte Begleitung (Scaffolding, Grenzen) schützt eher.

→ V2 darf **nicht** immer „einen Prompt“ ausspucken. Es muss auch sagen können:  
**Strategie 0 – hier besser ohne KI** (z. B. wenn Cognitive Offloading droht und die Kompetenz gerade bewusst geübt werden soll).

### 3.2 Drei Strategien als Beratungsrahmen

| Strategie | Bedeutung für V2 |
|---|---|
| **0 – Keine KI** | Explizite Option in den Vorschlägen, wenn lernwirksamer ohne KI |
| **1 – Selbstbestimmte KI-Nutzung** | Lehrperson gibt Rahmen/Prompt an Schüler:innen; Lernende steuern Gespräch oft selbst (z. B. Berufs-/Fach-Tutor) |
| **2 – KI-Lernaufgabe** | KI führt aktiv (stellt Fragen/Aufgaben); Lehrperson liefert Instruktion + Kontext + ggf. erweiterte Funktionen |

V2 soll Lehrpersonen **in diese Entscheidung hineinberaten**, ohne Workshop-Länge: wenige, greifbare Vorschläge statt Theorieblock.

### 3.3 Was nachweislich/pädagogisch oft funktioniert (Vorschlagspool)

Aus dem Workshop als **Typen punktueller Einsätze** (nicht als Features-Liste fürs UI):

1. **Tutor / Lernbegleitung** – Scaffolding, metakognitive Begleitung, keine Fertiglösungen  
2. **Individualisierung** – Transfer in Lebenswelt, Sprache/Interessen anpassen, Schwierigkeit leicht adaptieren  
3. **Simulation** – Gespräch, Debatte, Vorstellungsgespräch, Expertengespräch, Rollenspiel  
4. **Feedback** – KI-Feedback *oder* Schüler:innen erzeugen Feedback für sich selbst mit KI-Hilfe  

Diese Typen sind die „Karten“, aus denen V2 Vorschläge zieht – als **Einzelmoment oder als Baustein in einer Mikrosequenz**, nicht als Wochen-Setting. Besonders Feedback und Individualisierung brauchen oft einen Vor- und Nachlauf ohne KI (Produktion → KI-Schritt → soziale/metakognitive Verarbeitung).

### 3.4 Qualitätslogik aus dem Tutor-Workshop (verdichtet)

Die Workshop-Schritte werden in V2 nicht als sechs Formularseiten abgebildet, sondern als **interne Qualitätsschritte** der Beratung:

1. Fach-/Unterrichtslogik grob verstehen  
2. Lernrealität / Knacknuss (wo stocken Lernende?)  
3. gewünschte **Wirkung** („Lernende sollen …“)  
4. **Grenzen** (was die KI bewusst nicht tut – gegen Offloading)  
5. Prompt formulieren  
6. kurz testbar machen (Hinweis: eine realistische Schülerfrage ausprobieren)

### 3.5 Modell „KI-Lernaufgabe“ – drei Ebenen, auch in Sequenzen

Eine qualitative KI-Lernaufgabe besteht aus drei Ebenen (Workshop):

1. **Prompt** – Du-Form an die KI, steuert Verlauf  
2. **Kontext** – Hintergrund, Materialien, Niveau, Regeln (Text und/oder Hinweis auf Upload/Links)  
3. **Erweiterte Funktionen** – z. B. nach X Antworten Kurzfeedback/Zusammenfassung, Adaptation der Schwierigkeit, Abschlussreflexion, Export einer strukturierten Ausgabe  

**In einem Einzelmoment** reichen oft Ebene 1 (+ knapper Kontext); Ebene 3 macht die Aufgabe robuster.

**In einer Mikrosequenz** wird Ebene 3 besonders wertvoll: Erweiterte Funktionen sollen **Artefakte produzieren**, die der **nächste Schritt** braucht.

| Ebene | Rolle in der Sequenz |
|---|---|
| Prompt | Definiert den KI-Schritt |
| Kontext | Bindet Vorwissen / Schülerprodukt aus dem vorherigen Schritt ein („nutze den Text der Lernenden …“) |
| Erweiterte Funktionen | Erzeugen **übergangsfähige Outputs** (Zusammenfassung, 3 Stärken/3 Fragen, Checkliste, offene Punkte) |

**Optimal:** Schritt *n* (KI) endet nicht mit „Chat beendet“, sondern mit einem klaren Output-Format; Schritt *n+1* (Peers, Reflexion, Transfer) **verarbeitet genau dieses Output**. Beispiel: Nach drei Feedback-Runden erstellt die KI eine Kurzzusammenfassung → Gruppenaufgabe lautet: „Tauscht eure Zusammenfassungen aus und markiert eine Erkenntnis, die ihr in die nächste Fassung übernehmt.“

V2 priorisiert am Morgen: erst starken Kern-Prompt und sinnvolle Sequenz-Übergänge; Kontext und Funktionen als anreicherbare Schichten, die die Übergänge absichern.

---

## 4. Zielgruppe & mentale Modelle der Nutzenden

Lehrpersonen kommen typischerweise mit einem dieser Einstiege:

- **Knacknuss:** „Bei Brüchen verlieren sie den Faden.“  
- **Wunsch:** „Ich will, dass sie selbstständig Quellen prüfen.“  
- **Gefühl/Reflexion:** „Ich bin unsicher, ob KI hier überhaupt hilft.“ / „Letzte Stunde war chaotisch.“  
- **Vage Idee:** „Irgendwas mit Rollenspiel und ChatGPT …“  
- **Schon klar (Power-User):** „Ich brauche einen Tutor-Prompt für …“ → Shortcut behalten (siehe §6)

Das Tool muss **alle** diese Einstiege annehmen und in denselben kurzen Pfad überführen: klären → vorschlagen → auswählen → Prompt-Paket.

---

## 5. Redesign des Workflows

Drei Schritte bleiben – Inhalt und Fragen ändern sich.

### Schritt 1 – Herausforderung öffnen (Dialog wie V1, andere Fragen)

**Layout-Idee:** wie Version 1 – optionaler Kontext oben, dann Chat + Fortschritts-Checkliste nebeneinander (bzw. gestapelt auf Mobile). Die Knacknuss wird **im Dialog** beschrieben, nicht in einem isolierten Formularfeld allein.

#### Optionaler Kontext (nicht blockierend, analog V1)

Felder z. B.: Klassenstufe · Fach · grober Zeitrahmen (Minuten / Teil einer Lektion).  
**Nicht** mehr: „Lernziel“ als fertige Aufgabe / „was die KI tun soll“. Stattdessen ggf. Platzhalter-Hinweise wie „wo hakt es?“ nur im Chat.

#### Einstiegsnachricht der Input-KI (neu)

Statt V1 (*„Beschreibe, was die KI tun soll …“*) z. B.:

> Was beschäftigt dich gerade für den Unterricht?  
> Du kannst eine Knacknuss, einen Wunsch oder auch nur ein Gefühl nennen – z. B. was du heute verändern möchtest oder wo die Schüler:innen stocken.

Ton: einladend, kurz, **eine** offene Einladung – keine Doppel-Frage im Sinne der Eine-Frage-Regel für Folgeturns. Die Einstiegsnachricht darf die Bandbreite zeigen; danach gilt wieder: nur eine Nachfrage pro Antwort.

#### Dialogregeln (übernommen & angepasst)

| Regel | V2 |
|---|---|
| Eine Frage pro Antwort | ja |
| Kein Smalltalk | ja, aber Emotionen dürfen kurz gespiegelt werden |
| Checkliste live | ja – mit **neuen** Punkten (siehe unten) |
| Ziel des Dialogs | nicht Prompt spezifizieren, sondern **Vorschläge freischalten** |

#### Checkliste V2 (sichtbares Feedback, andere Fragen)

| Schlüssel | Bedeutet „fertig“, wenn … | Typische Nachfrage (Beispiele) |
|---|---|---|
| `herausforderung` | Knacknuss, Wunsch oder Problem klar genug | „Wo genau hakt es – bei den Lernenden oder bei dir in der Planung?“ |
| `wirkung` | Was Lernende können / tun / denken sollen | „Was sollen sie danach können oder anders machen?“ |
| `zielgruppe` | Stufe und/oder Fach grob klar | „Für welche Stufe bzw. welches Fach?“ |
| `rahmen` | Zeit / Verortung grob (Punkt / Lektion) | „Hast du eher 15 Minuten oder eine ganze Lektion?“ |
| `bedingungen` | optional: Geräte, KI-Zugang, Material | nur fragen, wenn für Vorschläge relevant |

**Freigabe „Vorschläge zeigen“:** sobald **`herausforderung` + `wirkung`** true sind (Kern). Ideal zusätzlich `zielgruppe` und `rahmen`. `bedingungen` nie als harte Sperre.

#### Live-Erkennung (verbindlich)

Die Checkliste wird **fortlaufend nach jedem Turn** aktualisiert – wie in V1 technisch schon angelegt (Antwort der Input-KI enthält den Checklisten-Status).

- **Text:** Nach dem Senden einer Nachricht wertet die KI den gesamten Verlauf aus und setzt die Häkchen.  
- **Mikrofon:** Sprache wird zu Text; sobald die Nachricht gesendet ist (manuell oder nach Ende der Aufnahme), gilt dieselbe Live-Auswertung. Die Lehrperson sieht sofort, ob Herausforderung/Wirkung usw. schon „grün“ sind – ohne extra Formular.  
- **Optionaler Kontext-Felder:** Einträge in Stufe/Fach/Zeit können Checklistenpunkte teilweise vorab setzen (z. B. `zielgruppe`, `rahmen`), noch bevor der Chat startet.  
- **Nicht nötig (V2-Scope):** Analyse *während* des Sprechens Wort-für-Wort (Streaming-Zwischenstände) – teuer und unruhig. Ausreichend: Erkennung **nach jeder abgeschlossenen Äusserung/Nachricht**.

Wenn genug da ist: kurze Zusammenfassung + Frage analog V1:  
*„Ich habe genug, um dir 2–3 passende Ideen vorzuschlagen. Weiter?“*

CTA „Vorschläge zeigen“ wird **live aktiv**, sobald die Kernpunkte erfüllt sind (Button wechselt von grau zu blau) – idealerweise mit kurzem visuellem Feedback an der Checkliste.

#### Was die KI im Dialog *nicht* tun soll

- Nicht sofort nach Rolle der KI, Ausgabeformat oder Prompt-Details fragen.  
- Nicht schon fertige Sequenzen im Chat ausrollen (das ist Schritt 2).  
- Nicht abweisen, wenn der Input emotional oder vage ist – nachfragen und übersetzen.

#### Übergang zu Schritt 2

CTA **„Vorschläge zeigen“** (statt „Instruktion generieren“). Danach erscheinen die Karten (Passungsregel). Der Chat kann darunter stehen bleiben (Kontext), muss aber nicht weitergeführt werden.

### Schritt 2 – Beratung & Vorschläge (Herzstück von V2)

**Ziel:** Die Lehrperson trifft eine Entscheidung – nicht die KI den Prompt „einfach so“.

#### Passungsregel (verbindlich)

Mehrere Vorschläge sind **kontrollierte Alternativen**, keine Ideenlotterie.

- Jeder Vorschlag muss die **zentrale Knacknuss / den zentralen Wunsch** treffen.  
- Jeder Vorschlag braucht einen expliziten Satz **„Passt, weil …“** (Bezug zur geäusserten Herausforderung).  
- Fehlt der Bezug zum Kernwunsch, fällt der Vorschlag raus – auch wenn er „irgendwie lernwirksam“ oder thematisch verwandt klingt.  
- Beispiel: Knacknuss = *selbst schreiben, KI nur Feedback* → ein generischer Fehlkonzept-Tutor, der nur „denken“ streift, ist **kein** gültiger Vorschlag.

#### Alternativen-Matrix (wie streuen, ohne Zufall)

Typisch **2–3 Vorschläge** entlang bewusster Dimensionen zur *selben* Knacknuss:

| Slot | Rolle | Beispiel zur Knacknuss „selbst schreiben, KI nur Feedback“ |
|---|---|---|
| A | Enger Treffer (oft Sequenz) | Schreiben → KI-Feedback → Austausch |
| B | Variante derselben Logik | z. B. kürzer, oder KI darf nur Fragen stellen (kein Feedback-Text) |
| C | Echte Alternative | Strategie 0: Peer-Feedback ohne KI |

Nicht streuen nach „verschiedenen KI-Features“, sondern nach **Strategie-Intensität / Zeit / Geräte** bei gleichem Lernziel.

#### Was eine Vorschlagskarte zeigt (Scan, wenig Text)

- Titel (kurz)  
- **Passt, weil …** (ein Satz)  
- Schrittfolge (visuell, skimmbar)  
- Grobe Dauer  

Strategie-Labels, „Mikrosequenz“, „KI in x von y“ usw. nur sparsam – nicht alles gleichzeitig, was schon aus der Schrittfolge lesbar ist.

Lehrperson wählt einen Vorschlag (oder bittet um Alternativen / um eine kürzere Variante).

Danach nur noch **wenige** Nachfragen für den gewählten Pfad.

### Schritt 3 / Mock-Abschnitt 4 – Ausarbeiten (Leseführung)

**Problem im ersten Mock:** Linke Schrittliste + rechte Fläche wirkt wie ein App-Detailpanel. Bei Schritten ohne KI bleibt rechts oft nur „Kein Prompt“ – leere Lesestelle. Prompt, Kontext und Grenzen vermischen sich mit der Unterrichtslogik.

**Leitidee:** Zwei Leseschichten trennen, aber **in einer vertikalen Abfolge** (nicht dauerhaft links/rechts splitten):

| Schicht | Für wen / wozu | Inhalt |
|---|---|---|
| **A · Unterrichtsskizze** | Lehrperson plant die Stunde | Alle Schritte untereinander, nummeriert: Was tun Lernende? Was tust du? Was geht weiter zum nächsten Schritt? |
| **B · Prompt** | Nur bei KI-Schritten | Einklappbar oder direkt unter dem Schritt: Prompt + Kopieren; darunter knapp Kontext / Funktion / Grenzen |

So liest man die Sequenz wie einen kurzen Stundenablauf; der Prompt ist **Werkzeug am richtigen Schritt**, nicht die ganze rechte Seite.

#### Empfohlene UI (V2)

1. Kopf: Titel + Dauer in einer Zeile; „Alle Prompts kopieren“ nur wenn nötig.  
2. **Eine flache Liste** der Schritte, getrennt durch Linien – **keine** Karte-in-Karte.  
3. Pro Schritt: Nummer + Titel + ein Satz Unterrichtssprache (+ Weitergabe, wenn relevant).  
4. KI-Schritte: Link **„Prompt anzeigen“** → darunter Textarea + Kopieren; Hinweise (Kontext/Funktion/Grenzen) darunter.  
5. Prompt standardmässig **zugeklappt**, damit die Skizze zuerst lesbar bleibt.

**Inhaltliche Qualität der Ausarbeitung (nicht mit UI-Ruhe verwechseln):**
- KI-Prompts müssen **vollständig und einsatzbereit** sein (Rolle, Ablauf, Grenzen, Output für Folgeschritt) – typisch deutlich länger als ein Satz; Einzeiler sind unzulässig.
- contextHint / functionsHint / boundaries: jeweils **gehaltvoll** (mehrere Sätze oder klare Aufzählung), nicht nur drei Stichworte.
- Schritte **ohne KI** (vor/nach dem KI-Schritt): didaktischer Kommentar mit **3–4 Sätzen** – was zu tun ist **und warum** das wirkungsvoll ist (z. B. eigene Texte wählen → Ownership, Relevanz).
- KI-Schritt-Summary bleibt kürzer; die Tiefe steckt im Prompt.

**Vermeiden:** verschachtelte Rahmen, graue Innenboxen, Badges („mit KI“), wiederholtes „Passt, weil …“, Sidebar + Detail-Split.  

#### Verworfene / schwächere Varianten

- **Dauerhaft Sidebar links + Detail rechts:** gut für Navigation, schlecht wenn viele Schritte ohne KI „leer“ wirken.  
- **Nur Prompt-Textarea wie V1:** verliert die Mikrosequenz.  
- **Tabs „Unterricht“ | „Prompts“:** möglich, aber ein Extra-Klick; erst wählen, wenn die Ein-Spalten-Lösung zu lang wird.

#### Inhalt pro Schritt-Block

- **Ohne KI:** 3–4 Sätze didaktischer Kommentar (Handlung + Begründung der Wirkung)  
- **Mit KI:** kurze Summary; Prompt vollständig; Hinweise Kontext/Funktion/Grenzen gehaltvoll  
- **Übergang:** Artefakt → nächster Schritt (wenn relevant)

---

## 6. Zwei Einstiege (Effizienz vs. Beratung)

| Modus | Für wen | Verhalten |
|---|---|---|
| **Herausforderung** (Default V2) | Unklar, emotional, explorativ | Schritte 1 → 2 → 3 |
| **Ich weiss schon, was die KI tun soll** (Shortcut) | Power-User / Wiederkehrende | Verkürzter Dialog Richtung Prompt (näher an V1), aber Output trotzdem als Paket mit Verortung + Grenzen |

So bleibt V2 für Planung *und* für schnelle Prompt-Arbeit nutzbar.

---

## 7. Designprinzipien (verbindlich für Umsetzung)

1. **Sinn vor Form** – Einzelmoment und Mikrosequenz sind gleichwertig; jede Lösung muss in sich geschlossen und zur Knacknuss passend sein.  
2. **Passung vor Vielfalt** – Vorschläge sind Alternativen zur selben Knacknuss, keine Zufallsauswahl.  
3. **KI nur wo nötig** – Schritte ohne KI sind erste Klasse; Prompts nur für KI-Schritte.  
4. **Outputs verbinden Schritte** – erweiterte Funktionen so denken, dass Artefakte den Folgeschritt speisen.  
5. **Visuelle Sprache an V1** – dezente Blautöne, nummerierte Abschnitte, weisse Kästen auf ruhigem Hintergrund; Inhalt klarer, nicht lauter (siehe §7b).  
6. **Niederschwellig** – Start mit einem Satz; optionale Felder nie Pflicht.  
7. **Robust gegen Vagheit** – Unklare Inputs nachfragen, nicht abweisen.  
8. **Emotion & Reflexion willkommen** – als Signal für Bedarf, nicht als Off-Topic.  
9. **Lernwirksamkeit vor Features** – Strategie 0 erlauben; Grenzen und Scaffolding standardmässig mitdenken.  
10. **Entscheidung vor Generierung** – Dialog → Vorschläge wählen → Prompt(s).  
11. **Kein Scope-Creep** – keine Projektplaner, keine Wochenpläne; Mikrosequenz ≠ Lernumgebung.

---

## 7a. UX-Gedanken: Sequenzen übersichtlich und entscheidbar

### Problem

Sequenzen können schnell unübersichtlich werden. Am Morgen: zuerst *Ist das eine gute Idee?*, dann *Wie kopiere ich den Prompt?*

### Prinzip: Zwei Ebenen – Scan, dann Detail

| Ebene | Zweck | Inhalt |
|---|---|---|
| **Scan** (Idee wählen) | Schnell urteilen | Titel, „Passt, weil …“, Schrittfolge, Dauer – in geordneten Karten |
| **Detail** (Ausarbeiten) | Umsetzen | Vertikale Unterrichtsskizze; Prompt nur in KI-Schritten ein-/ausklappbar |

### Seitenstruktur (an V1 angelehnt)

1. **Kontext** (optional) – wenige Felder  
2. **Knacknuss klären** – Chat + Checkliste → CTA „Vorschläge zeigen“  
3. **Idee wählen** – 2–3 Vorschlagskarten  
4. **Ausarbeiten** – Schrittfolge + Prompt(s)  

**Breite:** Inhalt bewusst breiter als V1-`max-w-4xl` (Zielrichtung ca. `max-w-6xl`), damit Chat und Checkliste nebeneinander Luft haben und Vorschläge auf grossen Screens horizontal liegen können – weniger vertikales Quetschen.  

### Prompt-Handling

Ein Primär-CTA **„Kopieren“** pro KI-Schritt; Kontext/Funktionen/Grenzen darunter als kurzer Text.

### Umsetzung

Die produktive Oberfläche ist die Startseite (`/`). V1 bleibt unter `/v1`. APIs: `/api/v2/input-ki`, `/api/v2/proposals`, `/api/v2/elaborate`.

---

## 7b. Visuelle Sprache (an Version 1 orientiert)

**Beibehalten von V1:**

- Hintergrund hellgrau, Abschnitte als weisse Kästen mit leichtem Rahmen/Schatten  
- Blaue Schritt-Nummerierung, blaue Primäraktionen  
- Checkliste mit grünem „erledigt“-Feedback  
- Chat-Bubbles (Assistent blau-tintig, User grau)  

**Bewusst ruhiger / klarer als ein überladenes Dashboard:**

- Wenige Schriftstufen (Titel der Section, Fliesstext, Meta)  
- Keine Badge-Flut, kein zweites Farbsystem neben Blau/Grau/Grün-Check  
- Vorschlagskarten: eine Karte = eine Idee; darin nicht noch drei verschachtelte Mini-Karten für jeden Schritt  
- Schrittfolge als einfache Liste oder dezente Kette, nicht als buntes Diagramm  

**Nicht:** extremes Minimal-Wireframe (nur Text/Underlines) – das war ein Zwischen-Mock, nicht die Ziellinie.

---

## 8. Abgrenzung V1 → V2 (Checklisten-Wechsel)

**V1-Checkliste:** Thema, Zielgruppe, Rolle der KI, Ausgabeformat, Lerneffekt, Materialien  

**V2-Checkliste:** Herausforderung, Wirkung, Zielgruppe, Rahmen, (optional) Bedingungen – Freigabe für **Vorschläge**, nicht für den finalen Prompt.

---

## 9. Offene Punkte für die nächste Ausarbeitung

- Feinschliff Einstiegsformulierung (eine feste Zeile vs. 2–3 wechselnde Begrüssungen)  
- Ab wann scrollt die Seite automatisch zu den Vorschlagskarten?  
- Shortcut „Ich weiss schon, was die KI tun soll“: eigener Tab oder Toggle?  
- Datenschutz/Hosting / Name  

---

## 10. Kurzfassung

**Eduprompt V2** übernimmt die **vertraute V1-Oberfläche** (Kästen, Blau, Chat + Checkliste), ändert aber den Dialog: Einstieg bei der Knacknuss, andere Checklistenpunkte, CTA „Vorschläge zeigen“. Vorschläge sind passgenaue Alternativen; die Ausarbeitung liefert Schrittfolge und Prompt(s) – lernwirksam, situativ, ohne grosse Lernumgebungen.