import { useRef, useState, useCallback, useEffect } from "react";
import type { Lang } from "../config/session";

// Web Speech API is browser-native and free. Provides real hands-free STT+TTS.
// Gracefully degrades to text input if the browser lacks support.

const LANG_LOCALE: Record<Lang, string> = {
  hi: "hi-IN",
  en: "en-IN",
  hinglish: "hi-IN", // Hindi locale handles Hinglish reasonably
  ta: "ta-IN",
  mr: "mr-IN",
};

export function useSpeech(language: Lang) {
  const [supported, setSupported] = useState({ stt: false, tts: false });
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const tts = typeof window !== "undefined" && "speechSynthesis" in window;
    setSupported({ stt: Boolean(SR), tts });
  }, []);

  const listen = useCallback(
    (onResult: (text: string) => void) => {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) return;
      const rec = new SR();
      rec.lang = LANG_LOCALE[language] || "en-IN";
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;

      let finalText = "";
      rec.onresult = (e: any) => {
        let interimText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t;
          else interimText += t;
        }
        setInterim(interimText || finalText);
      };
      rec.onerror = () => {
        setListening(false);
        setInterim("");
      };
      rec.onend = () => {
        setListening(false);
        setInterim("");
        if (finalText.trim()) onResult(finalText.trim());
      };

      recognitionRef.current = rec;
      setListening(true);
      rec.start();
    },
    [language]
  );

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  }, []);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!("speechSynthesis" in window)) {
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANG_LOCALE[language] || "en-IN";
      u.rate = 0.98;
      u.pitch = 1.0;
      // Prefer a matching-locale voice if available
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.lang === u.lang) || voices.find((v) => v.lang.startsWith((u.lang || "").split("-")[0]));
      if (match) u.voice = match;
      u.onend = () => onEnd?.();
      u.onerror = () => onEnd?.();
      window.speechSynthesis.speak(u);
    },
    [language]
  );

  const cancelSpeech = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  return { supported, listening, interim, listen, stop, speak, cancelSpeech };
}
