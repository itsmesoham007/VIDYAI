'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  BookOpen, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Copy, 
  ChevronRight,
  Calculator,
  PenTool,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  Mic,
  MicOff
} from 'lucide-react';
import katex from 'katex';
import { ChatMessage, api } from '@/lib/api';
import { MarkdownWithMath } from '@/lib/renderMarkdown';
import { 
  cleanMathForSpeech, 
  speakNaturalText, 
  stopSpeech, 
  startSpeechRecognition, 
  isSpeechRecognitionSupported 
} from '@/lib/speech';

interface SeniorAcademicUIProps {
  grade: number;
  subject: string;
  language: string;
  socraticMode: boolean;
  onOpenQuiz: () => void;
  onOpenDoubtUpload: () => void;
  onOpenHintBar: () => void;
  onOpenWhiteboard?: () => void;
  onOpenFlashcards?: () => void;
}

export const SeniorAcademicUI: React.FC<SeniorAcademicUIProps> = ({
  grade,
  subject,
  language,
  socraticMode,
  onOpenQuiz,
  onOpenDoubtUpload,
  onOpenHintBar,
  onOpenWhiteboard,
  onOpenFlashcards
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Welcome to the Senior Academic Workspace for GSEB Class ${grade} ${subject} (English Medium).\nI am Prof. Vidya. How may I assist you with your GSEB concepts, textbook derivations, or Board examination preparation today?`,
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'formulas' | 'scratchpad' | 'tips'>('formulas');
  const [scratchpadText, setScratchpadText] = useState(
    '// Rough Work & Derivation Scratchpad\n// Step 1: Write given values in SI units\n'
  );
  const [suggestedFollowups, setSuggestedFollowups] = useState<string[]>([
    "Derive Coulomb's Law from Gauss's Law",
    "Calculate electric flux through a cylinder",
    "High-yield 3-mark Board exam questions"
  ]);

  // Voice State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      stopSpeech();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  const handleToggleVoiceInput = () => {
    if (!isSpeechRecognitionSupported()) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      return;
    }

    setIsListening(true);
    const rec = startSpeechRecognition({
      language,
      continuous: false,
      onInterimResult: (transcript: string) => setInputText(transcript),
      onFinalResult: (transcript: string) => {
        setInputText(transcript);
        setIsListening(false);
      },
      onError: () => setIsListening(false),
      onEnd: () => setIsListening(false)
    });
    recognitionRef.current = rec;
  };

  const handleSpeakMessage = (text: string, index: number) => {
    if (speakingIndex === index) {
      stopSpeech();
      setSpeakingIndex(null);
      return;
    }

    setSpeakingIndex(index);
    speakNaturalText(text, {
      language,
      grade,
      onStart: () => setSpeakingIndex(index),
      onEnd: () => setSpeakingIndex(null),
      onError: () => setSpeakingIndex(null)
    });
  };

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `Welcome to the Senior Academic Workspace for GSEB Class ${grade} ${subject} (English Medium).\nI am Prof. Vidya. How may I assist you with your GSEB concepts, textbook derivations, or Board examination preparation today?`,
        timestamp: Date.now()
      }
    ]);
  }, [grade, subject]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Safe KaTeX renderer for text containing $...$ or $$...$$
  const renderFormattedMath = (text: string) => {
    const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
          return <div key={index} className="my-2.5 overflow-x-auto py-1" dangerouslySetInnerHTML={{ __html: html }} />;
        } catch {
          return <code key={index} className="block my-1 font-mono text-xs">{part}</code>;
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return <span key={index} className="inline px-0.5" dangerouslySetInnerHTML={{ __html: html }} />;
        } catch {
          return <code key={index} className="font-mono text-xs">{part}</code>;
        }
      }
      return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim() || loading) return;

    const newMsg: ChatMessage = { role: 'user', content: textToSend, timestamp: Date.now() };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.sendMessage(
        updatedMessages,
        grade,
        subject,
        'Senior Academic Inquiry',
        language,
        socraticMode
      );
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: response.reply,
        timestamp: Date.now()
      }]);
      if (response.suggested_followups && response.suggested_followups.length > 0) {
        setSuggestedFollowups(response.suggested_followups);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formulasBySubject: { [key: string]: { name: string; formula: string; desc: string }[] } = {
    Physics: [
      { name: "Coulomb's Law", formula: "F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{q_1 q_2}{r^2}", desc: "Force between two point charges in vacuum" },
      { name: "Gauss's Law", formula: "\\Phi = \\oint \\vec{E} \\cdot d\\vec{A} = \\frac{Q_{\\text{enc}}}{\\varepsilon_0}", desc: "Total flux through closed surface" },
      { name: "Electric Potential", formula: "V = \\frac{1}{4\\pi\\varepsilon_0}\\frac{q}{r}", desc: "Potential due to point charge" },
      { name: "Capacitance", formula: "C = \\frac{\\varepsilon_0 A}{d}", desc: "Parallel plate capacitor with vacuum" },
      { name: "Drift Velocity", formula: "v_d = \\frac{e E \\tau}{m}", desc: "Average velocity of electrons in conductor" }
    ],
    Chemistry: [
      { name: "Ideal Gas Equation", formula: "P V = n R T", desc: "Equation of state for ideal gas" },
      { name: "Nernst Equation", formula: "E = E^\\circ - \\frac{0.0591}{n} \\log_{10} Q", desc: "Cell potential at 298 K" },
      { name: "Arrhenius Equation", formula: "k = A e^{-\\frac{E_a}{R T}}", desc: "Temperature dependence of reaction rate" },
      { name: "Raoult's Law", formula: "P_A = x_A P_A^\\circ", desc: "Vapor pressure of volatile component in solution" }
    ],
    Biology: [
      { name: "Photosynthesis Net Equation", formula: "6CO_2 + 12H_2O \\xrightarrow{light} C_6H_{12}O_6 + 6O_2 + 6H_2O", desc: "Light and dark reactions net conversion" },
      { name: "Hardy-Weinberg Principle", formula: "p^2 + 2pq + q^2 = 1", desc: "Genetic equilibrium in large population" },
      { name: "Cardiac Output", formula: "\\text{Cardiac Output} = \\text{Stroke Volume} \\times \\text{Heart Rate}", desc: "Volume of blood pumped by ventricles per min (~5L)" }
    ],
    Mathematics: [
      { name: "Quadratic Formula", formula: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", desc: "Roots of ax² + bx + c = 0" },
      { name: "Integration by Parts", formula: "\\int u \\, dv = u v - \\int v \\, du", desc: "Product rule for definite/indefinite integrals" },
      { name: "Derivative Definition", formula: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}", desc: "First principle of differentiation" },
      { name: "Euler's Formula", formula: "e^{i \\theta} = \\cos\\theta + i\\sin\\theta", desc: "Relationship between trigonometric and exponential forms" }
    ],
    Science: [
      { name: "Ohm's Law", formula: "V = I \\cdot R", desc: "Potential difference across conductor" },
      { name: "Specific Heat", formula: "Q = m \\cdot c \\cdot \\Delta T", desc: "Heat absorbed or liberated" },
      { name: "Mirror Formula", formula: "\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}", desc: "Spherical mirror focal length relationship" }
    ],
    "Computer Studies": [
      { name: "De Morgan's Laws", formula: "\\overline{A + B} = \\overline{A} \\cdot \\overline{B}, \\quad \\overline{A \\cdot B} = \\overline{A} + \\overline{B}", desc: "Boolean algebra simplification identities" },
      { name: "Binary to Decimal", formula: "N = \\sum_{i=0}^{n-1} b_i 2^i", desc: "Radix-2 positional numeral expansion" }
    ]
  };

  const currentFormulas = formulasBySubject[subject] || formulasBySubject['Physics'];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-70px)] bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* Left Workspace: Rigorous Academic Socratic Chat */}
      <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-950/80 min-w-0">
        
        {/* Academic Channel Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-sm">
              PV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-200">Prof. Vidya</span>
                <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full font-medium">
                  Class {grade} {subject}
                </span>
                {socraticMode && (
                  <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-medium">
                    Socratic Scaffolding
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">GSEB English Medium Academic Mentor & Derivation Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenWhiteboard && (
              <button
                onClick={onOpenWhiteboard}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5"
                title="Open Canvas Whiteboard"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Whiteboard</span>
              </button>
            )}
            {onOpenFlashcards && (
              <button
                onClick={onOpenFlashcards}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5"
                title="Open Revision Flashcards"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Flashcards</span>
              </button>
            )}
            <button
              onClick={onOpenHintBar}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3-Stage Hints</span>
            </button>
            <button
              onClick={onOpenQuiz}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Practice MCQs</span>
            </button>
          </div>
        </div>

        {/* Chat History Pane */}
        <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    PV
                  </div>
                )}
                <div
                  className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white shadow-md rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 shadow-sm rounded-tl-none'
                  }`}
                >
                  <div className="space-y-1">
                    <MarkdownWithMath content={m.content} className={isUser ? "text-white" : "text-slate-100"} />
                  </div>
                  {!isUser && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <button
                        onClick={() => handleSpeakMessage(m.content, idx)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${
                          speakingIndex === idx
                            ? 'bg-rose-900/80 text-rose-200 border border-rose-700 animate-pulse'
                            : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white'
                        }`}
                      >
                        {speakingIndex === idx ? (
                          <>
                            <VolumeX className="w-3 h-3 text-rose-300" />
                            <span>Stop ⏹️</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-blue-400" />
                            <span>Read Aloud 🔊</span>
                          </>
                        )}
                      </button>
                      <span className="font-mono text-[10px] text-slate-500">Class {grade} {subject}</span>
                    </div>
                  )}
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    You
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic pl-11">
              <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
              <span>Prof. Vidya is formulating the concept and verifying KaTeX derivation...</span>
            </div>
          )}


        </div>

        {/* Suggested Academic Followups */}
        {suggestedFollowups.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex-shrink-0">Next Steps:</span>
            {suggestedFollowups.map((sf, i) => (
              <button
                key={i}
                onClick={() => handleSend(sf)}
                className="flex-shrink-0 px-3 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-blue-300 font-medium transition-colors"
              >
                {sf}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800">
          <div className="flex items-center gap-2.5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? 'Listening to your voice... Speak now!' : 'Ask a conceptual doubt, derivation step, or exam numerical...'}
              className="flex-1 bg-slate-950 border border-slate-700/80 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleToggleVoiceInput}
              className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-rose-600 text-white ring-2 ring-rose-400 animate-pulse'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
              title={isListening ? 'Stop recording voice' : 'Dictate question via voice'}
            >
              {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-amber-400" />}
            </button>
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || loading}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </div>
        </div>

      </div>

      {/* Right Split Panel: Formula Cheat-Sheet, Derivation Scratchpad & Exam Tips */}
      <div className="w-full lg:w-96 flex flex-col bg-slate-900 border-t lg:border-t-0 border-slate-800">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 text-xs font-semibold bg-slate-950/60">
          <button
            onClick={() => setActiveTab('formulas')}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'formulas'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Formulas</span>
          </button>
          <button
            onClick={() => setActiveTab('scratchpad')}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'scratchpad'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Scratchpad</span>
          </button>
          <button
            onClick={() => setActiveTab('tips')}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'tips'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Board Tips</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {/* TAB 1: FORMULAS */}
          {activeTab === 'formulas' && (
            <div className="space-y-3">
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                High-Yield {subject} Formulas
              </div>
              {currentFormulas.map((f, i) => {
                let html = '';
                try {
                  html = katex.renderToString(f.formula, { displayMode: true, throwOnError: false });
                } catch {
                  html = f.formula;
                }
                return (
                  <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-blue-400">{f.name}</div>
                    <div className="py-1 text-slate-100 overflow-x-auto text-xs" dangerouslySetInnerHTML={{ __html: html }} />
                    <div className="text-[11px] text-slate-400 leading-tight">{f.desc}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: SCRATCHPAD */}
          {activeTab === 'scratchpad' && (
            <div className="flex flex-col h-full space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Personal Derivation Notepad</span>
                <button
                  onClick={() => setScratchpadText('')}
                  className="text-xs text-rose-400 hover:underline capitalize"
                >
                  Clear
                </button>
              </div>
              <textarea
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                placeholder="Type your intermediate calculations, assumptions, or formulas..."
                className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none min-h-[300px]"
              />
              <p className="text-[10px] text-slate-500">
                Tip: Notes remain preserved locally during your study session.
              </p>
            </div>
          )}

          {/* TAB 3: BOARD EXAM TIPS */}
          {activeTab === 'tips' && (
            <div className="space-y-3">
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                GSEB Board Marking Scheme Insights
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-900/50 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Step Marking Rule (GSEB English Medium)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  In GSEB 3-mark and 4-mark numericals, 1 full mark is allocated to stating the core formula with explicit SI units before substituting numerical variables.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-900/50 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Common Sign Convention Traps</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  When dealing with Coulomb&apos;s Law or Optics, do NOT plug negative charge signs into scalar force magnitudes. Calculate magnitude first, then assign vector directions!
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="text-xs font-bold text-emerald-400">
                  Derivations Checklist
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                  <li>Electric dipole axial & equatorial fields</li>
                  <li>Capacitance with dielectric slab ($K$)</li>
                  <li>Kirchhoff&apos;s loop equations in multi-loop circuits</li>
                </ul>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
