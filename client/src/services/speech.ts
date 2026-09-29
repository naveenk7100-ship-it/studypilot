/**
 * Voice-ready architecture for StudyPilot
 * Strictly utilizes native browser Speech APIs when available.
 * Never fakes audio recognition or synthesis.
 */

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      }
    }
  }

  startListening(onResult: (text: string) => void, onEnd: () => void, onError: (err: string) => void) {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser.');
      return;
    }

    if (this.isListening) return;

    this.recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onResult(transcript);
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      onError(`Speech recognition error: ${event.error || 'Failed to detect audio'}`);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e: any) {
      this.isListening = false;
      onError(e.message || 'Microphone access failed');
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  speak(text: string, onEnd?: () => void) {
    if (!isSpeechSynthesisSupported()) return;

    window.speechSynthesis.cancel(); // cancel any active speech

    // Clean markdown headings, asterisks, math markers before speaking
    const cleaned = text
      .replace(/#+/g, '')
      .replace(/\*+/g, '')
      .replace(/\$+/g, '')
      .replace(/\[\s*x?\s*\]/gi, '')
      .slice(0, 1000); // limit spoken chunk for pleasant pacing

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    if (onEnd) utterance.onend = onEnd;

    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}

export const speechService = new SpeechService();
