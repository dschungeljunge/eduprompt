'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

type Message = { role: 'user' | 'assistant'; content: string };

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

type Phase =
  | 'start'
  | 'talk'
  | 'ready'
  | 'leaving'
  | 'proposals'
  | 'to-detail'
  | 'detail';

const emptyChecklist = (): Checklist => ({
  herausforderung: false,
  wirkung: false,
  zielgruppe: false,
  rahmen: false,
  bedingungen: false,
});

const CHECKLIST_LABELS: { key: keyof Checklist; label: string }[] = [
  { key: 'herausforderung', label: 'Herausforderung' },
  { key: 'wirkung', label: 'Lernziel' },
  { key: 'zielgruppe', label: 'Zielgruppe' },
  { key: 'rahmen', label: 'Zeitrahmen' },
  { key: 'bedingungen', label: 'Bedingungen' },
];

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Soften API phrasing like „Passt, weil …“ for display. */
function formatFit(text: string) {
  const cleaned = text.replace(/^passt,?\s*weil\s+/i, '').trim();
  if (!cleaned) return text;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export default function HomePage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [checklist, setChecklist] = useState<Checklist>(emptyChecklist);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('start');
  const [proposalsVisible, setProposalsVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [proposals, setProposals] = useState<Proposal[] | null>(null);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [elaborated, setElaborated] = useState<Elaborated | null>(null);
  const [loadingElaborate, setLoadingElaborate] = useState(false);
  const [openPromptId, setOpenPromptId] = useState<string | null>(null);
  const [promptTexts, setPromptTexts] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<'imprint' | 'privacy' | null>(
    null
  );

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isRecording, startRecognition, stopRecognition } = useSpeechRecognition(
    input,
    setInput,
    setError
  );

  const doneCount = CHECKLIST_LABELS.filter((p) => checklist[p.key]).length;
  const coreReady = checklist.herausforderung && checklist.wirkung;
  const showCaret = !input && !thinking && !isRecording;
  const inChat =
    phase === 'start' ||
    phase === 'talk' ||
    phase === 'ready' ||
    phase === 'leaving';
  const showChecklist = phase === 'talk' || phase === 'ready';
  const showWaiting =
    phase === 'leaving' ||
    phase === 'to-detail' ||
    loadingProposals ||
    (loadingElaborate && phase === 'proposals');


  useEffect(() => {
    if (phase === 'start' || phase === 'talk') {
      inputRef.current?.focus();
    }
  }, [phase]);

  useEffect(() => {
    if (messages.length > 0 && inChat) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, thinking, inChat]);

  useEffect(() => {
    if (coreReady && phase === 'talk') setPhase('ready');
  }, [coreReady, phase]);

  useEffect(() => {
    return () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  async function sendMessage() {
    const text = input.trim();
    if (!text || thinking || !inChat || phase === 'leaving') return;

    const userMsg: Message = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setThinking(true);
    setError(null);
    if (phase === 'start') setPhase('talk');

    try {
      const res = await fetch('/api/v2/input-ki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setMessages(messages);
      } else {
        setMessages([
          ...nextMessages,
          { role: 'assistant', content: data.reply },
        ]);
        if (data.checklist) {
          setChecklist({
            herausforderung: Boolean(data.checklist.herausforderung),
            wirkung: Boolean(data.checklist.wirkung),
            zielgruppe: Boolean(data.checklist.zielgruppe),
            rahmen: Boolean(data.checklist.rahmen),
            bedingungen: Boolean(data.checklist.bedingungen),
          });
        }
      }
    } catch {
      setError('Serverfehler.');
      setMessages(messages);
    } finally {
      setThinking(false);
    }
  }

  async function showProposals() {
    if (phase !== 'ready' || loadingProposals) return;
    setLoadingProposals(true);
    setError(null);
    setPhase('leaving');
    setProposalsVisible(false);
    setProposals(null);
    setElaborated(null);

    try {
      const res = await fetch('/api/v2/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setPhase('ready');
        return;
      }
      setProposals(data.proposals);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
      leaveTimer.current = setTimeout(() => {
        setPhase('proposals');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setProposalsVisible(true));
        });
      }, 420);
    } catch {
      setError('Serverfehler bei den Vorschlägen.');
      setPhase('ready');
    } finally {
      setLoadingProposals(false);
    }
  }

  function backToChat() {
    setProposalsVisible(false);
    setElaborated(null);
    setOpenPromptId(null);
    setPhase('ready');
  }

  async function selectProposal(proposal: Proposal) {
    if (phase !== 'proposals' || loadingElaborate) return;
    setLoadingElaborate(true);
    setError(null);
    setOpenPromptId(null);
    setPhase('to-detail');
    setElaborated(null);

    try {
      const res = await fetch('/api/v2/elaborate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, proposal }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setPhase('proposals');
        setProposalsVisible(true);
        return;
      }
      setElaborated(data);
      const texts: Record<string, string> = {};
      data.steps?.forEach((s: ElaboratedStep) => {
        if (s.prompt) texts[s.id] = s.prompt;
      });
      setPromptTexts(texts);

      if (leaveTimer.current) clearTimeout(leaveTimer.current);
      leaveTimer.current = setTimeout(() => {
        setProposalsVisible(false);
        setPhase('detail');
        setDetailVisible(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setDetailVisible(true));
        });
      }, 380);
    } catch {
      setError('Serverfehler bei der Ausarbeitung.');
      setPhase('proposals');
      setProposalsVisible(true);
    } finally {
      setLoadingElaborate(false);
    }
  }

  function backToProposals() {
    setDetailVisible(false);
    setOpenPromptId(null);
    setElaborated(null);
    setPhase('proposals');
    setProposalsVisible(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setProposalsVisible(true));
    });
  }

  async function copyPrompt(stepId: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(stepId);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      /* ignore */
    }
  }

  function exportAsWord() {
    if (!elaborated) return;

    const stepsHtml = elaborated.steps
      .map((step) => {
        const promptText = promptTexts[step.id] ?? step.prompt;
        const promptBlock = promptText
          ? `<p><strong>Prompt</strong></p>
             <pre style="white-space:pre-wrap;font-family:Calibri,sans-serif;font-size:11pt;">${escapeHtml(promptText)}</pre>
             ${
               step.contextHint
                 ? `<p><em>Kontext:</em> ${escapeHtml(step.contextHint)}</p>`
                 : ''
             }
             ${
               step.functionsHint
                 ? `<p><em>Funktion:</em> ${escapeHtml(step.functionsHint)}</p>`
                 : ''
             }
             ${
               step.boundaries
                 ? `<p><em>Grenzen:</em> ${escapeHtml(step.boundaries)}</p>`
                 : ''
             }`
          : '';
        const artifact = step.artifactOut
          ? `<p><em>Übergabe:</em> ${escapeHtml(step.artifactOut)}</p>`
          : '';
        return `
          <h2 style="font-size:14pt;margin:18pt 0 6pt;">${step.number}. ${escapeHtml(step.title)}</h2>
          <p>${escapeHtml(step.summary)}</p>
          ${artifact}
          ${promptBlock}
        `;
      })
      .join('');

    const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escapeHtml(elaborated.title)}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>
  body { font-family: Calibri, sans-serif; font-size: 11pt; color: #1a2e2b; line-height: 1.45; }
  h1 { font-size: 18pt; font-weight: 600; margin-bottom: 4pt; }
  .meta { color: #666; margin-bottom: 18pt; }
</style>
</head>
<body>
  <h1>${escapeHtml(elaborated.title)}</h1>
  <p class="meta">${escapeHtml(elaborated.duration)} · Eduprompt</p>
  ${stepsHtml}
</body>
</html>`;

    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = elaborated.title
      .toLowerCase()
      .replace(/[^a-z0-9äöüß]+/gi, '-')
      .replace(/^-|-$/g, '');
    a.href = url;
    a.download = `${safeName || 'eduprompt'}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setCopiedId('export');
    setTimeout(() => setCopiedId(null), 1800);
  }

  function toggleMic() {
    if (thinking || phase === 'leaving' || phase === 'proposals' || phase === 'detail' || phase === 'to-detail')
      return;
    if (isRecording) stopRecognition();
    else startRecognition();
  }

  function resetAll() {
    stopRecognition();
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setMessages([]);
    setChecklist(emptyChecklist());
    setInput('');
    setPhase('start');
    setThinking(false);
    setError(null);
    setProposalsVisible(false);
    setDetailVisible(false);
    setProposals(null);
    setElaborated(null);
    setOpenPromptId(null);
    setPromptTexts({});
    setCopiedId(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div className="v3-root min-h-screen">
      <div className="v3-shell">
        <aside
          className={`v3-progress ${showChecklist ? 'is-visible' : ''}`}
          aria-label="Checkliste"
        >
          <p className="v3-progress-title">Checkliste</p>
          <ol>
            {CHECKLIST_LABELS.map((item, i) => {
              const done = checklist[item.key];
              const current =
                !done &&
                CHECKLIST_LABELS.findIndex((p) => !checklist[p.key]) === i;
              return (
                <li
                  key={item.key}
                  className={`${done ? 'done' : ''} ${current ? 'current' : ''}`}
                >
                  <span className="v3-dot" aria-hidden />
                  <span>{item.label}</span>
                </li>
              );
            })}
          </ol>
          <p
            style={{
              marginTop: '2rem',
              fontSize: '0.68rem',
              color: 'var(--mute)',
              letterSpacing: '0.04em',
            }}
          >
            {doneCount}/{CHECKLIST_LABELS.length}
          </p>
        </aside>

        <div className="v3-main">
          <div className="v3-topbar">
            <span className="v3-brand">Eduprompt</span>
            <div className="v3-tools">
              {(phase !== 'start' || messages.length > 0) && (
                <button type="button" onClick={resetAll}>
                  Neu starten
                </button>
              )}
            </div>
          </div>

          <div
            className={`v3-progress-mobile ${showChecklist ? 'is-visible' : ''}`}
            aria-label="Checkliste"
          >
            {CHECKLIST_LABELS.map((item) => (
              <span
                key={item.key}
                className={`v3-chip ${checklist[item.key] ? 'done' : ''}`}
              >
                {checklist[item.key] ? '●' : '○'} {item.label}
              </span>
            ))}
          </div>

          {showWaiting && (
            <div className="v3-stage v3-waiting" aria-live="polite">
              <p className="v3-waiting-text">Eduprompt denkt nach</p>
            </div>
          )}

          {inChat && !showWaiting && (
            <div className={`v3-stage ${phase !== 'start' ? 'is-talk' : ''}`}>
              <div className="v3-cluster">
                <h1 className="v3-question">
                  Was möchtest du heute mit deiner Klasse erreichen?
                </h1>

                {messages.length > 0 && (
                  <div className="v3-thread" aria-live="polite">
                    {messages.map((t, i) => (
                      <div
                        key={i}
                        className={`v3-turn ${
                          t.role === 'user' ? 'is-user' : 'is-assistant'
                        }`}
                      >
                        <span className="v3-who">
                          {t.role === 'user' ? 'Du' : 'Eduprompt'}
                        </span>
                        <p>{t.content}</p>
                      </div>
                    ))}
                    {thinking && <p className="v3-thinking">denkt nach …</p>}
                    <div ref={endRef} />
                  </div>
                )}

                <div className="v3-compose">
                  <div
                    className={`v3-field ${isRecording ? 'is-recording' : ''}`}
                  >
                    <div className="v3-input-wrap">
                      {showCaret && <span className="v3-caret" aria-hidden />}
                      {isRecording && (
                        <span className="v3-listening" aria-live="polite">
                          hört zu …
                        </span>
                      )}
                      <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        aria-label="Nachricht"
                        disabled={isRecording}
                        className={!input ? 'is-empty' : undefined}
                        onChange={(e) => {
                          setInput(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = `${Math.min(
                            e.target.scrollHeight,
                            128
                          )}px`;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            void sendMessage();
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className={`v3-icon-btn ${isRecording ? 'is-active' : ''}`}
                      aria-label={
                        isRecording ? 'Aufnahme stoppen' : 'Sprechen'
                      }
                      aria-pressed={isRecording}
                      disabled={thinking}
                      onClick={toggleMic}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden
                      >
                        <rect
                          x="5.5"
                          y="1.5"
                          width="5"
                          height="8"
                          rx="2.5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                        />
                        <path
                          d="M3.5 7.5a4.5 4.5 0 0 0 9 0"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M8 12v2.5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="v3-send"
                      aria-label="Senden"
                      disabled={!input.trim() || thinking || isRecording}
                      onClick={() => void sendMessage()}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M7 12V2M7 2L2.5 6.5M7 2L11.5 6.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  <div
                    className={`v3-cta ${
                      phase === 'ready' && !loadingProposals ? 'is-visible' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => void showProposals()}
                      disabled={loadingProposals}
                    >
                      Vorschläge anzeigen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {phase === 'proposals' && !showWaiting && (
            <div className="v3-stage is-proposals">
              <div
                className={`v3-proposals ${
                  proposalsVisible ? 'is-visible' : ''
                }`}
              >
                <ol className="v3-proposal-list">
                  {(proposals ?? []).map((p, i) => (
                    <li key={p.id} className="v3-proposal">
                      <div className="v3-proposal-body">
                        <div className="v3-proposal-head">
                          <span className="v3-proposal-num">0{i + 1}</span>
                          <h3 className="v3-proposal-name">{p.title}</h3>
                        </div>
                        <p className="v3-proposal-fit">
                          {formatFit(p.fitsBecause)}
                        </p>
                        <div className="v3-proposal-meta">
                          <span className="v3-proposal-duration">
                            {p.duration}
                          </span>
                          <ol className="v3-proposal-steps">
                            {p.steps.map((step) => (
                              <li key={`${p.id}-${step.number}`}>
                                {step.title}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="v3-proposal-go"
                        aria-label={`${p.title} wählen`}
                        disabled={loadingElaborate}
                        onClick={() => void selectProposal(p)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M3 8h10M9 4l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ol>

                <button
                  type="button"
                  className="v3-proposals-back"
                  onClick={backToChat}
                  disabled={loadingElaborate}
                >
                  Zurück zum Gespräch
                </button>
              </div>
            </div>
          )}

          {phase === 'detail' && elaborated && (
            <div className="v3-stage is-detail">
              <div
                className={`v3-detail ${detailVisible ? 'is-visible' : ''}`}
              >
                <button
                  type="button"
                  className="v3-detail-nav"
                  onClick={backToProposals}
                >
                  Andere Idee wählen
                </button>

                <div className="v3-detail-top">
                  <h2 className="v3-detail-title">
                    {elaborated.title}
                    <span className="v3-detail-duration">
                      {elaborated.duration}
                    </span>
                  </h2>
                  <button
                    type="button"
                    className="v3-detail-copyall"
                    onClick={exportAsWord}
                  >
                    {copiedId === 'export'
                      ? 'Gespeichert'
                      : 'Als Word exportieren'}
                  </button>
                </div>

                <ol className="v3-step-list">
                  {elaborated.steps.map((step) => {
                    const open = openPromptId === step.id;
                    const promptText =
                      promptTexts[step.id] ?? step.prompt ?? '';
                    return (
                      <li key={step.id} className="v3-step">
                        <div className="v3-step-head">
                          <span className="v3-step-num">0{step.number}</span>
                          <h3 className="v3-step-title">{step.title}</h3>
                        </div>
                        <p className="v3-step-summary">{step.summary}</p>
                        {step.artifactOut && (
                          <span className="v3-step-artifact">
                            Übergabe: {step.artifactOut}
                          </span>
                        )}

                        {step.kind === 'ai' && promptText && (
                          <>
                            {!open ? (
                              <button
                                type="button"
                                className="v3-prompt-toggle"
                                onClick={() => setOpenPromptId(step.id)}
                              >
                                Prompt anzeigen
                              </button>
                            ) : (
                              <div className="v3-prompt-panel">
                                <div className="v3-prompt-tools">
                                  <button
                                    type="button"
                                    onClick={() => setOpenPromptId(null)}
                                  >
                                    Ausblenden
                                  </button>
                                  <button
                                    type="button"
                                    className="is-accent"
                                    onClick={() =>
                                      void copyPrompt(step.id, promptText)
                                    }
                                  >
                                    {copiedId === step.id
                                      ? 'Kopiert'
                                      : 'Kopieren'}
                                  </button>
                                </div>
                                <textarea
                                  className="v3-prompt-box"
                                  value={promptText}
                                  aria-label={`Prompt für ${step.title}`}
                                  onChange={(e) =>
                                    setPromptTexts((prev) => ({
                                      ...prev,
                                      [step.id]: e.target.value,
                                    }))
                                  }
                                />
                                <div className="v3-prompt-notes">
                                  {step.contextHint && (
                                    <p className="v3-prompt-note">
                                      <strong>Kontext</strong>
                                      {step.contextHint}
                                    </p>
                                  )}
                                  {step.functionsHint && (
                                    <p className="v3-prompt-note">
                                      <strong>Funktion</strong>
                                      {step.functionsHint}
                                    </p>
                                  )}
                                  {step.boundaries && (
                                    <p className="v3-prompt-note">
                                      <strong>Grenzen</strong>
                                      {step.boundaries}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </li>
                    );
                  })}
                </ol>

                <button
                  type="button"
                  className="v3-proposals-back"
                  onClick={resetAll}
                  style={{ marginTop: '2rem' }}
                >
                  Neue Knacknuss beginnen
                </button>
              </div>
            </div>
          )}

          <footer
            style={{
              marginTop: 'auto',
              paddingTop: '2rem',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem 1.25rem',
              fontSize: '0.72rem',
              color: 'var(--mute)',
            }}
          >
            <button
              type="button"
              onClick={() => setModalContent('imprint')}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: 0,
                font: 'inherit',
              }}
            >
              Impressum
            </button>
            <button
              type="button"
              onClick={() => setModalContent('privacy')}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: 0,
                font: 'inherit',
              }}
            >
              Datenschutz
            </button>
            <Link href="/v1" style={{ color: 'inherit' }}>
              Version 1
            </Link>
          </footer>
        </div>
      </div>

      {error && (
        <div
          className="v3-note"
          style={{
            bottom: '1rem',
            right: '1rem',
            left: 'auto',
            maxWidth: '20rem',
            color: '#7a3030',
            borderColor: 'rgba(122, 48, 48, 0.25)',
            background: 'rgba(255, 245, 245, 0.95)',
          }}
          role="alert"
        >
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            style={{
              marginLeft: '0.75rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              font: 'inherit',
              textDecoration: 'underline',
            }}
          >
            Schliessen
          </button>
        </div>
      )}

      {modalContent && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'rgba(26, 46, 43, 0.35)',
            display: 'grid',
            placeItems: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setModalContent(null)}
        >
          <div
            style={{
              background: 'var(--paper)',
              color: 'var(--ink)',
              maxWidth: '28rem',
              width: '100%',
              padding: '1.5rem 1.75rem',
              border: '1px solid var(--line)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '1rem',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-v3-display), Georgia, serif',
                  fontSize: '1.25rem',
                  fontWeight: 500,
                }}
              >
                {modalContent === 'imprint' ? 'Impressum' : 'Datenschutz'}
              </h2>
              <button
                type="button"
                onClick={() => setModalContent(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--mute)',
                  font: 'inherit',
                }}
              >
                Schliessen
              </button>
            </div>
            {modalContent === 'imprint' ? (
              <p style={{ margin: 0, fontWeight: 300, lineHeight: 1.5 }}>
                Angaben gemäss Schweizer Recht. Betreiber und Kontakt finden Sie
                auf der öffentlichen Projektseite bzw. im GitHub-Repository von
                Eduprompt.
              </p>
            ) : (
              <p style={{ margin: 0, fontWeight: 300, lineHeight: 1.5 }}>
                Chat- und Formulardaten werden zur Generierung an die OpenAI-API
                (USA) übermittelt und nicht dauerhaft auf diesem Server
                gespeichert. Nutzen Sie keine personenbezogenen Schülerdaten ohne
                Rechtsgrundlage.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
