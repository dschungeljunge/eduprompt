'use client';

import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import { Mic, Send, Bot, User, BrainCircuit, Copy, Check, X, FileText, Loader2, FileImage } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string; imageBase64?: string };

const initialAssistantMsg: Message = {
  role: 'assistant',
  content: 'Hallo! Beschreibe, was die KI in deinem Unterricht tun soll, oder fülle die Felder oben aus, um den Prozess zu beschleunigen.'
};

interface ISpeechRecognition {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
}

// @ts-expect-error - SpeechRecognition is a browser API that might not be in the type definitions
const SpeechRecognition: { new(): ISpeechRecognition } = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : undefined;

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}

const Modal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full relative" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors">
          <X size={24} />
        </button>
        <div className="text-sm text-gray-700 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {children}
        </div>
      </div>
    </div>
);

const Footer = ({ onShowModal }: { onShowModal: (content: 'imprint' | 'privacy') => void }) => {
    return (
      <footer className="w-full text-center text-sm text-gray-500 py-8 mt-8 border-t border-gray-200">
        <div className="flex justify-center items-center gap-x-6 gap-y-2 flex-wrap">
          <button onClick={() => onShowModal('imprint')} className="underline hover:text-gray-800">Impressum</button>
          <button onClick={() => onShowModal('privacy')} className="underline hover:text-gray-800">Datenschutz</button>
          <a href="https://github.com/dschungeljunge/eduprompt" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-800">
            GitHub-Projekt
          </a>
          <a href="https://ko-fi.com/petervonderph" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.32 0L12 2.69z"></path><path d="M12 12.5a2.5 2.5 0 0 0-2.5 2.5V18h5v-3a2.5 2.5 0 0 0-2.5-2.5z"></path></svg>
            Unterstütze das Projekt
          </a>
        </div>
      </footer>
    );
};

const ChecklistItem = ({ label, checked }: { label: string, checked: boolean }) => (
    <div className={`flex items-center gap-3 transition-all duration-300 ${checked ? 'text-green-600' : 'text-gray-500'}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${checked ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white'}`}>
        {checked && <Check size={16} className="text-white" />}
      </div>
      <span className={checked ? 'font-semibold' : ''}>{label}</span>
    </div>
);

