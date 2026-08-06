'use client';

import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Mic,
  Send,
  Bot,
  User,
  Copy,
  Check,
  X,
  FileText,
  Loader2,
  FileImage,
} from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

type Message = { role: 'user' | 'assistant'; content: string; imageBase64?: string };

type Checklist = {
  herausforderung: boolean;
  wirkung: boolean;
  zielgruppe: boolean;
  rahmen: boolean;
  bedingungen: boolean;
};

type ProposalStep = {
  number: number;
  title: string;
  kind: 'human' | 'ai';
  summary: string;
  artifactOut?: string | null;
  feedsInto?: number | null;
};

type Proposal = {
  id: string;
  title: string;
  fitsBecause: string;
  duration: string;
  strategy?: string;
  steps: ProposalStep[];
};

type ElaboratedStep = {
  id: string;
  number: number;
  title: string;
  kind: 'human' | 'ai';
  summary: string;
  artifactOut?: string | null;
  feedsInto?: number | null;
  prompt?: string | null;
  contextHint?: string | null;
  functionsHint?: string | null;
  boundaries?: string | null;
};

type Elaborated = {
  title: string;
  duration: string;
  fitsBecause: string;
  steps: ElaboratedStep[];
};

const OPENING: Message = {
  role: 'assistant',
  content:
    'Was beschäftigt dich gerade für den Unterricht? Du kannst eine Knacknuss, einen Wunsch oder auch nur ein Gefühl nennen – zum Beispiel, was du heute verändern möchtest oder wo die Schüler:innen stocken.',
};

const emptyChecklist = (): Checklist => ({
  herausforderung: false,
  wirkung: false,
  zielgruppe: false,
  rahmen: false,
  bedingungen: false,
});

const CHECKLIST_LABELS: { key: keyof Checklist; label: string }[] = [
  { key: 'herausforderung', label: 'Herausforderung / Wunsch' },
  { key: 'wirkung', label: 'Wirkung bei Lernenden' },
  { key: 'zielgruppe', label: 'Zielgruppe (Stufe / Fach)' },
  { key: 'rahmen', label: 'Zeitrahmen / Verortung' },
  { key: 'bedingungen', label: 'Bedingungen (optional)' },
];

const Modal = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <div
    className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full relative"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
      >
        <X size={24} />
      </button>
      <div className="text-sm text-gray-700 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
        {children}
      </div>
    </div>
  </div>
);

const Footer = ({
  onShowModal,
}: {
  onShowModal: (content: 'imprint' | 'privacy') => void;
}) => (
  <footer className="w-full text-center text-sm text-gray-500 py-8 mt-8 border-t border-gray-200">
    <div className="flex justify-center items-center gap-x-6 gap-y-2 flex-wrap">
      <button onClick={() => onShowModal('imprint')} className="underline hover:text-gray-800">
        Impressum
      </button>
      <button onClick={() => onShowModal('privacy')} className="underline hover:text-gray-800">
        Datenschutz
      </button>
      <Link href="/v1" className="underline hover:text-gray-800">
        Version 1
      </Link>
      <a
        href="https://github.com/dschungeljunge/eduprompt"
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-gray-800"
      >
        GitHub-Projekt
      </a>
    </div>
  </footer>
);

