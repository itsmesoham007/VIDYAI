// VidyAI Natural Speech Engine (STT & TTS)
// Specifically converts LaTeX math, symbols, and Gujarati/Hindi curriculum concepts into natural spoken audio

// Helper to parse balanced curly braces in LaTeX formulas
function parseBraces(str: string, startIndex: number): { content: string; endIndex: number } | null {
  if (str[startIndex] !== '{') return null;
  let depth = 0;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) {
        return { content: str.substring(startIndex + 1, i), endIndex: i };
      }
    }
  }
  return null;
}

// Recursively convert \frac{numerator}{denominator} -> numerator over denominator
function cleanFractions(text: string): string {
  let result = '';
  let i = 0;
  while (i < text.length) {
    if (text.startsWith('\\frac', i)) {
      let firstBrace = i + 5;
      while (firstBrace < text.length && text[firstBrace] === ' ') firstBrace++;
      const num = parseBraces(text, firstBrace);
      if (num) {
        let secondBrace = num.endIndex + 1;
        while (secondBrace < text.length && text[secondBrace] === ' ') secondBrace++;
        const den = parseBraces(text, secondBrace);
        if (den) {
          result += ` (${cleanFractions(num.content)} over ${cleanFractions(den.content)}) `;
          i = den.endIndex + 1;
          continue;
        }
      }
    }
    result += text[i];
    i++;
  }
  return result;
}

// Convert \sqrt{content} -> square root of (content)
function cleanRoots(text: string): string {
  let result = '';
  let i = 0;
  while (i < text.length) {
    if (text.startsWith('\\sqrt', i)) {
      let firstBrace = i + 5;
      while (firstBrace < text.length && text[firstBrace] === ' ') firstBrace++;
      const root = parseBraces(text, firstBrace);
      if (root) {
        result += ` square root of (${cleanRoots(root.content)}) `;
        i = root.endIndex + 1;
        continue;
      }
    }
    result += text[i];
    i++;
  }
  return result;
}

export const cleanMathForSpeech = (text: string): string => {
  if (!text) return '';

  let processed = cleanFractions(text);
  processed = cleanRoots(processed);

  return processed
    // Replace markdown images with natural phrase
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, ' Here is a picture of $1. ')
    // Remove markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/^>\s+/gm, '')
    // Replace Greek letters with spoken names
    .replace(/\\alpha/g, 'alpha')
    .replace(/\\beta/g, 'beta')
    .replace(/\\gamma/g, 'gamma')
    .replace(/\\theta/g, 'theta')
    .replace(/\\lambda/g, 'lambda')
    .replace(/\\mu/g, 'micro')
    .replace(/\\pi/g, 'pi')
    .replace(/\\rho/g, 'rho')
    .replace(/\\sigma/g, 'sigma')
    .replace(/\\tau/g, 'tau')
    .replace(/\\phi/g, 'phi')
    .replace(/\\Phi/g, 'phi')
    .replace(/\\omega/g, 'omega')
    .replace(/\\Omega/g, 'ohms')
    .replace(/\\varepsilon_0|\\epsilon_0/g, 'epsilon zero')
    .replace(/\\Delta/g, 'delta')
    // Math operations
    .replace(/\\oint/g, 'closed integral of')
    .replace(/\\int/g, 'integral of')
    .replace(/\\cdot/g, ' times ')
    .replace(/\\times/g, ' times ')
    .replace(/\\pm/g, 'plus or minus')
    .replace(/\\to|\\rightarrow/g, 'yields')
    .replace(/\\le|\\leq/g, 'less than or equal to')
    .replace(/\\ge|\\geq/g, 'greater than or equal to')
    .replace(/\\neq/g, 'not equal to')
    .replace(/\\approx/g, 'approximately equal to')
    .replace(/\\infty/g, 'infinity')
    .replace(/\\vec\{([^}]+)\}/g, 'vector $1')
    .replace(/\\hat\{([^}]+)\}/g, 'unit vector $1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\left|\\right/g, '')
    // Exponents
    .replace(/\^2\b|\^\{2\}/g, ' squared')
    .replace(/\^3\b|\^\{3\}/g, ' cubed')
    .replace(/\^([0-9a-zA-Z]+)|\^\{([^}]+)\}/g, ' to the power of $1$2')
    // Subscripts
    .replace(/_([0-9a-zA-Z]+)|_\{([^}]+)\}/g, ' sub $1$2')
    // Clean dollar signs
    .replace(/\$\$([\s\S]*?)\$\$/g, ' $1 ')
    .replace(/\$([^$]+)\$/g, ' $1 ')
    .replace(/\$/g, '')
    // Clean leftover braces
    .replace(/[{}\\_]/g, ' ')
    // Clean redundant spaces and newlines
    .replace(/\s+/g, ' ')
    .trim();
};