const Section = ({ number, title, children }: { number: number, title: string, children: React.ReactNode }) => (
  <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-8 bg-blue-600 text-white font-bold text-lg rounded-full flex items-center justify-center">{number}</div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>
      <div className="pl-12">
          {children}
      </div>
  </section>
);


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
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

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
    material: false,
  });

  const [modalContent, setModalContent] = useState<'imprint' | 'privacy' | null>(null);
  
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const checkedItemsCount = Object.values(checklist).filter(Boolean).length;
  const isGenerationEnabled = checkedItemsCount >= 4;

  const resetState = () => {
    setMessages([initialAssistantMsg]);
    setInput('');
    setImage(null);
    setLoading(false);
    setGenerating(false);
    setResult('');
    setError(null);
    setKlassenstufe('');
    setFach('');
    setLernziel('');
    setDauer('');
    setChecklist({
      thema: false,
      zielgruppe: false,
      rolleKi: false,
      ausgabeformat: false,
      lerneffekt: false,
      material: false,
    });
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setProcessedFile(null);
    setImage(null);
    setIsProcessingFile(true);

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
            setImage(reader.result as string);
            setProcessedFile(file);
            setIsProcessingFile(false);
        };
        reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const pdfData = new Uint8Array(event.target?.result as ArrayBuffer);
                const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
                    fullText += pageText + '\n\n';
                }
                setInput(prev => `INHALT AUS PDF "${file.name}":\n\n${fullText.trim()}\n\n---\n\n` + prev);
                setProcessedFile(file);
            } catch (err) {
                setError('Fehler beim Verarbeiten des PDFs.');
                console.error(err);
            } finally {
                setIsProcessingFile(false);
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        setError('Nicht unterstützter Dateityp. Bitte laden Sie ein Bild oder PDF hoch.');
        setIsProcessingFile(false);
    }
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
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? prev + ' ' + transcript : transcript);
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
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

    const userMessages = [];
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
    setProcessedFile(null);
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
    
    const messagesForGeneration = [...messages];
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto py-8 px-4 text-center">
          <h1 className="text-5xl font-bold text-blue-600 tracking-tight">Eduprompt</h1>
          <p className="mt-2 text-lg text-gray-600">
            Vom pädagogischen Ziel zur perfekten KI-Instruktion.
          </p>
        </div>
      </header>

      <main className="w-full max-w-4xl mx-auto p-4 lg:p-8 space-y-8">
        <Section number={1} title="Kontext definieren (optional)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Klassenstufe" value={klassenstufe} onChange={e => setKlassenstufe(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
                <input type="text" placeholder="Fach" value={fach} onChange={e => setFach(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
                <input type="text" placeholder="Lernziel" value={lernziel} onChange={e => setLernziel(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
                <input type="text" placeholder="Dauer der Aktivität" value={dauer} onChange={e => setDauer(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
        </Section>

        <Section number={2} title="Dialog führen & Qualität prüfen">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left: Checklist */}
                <div className="md:w-1/3 space-y-2 text-base">
                    <ChecklistItem label="Thema / Aufgabe" checked={checklist.thema} />
                    <ChecklistItem label="Zielgruppe (Klasse)" checked={checklist.zielgruppe} />
                    <ChecklistItem label="Rolle der KI" checked={checklist.rolleKi} />
                    <ChecklistItem label="Ausgabeformat" checked={checklist.ausgabeformat} />
                    <ChecklistItem label="Gewünschter Lerneffekt" checked={checklist.lerneffekt} />
                    <ChecklistItem label="Unterrichtsmaterialien" checked={checklist.material} />
                </div>
                {/* Right: Chat */}
                <div className="flex-grow flex flex-col gap-4">
                    <div className="flex flex-col gap-4 h-96 overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-200">
                        {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 items-start ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                            {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0"><Bot size={20} /></div>}
                            <div
                            className={`max-w-[85%] px-4 py-2 rounded-lg shadow-sm text-base whitespace-pre-wrap break-words
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
                     <form
                        onSubmit={e => { e.preventDefault(); sendMessage(); }}
                        className="flex flex-col gap-2"
                    >
                        <div className="relative">
                        <textarea
                            className="w-full border-gray-200 shadow-sm rounded-lg p-3 pr-28 text-base focus:ring-2 focus:ring-blue-500 outline-none resize-none"
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
                            disabled={loading || isProcessingFile}
                            rows={3}
                        />
                        <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1">
                            <label className="cursor-pointer p-2 rounded-md hover:bg-gray-100 text-gray-500" title="Bild hochladen">
                                <FileImage size={18} />
                                <input type="file" accept="image/*" onChange={handleFileChange} disabled={loading || isProcessingFile} className="hidden" />
                            </label>
                             <label className="cursor-pointer p-2 rounded-md hover:bg-gray-100 text-gray-500" title="PDF hochladen">
                                <FileText size={18} />
                                <input type="file" accept="application/pdf" onChange={handleFileChange} disabled={loading || isProcessingFile} className="hidden" />
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
                        {isProcessingFile && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Loader2 size={16} className="animate-spin" />
                                <span>Datei wird verarbeitet...</span>
                            </div>
                        )}
                        {processedFile && !isProcessingFile && (
                          <div className="flex items-center gap-2 text-sm p-2 bg-gray-100 rounded-lg">
                            {image ? (
                                <img src={image} alt="Vorschau" className="max-h-16 rounded-md border border-gray-200" />
                            ) : (
                                <FileText size={20} className="text-gray-600 flex-shrink-0" />
                            )}
                            <span className="truncate flex-grow">{processedFile.name}</span>
                            <button 
                                type="button" 
                                className="text-red-500 hover:underline flex-shrink-0" 
                                onClick={() => {
                                    setProcessedFile(null);
                                    setImage(null);
                                    // Optional: remove extracted text if needed
                                }}
                            >
                              Entfernen
                            </button>
                          </div>
                        )}
                    </form>
                </div>
            </div>
        </Section>

        <Section number={3} title="Instruktion generieren & anpassen">
            <div className="flex flex-col items-center">
                <button
                    className={`px-8 py-4 text-lg font-bold text-white rounded-lg shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3
                        ${isGenerationEnabled 
                            ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 animate-pulse' 
                            : 'bg-gray-400'
                        }`}
                    onClick={generateInstruction}
                    disabled={generating || !isGenerationEnabled}
                >
                    {generating ? (
                        <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Instruktion wird generiert...
                        </>
                    ) : (
                        <>
                        <BrainCircuit size={22}/>
                        Instruktion generieren
                        </>
                    )}
                </button>
                {messages.length > 1 && !isGenerationEnabled &&
                    <p className="text-sm text-gray-500 mt-3">Schliessen Sie zuerst mindestens vier Punkte in der Checkliste ab.</p>
                }
            </div>

            {result && (
                <div className="mt-6">
                     <div className="flex-grow relative bg-white border border-gray-200 rounded-lg shadow-sm p-1">
                        <textarea
                            value={result}
                            onChange={(e) => setResult(e.target.value)}
                            placeholder="Die generierte Instruktion wird hier angezeigt..."
                            className="w-full h-full p-3 bg-transparent border-none rounded-md resize-none focus:ring-0 outline-none text-base font-mono"
                            rows={15}
                        />
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
                     </div>
                     <div className="mt-4 flex justify-center">
                        <button 
                            onClick={resetState}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Neue Instruktion beginnen
                        </button>
                     </div>
                </div>
            )}
        </Section>

      </main>
      {error && (
        <div className="fixed bottom-5 right-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg" role="alert">
          <strong className="font-bold">Fehler: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <Footer onShowModal={setModalContent}/>
      {modalContent && (
        <Modal 
            title={modalContent === 'imprint' ? 'Impressum' : 'Datenschutz'} 
            onClose={() => setModalContent(null)}
        >
            {modalContent === 'imprint' && (
                <>
                    <p className="font-semibold">Angaben gemäss Art. 3 Abs. 1 lit. s UWG</p>
                    <p>
                        Peter Rigert<br />
                        <a href="https://www.linkedin.com/in/peter-rigert/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">LinkedIn Profil</a>
                    </p>
                    <p className="mt-4 font-semibold">Kontakt</p>
                    <p>Bei Fragen oder Anliegen zu diesem Prototypen können Sie über das oben verlinkte Profil Kontakt aufnehmen.</p>
                </>
            )}
            {modalContent === 'privacy' && (
                <>
                    <p className="font-semibold">Datenverarbeitung auf eduprompt.ch</p>
                    <p>Diese Webseite dient als Prototyp und Demonstrator. Die Funktionsweise und der Umgang mit Daten sind wie folgt:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                        <li><b>Keine Speicherung auf dem Server:</b> Es werden keine Ihrer Eingaben, Konversationen oder generierten Instruktionen auf den Servern von eduprompt.ch gespeichert oder protokolliert.</li>
                        <li><b>Temporäre Speicherung im Browser:</b> Die gesamte Interaktion (Chatverlauf, Eingaben in Formularfelder) wird ausschliesslich temporär in Ihrem Webbrowser gespeichert. Beim Schliessen des Browser-Tabs oder beim Neuladen der Seite werden diese Daten vollständig gelöscht.</li>
                        <li><b>Datenübermittlung an OpenAI:</b> Um die Antworten der &quot;Input-KI&quot; und die finale Instruktion zu generieren, werden Ihre Eingaben (Text und hochgeladene Bilder) an die Server von OpenAI in den USA übermittelt. Dieser Prozess ist für die Funktionalität der Seite unerlässlich.</li>
                        <li><b>Keine Cookies:</b> Diese Seite verwendet keine Tracking-Cookies oder Analyse-Tools von Drittanbietern.</li>
                    </ul>
                    <p className="mt-4">
                        Mit der Nutzung des Tools stimmen Sie dieser Datenübermittlung an OpenAI zu. Bitte geben Sie keine sensiblen oder personenbezogenen Daten ein, die nicht für diesen Zweck verarbeitet werden sollen. Für Informationen zur Datenverarbeitung durch OpenAI beachten Sie bitte deren offizielle Richtlinien: 
                        <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-1">Datenschutzrichtlinien von OpenAI</a>.
                    </p>
                </>
            )}
        </Modal>
      )}
    </div>
  );
}
