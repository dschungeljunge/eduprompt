'use client';

import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import { Paperclip, Mic, Send, Bot, User, BrainCircuit, Copy, Check, Info } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string; imageBase64?: string };

const initialAssistantMsg: Message = {
  role: 'assistant',
  content: 'Hallo! Beschreibe bitte, was die KI in deinem Unterricht tun soll. Ich stelle dir Rückfragen, falls wichtige Informationen fehlen. Du kannst auch die Felder oben ausfüllen, um den Prozess zu beschleunigen.'
};

const tips = [
  "Je präziser die Rolle der KI definiert ist (z.B. 'kritischer hinterfragender Tutor'), desto besser.",
  "Geben Sie ein klares Lernziel an, das die Schüler erreichen sollen.",
  "Beschreiben Sie das gewünschte Ausgabeformat (z.B. 'eine Liste mit Stichpunkten').",
  "Laden Sie ein Arbeitsblatt hoch, um den Kontext schneller zu erfassen.",
  "Definieren Sie, welches Vorwissen die Schüler mitbringen."
];

// @ts-ignore
const SpeechRecognition: any = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : undefined;

const Footer = () => {
  return (
    <footer className="w-full max-w-4xl mx-auto text-center text-xs text-gray-500 py-6 mt-4">
      <div className="border-t border-gray-200 pt-6">
        <p className="font-semibold">Eduprompt Pilot</p>
        <p>Ein Prototyp von Peter Waser</p>
        <p className="mt-2">
          <a href="https://github.com/dschungeljunge/eduprompt" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-800">
            GitHub-Projekt
          </a>
        </p>
        <div className="mt-4 max-w-2xl mx-auto">
          <p className="font-semibold mb-1">Hinweise zum Datenschutz</p>
          <p>
            Ihre Eingaben (Text und Bilder) werden zur Verarbeitung an die Server von OpenAI in den USA gesendet. 
            Es werden keine Ihrer Daten auf den Servern dieses Dienstes (eduprompt.ch) gespeichert. 
            Die gesamte Konversation findet temporär in Ihrem Browser statt und wird beim Neuladen der Seite zurückgesetzt. 
            Bitte beachten Sie die <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-800">Datenschutzrichtlinien von OpenAI</a> für weitere Informationen.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([initialAssistantMsg]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [klassenstufe, setKlassenstufe] = useState('');
  const [fach, setFach] = useState('');
  const [lernziel, setLernziel] = useState('');
  const [dauer, setDauer] = useState('');
  
  const [checklist, setChecklist] = useState({
    thema: false,
    zielgruppe: false,
    rolleKi: false,
    ausgabeformat: false,
    lerneffekt: false,
  });

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentTip, setCurrentTip] = useState(tips[0]);

  const isChecklistComplete = Object.values(checklist).every(Boolean);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => {
        const currentIndex = tips.indexOf(prev);
        return tips[(currentIndex + 1) % tips.length];
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setImage(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
        e.preventDefault();
        break;
      }
    }
  }

  function startRecognition() {
    if (!SpeechRecognition) {
      setError('Spracherkennung wird von deinem Browser nicht unterstützt.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? prev + ' ' + transcript : transcript);
    };
    recognition.onerror = (event: any) => {
      setError('Fehler bei der Spracherkennung: ' + (event.error || 'Unbekannter Fehler'));
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
    recognition.start();
    recognitionRef.current = recognition;
  }

  function stopRecognition() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  }

  const getStructuredDataPayload = () => {
    const structuredData: { [key: string]: string } = {};
    if (klassenstufe) structuredData.Klassenstufe = klassenstufe;
    if (fach) structuredData.Fach = fach;
    if (lernziel) structuredData.Lernziel = lernziel;
    if (dauer) structuredData['Dauer der Aktivität'] = dauer;

    if (Object.keys(structuredData).length > 0) {
        let contextText = "Hier sind einige strukturierte Informationen zum Unterrichtskontext:\n";
        for (const [key, value] of Object.entries(structuredData)) {
            contextText += `- ${key}: ${value}\n`;
        }
        return { role: 'user' as const, content: contextText };
    }
    return null;
  }

  async function sendMessage() {
    if (!input.trim() && !image) return;

    let userMessages = [];
    const structuredDataPayload = getStructuredDataPayload();
    // Füge strukturierte Daten nur bei der ersten Nachricht des Benutzers hinzu
    if (messages.length === 1 && structuredDataPayload) {
      userMessages.push(structuredDataPayload);
    }
    
    userMessages.push({ role: 'user' as const, content: input, imageBase64: image || undefined });

    const newMessages = [
      ...messages,
      ...userMessages
    ];

    setMessages(newMessages);
    setInput('');
    setImage(null);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/input-ki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant' as const, content: data.reply }]);
        if (data.checklist) {
          setChecklist(prev => ({ ...prev, ...data.checklist }));
        }
      } else {
        setError(data.error || 'Fehler bei der Antwort der Input-KI.');
      }
    } catch {
      setError('Serverfehler.');
    } finally {
      setLoading(false);
    }
  }

  async function generateInstruction() {
    setGenerating(true);
    setResult('');
    setError(null);
    
    let messagesForGeneration = [...messages];
    const structuredDataPayload = getStructuredDataPayload();
    if (structuredDataPayload && messages.length <= 2) { // Füge hinzu, falls noch kein User-Input da
      messagesForGeneration.splice(1, 0, structuredDataPayload);
    }

    try {
      const res = await fetch('/api/generate-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat: messagesForGeneration }),
      });
      const data = await res.json();
      if (data.result) setResult(data.result);
      else setError(data.error || 'Fehler bei der Generierung.');
    } catch {
      setError('Serverfehler.');
    } finally {
      setGenerating(false);
    }
  }

  const ChecklistItem = ({ label, checked }: { label: string, checked: boolean }) => (
    <div className={`flex items-center gap-2 transition-all duration-300 ${checked ? 'text-green-600' : 'text-gray-400'}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${checked ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
        {checked && <Check size={14} className="text-white" />}
      </div>
      <span className={checked ? 'font-semibold' : ''}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-gray-200 p-8 grid grid-cols-12 gap-8">
        
        {/* Left Column: Input & Chat */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          <header>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Eduprompt Pilot</h1>
            <p className="text-gray-600 mt-1">
              Erstellen Sie im Dialog mit der Input-KI eine wirksame Instruktion für Ihren Unterricht.
            </p>
          </header>

          {/* Structured Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Klassenstufe" value={klassenstufe} onChange={e => setKlassenstufe(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <input type="text" placeholder="Fach" value={fach} onChange={e => setFach(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <input type="text" placeholder="Lernziel (optional)" value={lernziel} onChange={e => setLernziel(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <input type="text" placeholder="Dauer (optional)" value={dauer} onChange={e => setDauer(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* Chat Window */}
          <div className="flex flex-col gap-4 h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-200">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 items-start ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0"><Bot size={20} /></div>}
                <div
                  className={`max-w-[85%] px-4 py-2 rounded-lg shadow-sm text-sm whitespace-pre-wrap break-words
                    ${msg.role === 'assistant'
                      ? 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                      : 'bg-blue-600 text-white rounded-br-none'}
                  `}
                >
                  {msg.content}
                  {msg.imageBase64 && (
                    <img
                      src={msg.imageBase64}
                      alt="User upload"
                      className="mt-2 max-h-40 max-w-full rounded-lg border border-gray-300"
                    />
                  )}
                </div>
                {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0"><User size={20} /></div>}
              </div>
            ))}
            {loading && <div className="flex items-center gap-2 text-sm text-gray-500 italic"><div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white animate-pulse"><Bot size={16} /></div>Input-KI denkt nach...</div>}
             <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={e => { e.preventDefault(); sendMessage(); }}
            className="flex flex-col gap-2"
          >
            <div className="relative">
              <textarea
                className="w-full border-gray-300 rounded-lg p-3 pr-28 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Ihre Antwort..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={loading}
                rows={2}
              />
              <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1">
                 <label className="cursor-pointer p-2 rounded-md hover:bg-gray-100 text-gray-500">
                   <Paperclip size={18} />
                   <input type="file" accept="image/*,application/pdf,.doc,.docx" onChange={handleImageChange} disabled={loading} className="hidden" />
                 </label>
                 <button
                    type="button"
                    onClick={isRecording ? stopRecognition : startRecognition}
                    className={`p-2 rounded-md hover:bg-gray-100 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}
                    title="Spracheingabe"
                    disabled={loading}
                  >
                   <Mic size={18} />
                 </button>
                 <button
                    type="submit"
                    className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
                    disabled={loading || (!input.trim() && !image)}
                  >
                   <Send size={18} />
                 </button>
              </div>
            </div>
            {image && (
              <div className="flex items-center gap-2 text-sm">
                <img src={image} alt="Vorschau" className="max-h-16 rounded-md border border-gray-200" />
                <button type="button" className="text-red-500 hover:underline" onClick={() => setImage(null)}>
                  Entfernen
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Output & Tools */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
           <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Checkliste für eine starke Instruktion</h3>
              <div className="space-y-2 text-sm">
                <ChecklistItem label="Thema / Aufgabe" checked={checklist.thema} />
                <ChecklistItem label="Zielgruppe (Klasse)" checked={checklist.zielgruppe} />
                <ChecklistItem label="Rolle der KI" checked={checklist.rolleKi} />
                <ChecklistItem label="Ausgabeformat" checked={checklist.ausgabeformat} />
                <ChecklistItem label="Gewünschter Lerneffekt" checked={checklist.lerneffekt} />
              </div>
           </div>

           <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-full flex flex-col">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <BrainCircuit size={20} className="text-blue-600"/>
                Ihre KI-Instruktion
              </h2>
              <p className="text-sm text-gray-500 mb-3">
                Hier erscheint die generierte Instruktion. Sie können den Text danach anpassen.
              </p>
              
              <div className="flex-grow relative">
                <textarea
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="Die generierte Instruktion wird hier angezeigt..."
                  className="w-full h-full p-3 bg-white border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                  readOnly={!result}
                />
                 {result && (
                  <button
                    className="absolute top-2 right-2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600"
                    onClick={() => {
                      navigator.clipboard.writeText(result);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                  >
                    {isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                 )}
              </div>
              
               <button
                  className={`w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow transition disabled:opacity-50 flex items-center justify-center gap-2 ${isChecklistComplete && !generating ? 'animate-pulse' : ''}`}
                  onClick={generateInstruction}
                  disabled={generating || messages.length < 2}
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Instruktion wird generiert...
                    </>
                  ) : 'Instruktion generieren'}
                </button>
           </div>
           
           <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
             <div className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                <Info size={16} className="text-blue-600" />
                Tipp des Tages
             </div>
             <p>{currentTip}</p>
           </div>
        </div>
      </div>
      {error && (
        <div className="fixed bottom-5 right-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg" role="alert">
          <strong className="font-bold">Fehler: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <Footer />
    </div>
  );
}