export interface VoiceOptions {
  language?: string;
  grade?: number;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export const getSpeechVoice = (lang: string = 'en', grade: number = 10): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Language mapping
  let targetLangPrefix = 'en-IN';
  if (lang === 'gu') targetLangPrefix = 'gu';
  else if (lang === 'hi' || lang === 'hinglish') targetLangPrefix = 'hi';
  else targetLangPrefix = 'en';

  // Find exact matching language voice
  let matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetLangPrefix.toLowerCase()));

  // Fallback to Indian English or any English
  if (!matchedVoice && (lang === 'en' || lang === 'hinglish')) {
    matchedVoice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('India')) ||
                   voices.find(v => v.lang.startsWith('en'));
  }

  return matchedVoice || voices[0] || null;
};

export const speakNaturalText = (text: string, options: VoiceOptions = {}): SpeechSynthesisUtterance | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return null;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const cleaned = cleanMathForSpeech(text);
  if (!cleaned) return null;

  const utterance = new SpeechSynthesisUtterance(cleaned);
  const grade = options.grade ?? 10;
  const isPrimary = grade <= 5;

  // Set Voice Pitch and Rate tailored to Persona
  if (options.pitch !== undefined) {
    utterance.pitch = options.pitch;
  } else if (isPrimary) {
    // "Vidya Didi" - cheerful, friendly, patient pace
    utterance.pitch = 1.15;
  } else {
    // "Prof. Vidya" - clear, articulate, measured academic pace
    utterance.pitch = 1.0;
  }

  if (options.rate !== undefined) {
    utterance.rate = options.rate;
  } else if (isPrimary) {
    utterance.rate = 0.9;
  } else {
    utterance.rate = 0.98;
  }

  // Set Language Code
  const lang = options.language || 'en';
  if (lang === 'gu') utterance.lang = 'gu-IN';
  else if (lang === 'hi' || lang === 'hinglish') utterance.lang = 'hi-IN';
  else utterance.lang = 'en-IN';

  const voice = getSpeechVoice(lang, grade);
  if (voice) utterance.voice = voice;

  if (options.onStart) utterance.onstart = options.onStart;
  if (options.onEnd) utterance.onend = options.onEnd;
  if (options.onError) utterance.onerror = options.onError;

  window.speechSynthesis.speak(utterance);
  return utterance;
};

export const stopSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

export interface RecognitionOptions {
  language?: string;
  continuous?: boolean;
  onInterimResult?: (transcript: string) => void;
  onFinalResult?: (transcript: string) => void;
  onError?: (err: any) => void;
  onEnd?: () => void;
}

export const startSpeechRecognition = (options: RecognitionOptions = {}): any => {
  if (typeof window === 'undefined') return null;

  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRec) {
    console.warn('SpeechRecognition API not available in this browser.');
    return null;
  }

  const recognition = new SpeechRec();
  recognition.continuous = options.continuous ?? false;
  recognition.interimResults = true;

  const lang = (options.language || 'en').toLowerCase();
  if (lang.startsWith('gu')) recognition.lang = 'gu-IN';
  else if (lang.startsWith('hi') || lang === 'hinglish') recognition.lang = 'hi-IN';
  else recognition.lang = 'en-IN';

  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';

    for (let i = 0; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    if (interim && options.onInterimResult) {
      options.onInterimResult(interim);
    }
    if (final && options.onFinalResult) {
      options.onFinalResult(final);
    }
  };

  if (options.onError) recognition.onerror = options.onError;
  if (options.onEnd) recognition.onend = options.onEnd;

  try {
    recognition.start();
    return recognition;
  } catch (e) {
    console.error('Speech recognition failed to start:', e);
    return null;
  }
};
