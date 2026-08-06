'use client';

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

interface ISpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

function getSpeechRecognitionCtor(): { new (): ISpeechRecognition } | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    SpeechRecognition?: { new (): ISpeechRecognition };
    webkitSpeechRecognition?: { new (): ISpeechRecognition };
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

/**
 * Prefer Swiss High German (de-CH): better for CH accent / Swiss German speakers.
 * Browser APIs have no reliable Mundart model; de-CH is the closest practical choice.
 */
export function resolveSpeechLang(): string {
  if (typeof navigator === 'undefined') return 'de-CH';
  const candidates = [
    ...(navigator.languages || []),
    navigator.language,
  ]
    .filter(Boolean)
    .map((l) => l.toLowerCase());

  for (const lang of candidates) {
    if (lang.startsWith('de-at')) return 'de-AT';
    if (lang.startsWith('de-de')) return 'de-DE';
    if (lang.startsWith('de-ch') || lang.startsWith('gsw')) return 'de-CH';
  }

  // Product default: Swiss locale (covers de / unspecified)
  return 'de-CH';
}

function joinTranscriptParts(...parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(' ');
}

export function useSpeechRecognition(
  input: string,
  setInput: Dispatch<SetStateAction<string>>,
  setError: (message: string | null) => void
) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const wantRecordingRef = useRef(false);
  const baseInputRef = useRef('');
  const finalTranscriptRef = useRef('');
  const inputRef = useRef(input);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    return () => {
      wantRecordingRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const stopRecognition = useCallback(() => {
    wantRecordingRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setIsRecording(false);
  }, []);

  const startRecognition = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError('Spracherkennung wird von deinem Browser nicht unterstützt.');
      return;
    }

    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }

    const recognition = new Ctor();
    recognition.lang = resolveSpeechLang();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    baseInputRef.current = inputRef.current;
    finalTranscriptRef.current = '';
    wantRecordingRef.current = true;
    setIsRecording(true);
    setError(null);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalTranscriptRef.current = joinTranscriptParts(
            finalTranscriptRef.current,
            transcript
          );
        } else {
          interim += transcript;
        }
      }
      setInput(
        joinTranscriptParts(
          baseInputRef.current,
          finalTranscriptRef.current,
          interim
        )
      );
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Benign in continuous mode: silence gaps / manual stop
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      wantRecordingRef.current = false;
      setError('Fehler bei der Spracherkennung: ' + (event.error || 'Unbekannt'));
      setIsRecording(false);
    };

    recognition.onend = () => {
      // Chrome often ends sessions after pauses even with continuous=true
      if (wantRecordingRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          wantRecordingRef.current = false;
        }
      }
      setIsRecording(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      wantRecordingRef.current = false;
      setIsRecording(false);
      setError('Spracherkennung konnte nicht gestartet werden.');
    }
  }, [setError, setInput]);

  return { isRecording, startRecognition, stopRecognition };
}