const ChecklistItem = ({ label, checked }: { label: string; checked: boolean }) => (
  <div className={`flex items-center gap-3 ${checked ? 'text-green-600' : 'text-gray-500'}`}>
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
        checked ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white'
      }`}
    >
      {checked && <Check size={16} className="text-white" />}
    </div>
    <span className={checked ? 'font-semibold' : ''}>{label}</span>
  </div>
);

const Section = ({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) => (
  <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-8 h-8 bg-blue-600 text-white font-bold text-lg rounded-full flex items-center justify-center">
        {number}
      </div>
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    </div>
    <div className="pl-0 sm:pl-12">{children}</div>
  </section>
);

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([OPENING]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const [klassenstufe, setKlassenstufe] = useState('');
  const [fach, setFach] = useState('');
  const [dauer, setDauer] = useState('');

  const [checklist, setChecklist] = useState<Checklist>(emptyChecklist);

  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [elaborated, setElaborated] = useState<Elaborated | null>(null);
  const [loadingElaborate, setLoadingElaborate] = useState(false);
  const [openPromptId, setOpenPromptId] = useState<string | null>(null);
  const [promptTexts, setPromptTexts] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [modalContent, setModalContent] = useState<'imprint' | 'privacy' | null>(null);

  const { isRecording, startRecognition, stopRecognition } = useSpeechRecognition(
    input,
    setInput,
    setError
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const proposalsRef = useRef<HTMLElement>(null);
  const elaborateRef = useRef<HTMLElement>(null);

  const coreReady = checklist.herausforderung && checklist.wirkung;

  const resetAll = () => {
    stopRecognition();
    setMessages([OPENING]);
    setInput('');
    setImage(null);
    setLoading(false);
    setError(null);
    setKlassenstufe('');
    setFach('');
    setDauer('');
    setChecklist(emptyChecklist());
    setProposals(null);
    setElaborated(null);
    setOpenPromptId(null);
    setPromptTexts({});
    setProcessedFile(null);
  };

  useEffect(() => {
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    const next = emptyChecklist();
    if (klassenstufe.trim() || fach.trim()) next.zielgruppe = true;
    if (dauer.trim()) next.rahmen = true;
    setChecklist((prev) => ({
      ...prev,
      zielgruppe: prev.zielgruppe || next.zielgruppe,
      rahmen: prev.rahmen || next.rahmen,
    }));
  }, [klassenstufe, fach, dauer]);

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
            const pageText = textContent.items
              .map((item) => ('str' in item ? item.str : ''))
              .join(' ');
            fullText += pageText + '\n\n';
          }
          setInput(
            (prev) =>
              `INHALT AUS PDF "${file.name}":\n\n${fullText.trim()}\n\n---\n\n` + prev
          );
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
      setError('Nicht unterstützter Dateityp. Bitte Bild oder PDF hochladen.');
      setIsProcessingFile(false);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => setImage(reader.result as string);
          reader.readAsDataURL(file);
        }
        e.preventDefault();
        break;
      }
    }
  }

  const getStructuredPayload = (): Message | null => {
    const parts: string[] = [];
    if (klassenstufe) parts.push(`- Klassenstufe: ${klassenstufe}`);
    if (fach) parts.push(`- Fach: ${fach}`);
    if (dauer) parts.push(`- Zeitrahmen: ${dauer}`);
    if (parts.length === 0) return null;
    return {
      role: 'user',
      content: 'Strukturierter Unterrichtskontext:\n' + parts.join('\n'),
    };
  };

  async function sendMessage() {
    if (!input.trim() && !image) return;

    const userMessages: Message[] = [];
    const structured = getStructuredPayload();
    if (messages.length === 1 && structured) userMessages.push(structured);

    const userMsg: Message = { role: 'user', content: input };
    if (image) userMsg.imageBase64 = image;
    userMessages.push(userMsg);

    const newMessages = [...messages, ...userMessages];
    setMessages(newMessages);
    setInput('');
    setImage(null);
    setProcessedFile(null);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v2/input-ki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setMessages(messages);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
        if (data.checklist) {
          setChecklist((prev) => ({
            herausforderung: Boolean(data.checklist.herausforderung),
            wirkung: Boolean(data.checklist.wirkung),
            zielgruppe: Boolean(data.checklist.zielgruppe) || prev.zielgruppe,
            rahmen: Boolean(data.checklist.rahmen) || prev.rahmen,
            bedingungen: Boolean(data.checklist.bedingungen),
          }));
        }
      }
    } catch {
      setError('Serverfehler.');
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  async function showProposals() {
    setLoadingProposals(true);
    setError(null);
    setProposals(null);
    setElaborated(null);
    try {
      const res = await fetch('/api/v2/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setProposals(data.proposals);
        setTimeout(() => proposalsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch {
      setError('Serverfehler bei den Vorschlägen.');
    } finally {
      setLoadingProposals(false);
    }
  }

  async function elaborate(proposal: Proposal) {
    setLoadingElaborate(true);
    setError(null);
    setElaborated(null);
    setOpenPromptId(null);
    try {
      const res = await fetch('/api/v2/elaborate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, proposal }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setElaborated(data);
        const texts: Record<string, string> = {};
        data.steps?.forEach((s: ElaboratedStep) => {
          if (s.prompt) texts[s.id] = s.prompt;
        });
        setPromptTexts(texts);
        setTimeout(() => elaborateRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch {
      setError('Serverfehler bei der Ausarbeitung.');
    } finally {
      setLoadingElaborate(false);
    }
  }

  const copyOne = async (id: string) => {
    const text = promptTexts[id];
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const copyAll = async () => {
    if (!elaborated) return;
    const block = elaborated.steps
      .filter((s) => s.kind === 'ai' && (promptTexts[s.id] || s.prompt))
      .map(
        (s) =>
          `### Schritt ${s.number}: ${s.title}\n\n${promptTexts[s.id] ?? s.prompt}`
      )
      .join('\n\n---\n\n');
    try {
      await navigator.clipboard.writeText(block);
      setCopiedId('all');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const aiStepCount =
    elaborated?.steps.filter((s) => s.kind === 'ai' && (s.prompt || promptTexts[s.id]))
      .length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto py-8 px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-600 tracking-tight">
            Eduprompt
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Von der Unterrichtsknacknuss zum KI-Lernaufgabenset.
          </p>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto p-4 lg:p-8 space-y-8">
        <div className="flex justify-center mb-2">
          <Image src="/Eduprompt.svg" alt="Eduprompt Logo" width={320} height={120} priority />
        </div>

        <Section number={1} title="Kontext (optional)">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Klassenstufe"
              value={klassenstufe}
              onChange={(e) => setKlassenstufe(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Fach"
              value={fach}
              onChange={(e) => setFach(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Zeitrahmen (z. B. 20 Min. / eine Lektion)"
              value={dauer}
              onChange={(e) => setDauer(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </Section>

        <Section number={2} title="Knacknuss klären">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 flex flex-col gap-3">
              <div className="flex flex-col gap-4 min-h-[22rem] max-h-[28rem] overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-200">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 items-start ${
                      msg.role === 'assistant' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white flex-shrink-0">
                        <Bot size={20} />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] px-4 py-2 rounded-lg shadow-sm text-base whitespace-pre-wrap break-words ${
                        msg.role === 'assistant'
                          ? 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                          : 'bg-blue-600 text-white rounded-br-none'
                      }`}
                    >
                      {msg.content}
                      {msg.imageBase64 && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={msg.imageBase64}
                          alt="Upload"
                          className="mt-2 max-h-40 max-w-full rounded-lg border border-gray-300"
                        />
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0">
                        <User size={20} />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white animate-pulse">
                      <Bot size={16} />
                    </div>
                    Denkt nach…
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex flex-col gap-2"
              >
                <div className="relative">
                  <textarea
                    className="w-full border-gray-200 shadow-sm rounded-lg p-3 pr-28 text-base focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Ihre Antwort…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
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
                    <label
                      className="cursor-pointer p-2 rounded-md hover:bg-gray-100 text-gray-500"
                      title="Bild"
                    >
                      <FileImage size={18} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={loading || isProcessingFile}
                        className="hidden"
                      />
                    </label>
                    <label
                      className="cursor-pointer p-2 rounded-md hover:bg-gray-100 text-gray-500"
                      title="PDF"
                    >
                      <FileText size={18} />
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        disabled={loading || isProcessingFile}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={isRecording ? stopRecognition : startRecognition}
                      className={`p-2 rounded-md hover:bg-gray-100 ${
                        isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500'
                      }`}
                      title="Spracheingabe (Deutsch / CH) – Tippen zum Stoppen"
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
                    Datei wird verarbeitet…
                  </div>
                )}
                {processedFile && !isProcessingFile && (
                  <div className="flex items-center gap-2 text-sm p-2 bg-gray-100 rounded-lg">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt="Vorschau"
                        className="max-h-16 rounded-md border border-gray-200"
                      />
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
                      }}
                    >
                      Entfernen
                    </button>
                  </div>
                )}
              </form>
            </div>

            <div className="lg:col-span-2 bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="font-bold mb-2 text-gray-700">Fortschritt</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Wird nach jeder Nachricht live aktualisiert – auch nach Spracheingabe.
              </p>
              <div className="space-y-3">
                {CHECKLIST_LABELS.map((item) => (
                  <ChecklistItem
                    key={item.key}
                    label={item.label}
                    checked={checklist[item.key]}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={showProposals}
              disabled={!coreReady || loadingProposals}
              className={`px-6 py-3 text-base font-semibold text-white rounded-lg shadow transition-colors flex items-center gap-2 ${
                coreReady && !loadingProposals
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {loadingProposals && <Loader2 size={18} className="animate-spin" />}
              {loadingProposals ? 'Vorschläge werden erstellt…' : 'Vorschläge zeigen'}
            </button>
            {messages.length > 1 && !coreReady && (
              <p className="text-sm text-gray-500">
                Noch nötig: Herausforderung und Wirkung bei den Lernenden.
              </p>
            )}
          </div>
        </Section>

        {proposals && !elaborated && (
          <section ref={proposalsRef}>
            <Section number={3} title="Idee wählen">
              {loadingElaborate && (
                <div className="flex items-center gap-2 text-gray-500 mb-4">
                  <Loader2 className="animate-spin" size={18} />
                  Idee wird ausgearbeitet…
                </div>
              )}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {proposals.map((p) => (
                  <article
                    key={p.id}
                    className="border border-gray-200 rounded-lg p-5 bg-gray-50/50 flex flex-col"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{p.title}</h3>
                      <span className="text-sm text-gray-500">{p.duration}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                      <span className="text-gray-500">Passt, weil </span>
                      {p.fitsBecause}
                    </p>
                    <ol className="space-y-1 flex-grow mb-4">
                      {p.steps.map((s) => (
                        <li key={s.number} className="text-sm text-gray-700">
                          {s.number}. {s.title}
                          {s.kind === 'ai' ? ' (KI)' : ''}
                        </li>
                      ))}
                    </ol>
                    <button
                      type="button"
                      onClick={() => elaborate(p)}
                      disabled={loadingElaborate}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 self-start disabled:opacity-50"
                    >
                      Diese Idee ausarbeiten →
                    </button>
                  </article>
                ))}
              </div>
            </Section>
          </section>
        )}

        {elaborated && (
          <section ref={elaborateRef}>
            <Section number={4} title="Ausarbeiten">
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-8">
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setElaborated(null);
                      setOpenPromptId(null);
                    }}
                    className="text-sm text-blue-600 hover:underline mb-3 block"
                  >
                    ← Andere Idee wählen
                  </button>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {elaborated.title}
                    <span className="font-normal text-gray-500">
                      {' '}
                      · {elaborated.duration}
                    </span>
                  </h3>
                </div>
                {aiStepCount > 0 && (
                  <button
                    type="button"
                    onClick={copyAll}
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {copiedId === 'all' ? <Check size={14} /> : <Copy size={14} />}
                    {copiedId === 'all' ? 'Kopiert' : 'Alle Prompts kopieren'}
                  </button>
                )}
              </div>

              <div className="divide-y divide-gray-200">
                {elaborated.steps.map((step) => {
                  const promptOpen = openPromptId === step.id;
                  const hasPrompt = Boolean(step.prompt || promptTexts[step.id]);

                  return (
                    <div key={step.id} className="py-6 first:pt-0 last:pb-0">
                      <p className="text-base text-gray-900 mb-1">
                        <span className="text-gray-400 mr-2">{step.number}.</span>
                        {step.title}
                        {step.kind === 'ai' ? (
                          <span className="text-gray-400 font-normal"> · KI</span>
                        ) : null}
                      </p>
                      <p
                        className={`text-sm text-gray-600 leading-relaxed pl-6 ${
                          step.kind === 'human' ? 'max-w-3xl' : ''
                        }`}
                      >
                        {step.summary}
                        {step.artifactOut
                          ? ` → ${step.artifactOut}${
                              step.feedsInto ? ` an Schritt ${step.feedsInto}` : ''
                            }`
                          : ''}
                      </p>

                      {step.kind === 'ai' && hasPrompt && (
                        <div className="pl-6 mt-3">
                          {!promptOpen ? (
                            <button
                              type="button"
                              onClick={() => setOpenPromptId(step.id)}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Prompt anzeigen
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <button
                                  type="button"
                                  onClick={() => setOpenPromptId(null)}
                                  className="text-sm text-gray-500 hover:text-gray-800"
                                >
                                  Ausblenden
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyOne(step.id)}
                                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                                >
                                  {copiedId === step.id ? (
                                    <Check size={14} />
                                  ) : (
                                    <Copy size={14} />
                                  )}
                                  {copiedId === step.id ? 'Kopiert' : 'Kopieren'}
                                </button>
                              </div>
                              <textarea
                                value={promptTexts[step.id] ?? step.prompt ?? ''}
                                onChange={(e) =>
                                  setPromptTexts((prev) => ({
                                    ...prev,
                                    [step.id]: e.target.value,
                                  }))
                                }
                                rows={14}
                                className="w-full border border-gray-200 rounded-md p-3 text-sm font-mono text-gray-800 leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                              <div className="space-y-2 text-sm text-gray-500 leading-relaxed">
                                {step.contextHint && (
                                  <p>
                                    <span className="text-gray-600">Kontext: </span>
                                    {step.contextHint}
                                  </p>
                                )}
                                {step.functionsHint && (
                                  <p>
                                    <span className="text-gray-600">Funktion: </span>
                                    {step.functionsHint}
                                  </p>
                                )}
                                {step.boundaries && (
                                  <p>
                                    <span className="text-gray-600">Grenzen: </span>
                                    {step.boundaries}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={resetAll}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Neue Knacknuss beginnen
                </button>
              </div>
            </Section>
          </section>
        )}
      </main>

      {error && (
        <div
          className="fixed bottom-5 right-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md"
          role="alert"
        >
          <strong className="font-bold">Fehler: </strong>
          <span>{error}</span>
          <button className="absolute top-1 right-2" onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <Footer onShowModal={setModalContent} />

      {modalContent === 'imprint' && (
        <Modal title="Impressum" onClose={() => setModalContent(null)}>
          <p>
            Angaben gemäss Schweizer Recht. Betreiber und Kontakt finden Sie auf der
            öffentlichen Projektseite bzw. im GitHub-Repository von Eduprompt.
          </p>
        </Modal>
      )}
      {modalContent === 'privacy' && (
        <Modal title="Datenschutz" onClose={() => setModalContent(null)}>
          <p>
            Chat- und Formulardaten werden zur Generierung an die OpenAI-API (USA)
            übermittelt und nicht dauerhaft auf diesem Server gespeichert. Nutzen Sie
            keine personenbezogenen Schülerdaten ohne Rechtsgrundlage.
          </p>
        </Modal>
      )}
    </div>
  );
}
