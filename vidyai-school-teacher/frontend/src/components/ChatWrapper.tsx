'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Copy, 
  Check, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Paperclip, 
  Lightbulb, 
  BookOpen, 
  GraduationCap, 
  PenTool, 
  Layers, 
  HelpCircle, 
  ChevronDown, 
  ArrowUp,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';
import { ChatMessage, api, ModelInfo } from '@/lib/api';
import { ChatSession } from '@/lib/chatHistory';
import { GsebBooksModal } from '@/components/GsebBooksModal';
import { MarkdownWithMath } from '@/lib/renderMarkdown';
import { 
  cleanMathForSpeech, 
  speakNaturalText, 
  stopSpeech 
} from '@/lib/speech';
import { VidyAILogo } from '@/components/VidyAILogo';

interface ChatWrapperProps {
  initialGrade?: number;
  initialSubject?: string;
  initialLanguage?: string;
  initialSocratic?: boolean;
  initialPrompt?: string;
  studentName?: string;
  activeSession?: ChatSession | null;
  onSaveMessage?: (role: 'user' | 'assistant', content: string, extra?: Partial<ChatMessage>) => void;
  onNewSession?: () => void;
  onGradeChange?: (grade: number) => void;
  onSubjectChange?: (subject: string) => void;
  onOpenDoubtUpload?: () => void;
  onOpenQuiz?: () => void;
  onOpenWhiteboard?: () => void;
  onOpenFlashcards?: () => void;
  onOpenBooks?: () => void;
  onOpenGradeModal?: () => void;
}

export const ChatWrapper: React.FC<ChatWrapperProps> = ({
  initialGrade = 10,
  initialSubject = 'Social Science',
  initialLanguage = 'en',
  initialSocratic = true,
  initialPrompt,
  studentName = '',
  activeSession,
  onSaveMessage,
  onNewSession,
  onGradeChange,
  onSubjectChange,
  onOpenDoubtUpload,
  onOpenQuiz,
  onOpenWhiteboard,
  onOpenFlashcards,
  onOpenBooks,
  onOpenGradeModal
}) => {
  // Session Configuration
  const [grade, setGrade] = useState<number>(initialGrade);
  const [consultingGrade, setConsultingGrade] = useState<number>(initialGrade);
  const [subject, setSubject] = useState<string>(initialSubject);
  const [language, setLanguage] = useState<string>(initialLanguage);
  const [socraticMode, setSocraticMode] = useState<boolean>(initialSocratic);
  const [useStreaming, setUseStreaming] = useState<boolean>(true);
  const [isGsebModalOpen, setIsGsebModalOpen] = useState<boolean>(false);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamingText, setStreamingText] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savedNoteIndex, setSavedNoteIndex] = useState<number | null>(null);
  const [followups, setFollowups] = useState<string[]>([]);
  const [citations, setCitations] = useState<string[]>([]);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  
  // Audio Playback State
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [autoVoice, setAutoVoice] = useState<boolean>(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef<boolean>(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<boolean>(false);

  // GSEB English Medium Subject Mapping per Standard
  const getSubjectsForGrade = (g: number): string[] => {
    if (g <= 2) return ['English (First Language)', 'Mathematics'];
    if (g <= 5) return ['English (First Language)', 'Mathematics', 'Environmental Studies (EVS)'];
    if (g <= 8) return ['English', 'Mathematics', 'Science', 'Social Science'];
    if (g <= 10) return ['English', 'Mathematics', 'Science', 'Social Science', 'Computer Studies'];
    return ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Computer Studies'];
  };

  const availableSubjects = getSubjectsForGrade(grade);

  // Synchronize with prop updates
  useEffect(() => {
    if (initialGrade !== undefined && initialGrade !== grade) {
      setGrade(initialGrade);
      setConsultingGrade(initialGrade);
    }
  }, [initialGrade]);

  useEffect(() => {
    if (initialSubject !== undefined && initialSubject !== subject) {
      setSubject(initialSubject);
    }
  }, [initialSubject]);

  useEffect(() => {
    if (initialPrompt) {
      setInputText(initialPrompt);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    }
  }, [initialPrompt]);

  // Synchronize messages when activeSession changes
  useEffect(() => {
    if (activeSession) {
      setMessages(activeSession.messages || []);
      setStreamingText('');
      setFollowups([]);
      setCitations([]);
      stopSpeech();
      setSpeakingIndex(null);

      // If activeSession has specific standard and subject, align local state
      if (activeSession.standard) {
        const match = activeSession.standard.match(/\d+/);
        if (match) {
          const parsed = parseInt(match[0], 10);
          if (parsed >= 1 && parsed <= 12 && parsed !== grade) {
            setGrade(parsed);
          }
        }
      }
      if (activeSession.subject && activeSession.subject !== subject) {
        setSubject(activeSession.subject);
      }
    } else {
      setMessages([]);
      setStreamingText('');
    }
  }, [activeSession?.id]);


  // Adjust subject when standard changes
  useEffect(() => {
    const validSubjects = getSubjectsForGrade(grade);
    if (!validSubjects.includes(subject)) {
      const nextSubj = validSubjects[0];
      setSubject(nextSubj);
      onSubjectChange?.(nextSubj);
    }
  }, [grade]);

  const handleGradeChange = (newGrade: number) => {
    setGrade(newGrade);
    onGradeChange?.(newGrade);
    const validSubjs = getSubjectsForGrade(newGrade);
    if (!validSubjs.includes(subject)) {
      setSubject(validSubjs[0]);
      onSubjectChange?.(validSubjs[0]);
    }
  };

  const handleSubjectChange = (newSubj: string) => {
    setSubject(newSubj);
    onSubjectChange?.(newSubj);
  };

  // Check backend health on mount
  useEffect(() => {
    api.checkHealth()
      .then(isHealthy => {
        setBackendStatus(isHealthy ? 'connected' : 'offline');
      })
      .catch(() => setBackendStatus('offline'));
  }, []);

  // Stop ongoing speech on component unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // Text to speech playback
  const handleSpeakMessage = (text: string, index: number) => {
    if (speakingIndex === index) {
      stopSpeech();
      setSpeakingIndex(null);
      return;
    }

    stopSpeech();
    setSpeakingIndex(index);
    const cleanText = cleanMathForSpeech(text);
    speakNaturalText(cleanText, {
      language: 'en',
      rate: 0.95,
      pitch: 1.0,
      onEnd: () => setSpeakingIndex(null),
      onError: () => setSpeakingIndex(null)
    });
  };

  // Track user scroll position: if student scrolls up, pause auto-scroll so we don't yank their view
  const handleContainerScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // Auto-scroll stays active if within 120px of bottom
    isAutoScrollEnabled.current = scrollHeight - (scrollTop + clientHeight) < 120;
  };

  // Container-local auto-scroll: strictly scrolls the internal messages div without moving window or parent layout
  useEffect(() => {
    if (chatContainerRef.current && isAutoScrollEnabled.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, streamingText, isLoading]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  // Handle Enter to send (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || inputText).trim();
    if (!textToSend || isLoading) return;

    // Auto-detect if query mentions a specific Standard (e.g. Standard 2, Std 7, Class 10)
    let activeGrade = grade;
    const stdMatch = textToSend.match(/\b(?:standard|std|class)\s*(\d{1,2})\b/i);
    if (stdMatch) {
      const parsedG = parseInt(stdMatch[1], 10);
      if (parsedG >= 1 && parsedG <= 12) {
        activeGrade = parsedG;
        setGrade(parsedG);
        setConsultingGrade(parsedG);
        onGradeChange?.(parsedG);
      }
    } else {
      setConsultingGrade(grade);
    }

    // Auto-detect or align subject to the active standard
    let activeSubject = subject;
    const subjectsForActive = getSubjectsForGrade(activeGrade);
    const matchedSubject = subjectsForActive.find(s => {
      const lower = s.toLowerCase();
      const baseSub = lower.split(' ')[0]; // 'english', 'mathematics', etc.
      return textToSend.toLowerCase().includes(lower) || textToSend.toLowerCase().includes(baseSub);
    });
    if (matchedSubject) {
      activeSubject = matchedSubject;
      setSubject(matchedSubject);
      onSubjectChange?.(matchedSubject);
    } else if (!subjectsForActive.includes(activeSubject)) {
      activeSubject = subjectsForActive[0];
      setSubject(activeSubject);
      onSubjectChange?.(activeSubject);
    }

    const userMsg: ChatMessage = { role: 'user', content: textToSend };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    onSaveMessage?.('user', textToSend);
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);
    setStreamingText('');
    setFollowups([]);
    setCitations([]);
    abortControllerRef.current = false;
    isAutoScrollEnabled.current = true;
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 10);

    if (useStreaming) {
      let accumulated = '';
      await api.chatStream(
        {
          messages: nextHistory,
          grade: activeGrade,
          subject: activeSubject,
          student_name: studentName,
          language,
          socratic_mode: socraticMode,
          board: 'GSEB',
          medium: 'English'
        },
        (chunk: string) => {
          if (abortControllerRef.current) return;
          accumulated += chunk;
          setStreamingText(accumulated);
        },
        () => {
          setIsLoading(false);
          const imgMatch = accumulated.match(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/);
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: accumulated,
            image_url: imgMatch ? imgMatch[2] : undefined,
            action_type: imgMatch ? 'generate_image' : undefined
          };
          setMessages(prev => [...prev, assistantMsg]);
          setStreamingText('');
          onSaveMessage?.('assistant', accumulated, {
            image_url: assistantMsg.image_url,
            action_type: assistantMsg.action_type
          });

          // Auto voice playback if turned on
          if (autoVoice && accumulated) {
            handleSpeakMessage(accumulated, nextHistory.length);
          }
        },
        async (error: any) => {
          console.warn('Stream failed or completed, falling back to standard chat:', error);
          try {
            const data = await api.chat({
              messages: nextHistory,
              grade: activeGrade,
              subject: activeSubject,
              student_name: studentName,
              language,
              socratic_mode: socraticMode,
              board: 'GSEB',
              medium: 'English'
            });
            const assistantMsg: ChatMessage = {
              role: 'assistant',
              content: data.reply,
              grade_tier: data.grade_tier,
              is_out_of_scope: data.is_out_of_scope,
              image_url: data.image_url,
              action_type: data.action_type
            };
            setMessages(prev => [...prev, assistantMsg]);
            setFollowups(data.suggested_followups || []);
            setCitations(data.citations || []);
            setIsLoading(false);
            setStreamingText('');
            onSaveMessage?.('assistant', data.reply, {
              grade_tier: data.grade_tier,
              is_out_of_scope: data.is_out_of_scope,
              image_url: data.image_url,
              action_type: data.action_type
            });

            if (autoVoice && data.reply) {
              handleSpeakMessage(data.reply, nextHistory.length);
            }
          } catch (fallbackError: any) {
            setMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: `⚠️ We encountered an issue connecting to the GSEB AI Engine. Please check your internet connection or verify the Gemini API key.`
              }
            ]);
            setIsLoading(false);
            setStreamingText('');
          }
        }
      );
    } else {
      try {
        const data = await api.chat({
          messages: nextHistory,
          grade: activeGrade,
          subject: activeSubject,
          student_name: studentName,
          language,
          socratic_mode: socraticMode,
          board: 'GSEB',
          medium: 'English'
        });
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: data.reply,
          grade_tier: data.grade_tier,
          is_out_of_scope: data.is_out_of_scope,
          image_url: data.image_url,
          action_type: data.action_type
        };
        setMessages(prev => [...prev, assistantMsg]);
        setFollowups(data.suggested_followups || []);
        setCitations(data.citations || []);
        onSaveMessage?.('assistant', data.reply, {
          grade_tier: data.grade_tier,
          is_out_of_scope: data.is_out_of_scope,
          image_url: data.image_url,
          action_type: data.action_type
        });

        if (autoVoice && data.reply) {
          handleSpeakMessage(data.reply, nextHistory.length);
        }
      } catch (err: any) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ Failed to get answer. Error: ${err.message || 'Unknown network error'}`
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSaveToNotebook = async (text: string, index: number) => {
    const studentId = `stu_${(studentName || 'student').toLowerCase().replace(/\s+/g, '_')}`;
    // Extract title from first line or preceding user message
    let noteTitle = `Std ${grade} ${subject} Note`;
    const headingMatch = text.match(/^#+\s*(.+)$/m);
    if (headingMatch) {
      noteTitle = headingMatch[1].trim();
    } else if (index > 0 && messages[index - 1]?.role === 'user') {
      const q = messages[index - 1].content.trim();
      noteTitle = q.length > 40 ? q.slice(0, 40) + '...' : q;
    }

    try {
      await api.createStudyNote({
        student_id: studentId,
        standard: grade,
        subject,
        title: noteTitle,
        content: text,
        tags: ['Saved from Chat', subject, `Std ${grade}`]
      });
      setSavedNoteIndex(index);
      setTimeout(() => setSavedNoteIndex(null), 2500);
    } catch (err) {
      console.error('Failed to save to notebook:', err);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setStreamingText('');
    setFollowups([]);
    setCitations([]);
    stopSpeech();
    setSpeakingIndex(null);
    onNewSession?.();
  };

  // Curated Starter Prompts aligned with GSEB English Medium
  const getStarterPrompts = () => {
    if (grade <= 5) {
      return [
        { label: '🎨 Draw a Monkey', prompt: 'make image of monkey and tell me 3 fun facts about its habitat for EVS', category: 'Visual Art & Science' },
        { label: '🌟 Three Little Pigs Story', prompt: 'Tell me the Three Little Pigs story from GSEB Class 1 English and teach me 3 new words!', category: 'English' },
        { label: '🍎 Fun Addition & Shapes', prompt: 'Teach me addition using colorful fruits and everyday shapes like triangles and circles.', category: 'Mathematics' },
        { label: '🌿 Plants & Flowers (EVS)', prompt: 'Explain the parts of a plant (roots, stem, leaves, flower) for Class 4 EVS.', category: 'EVS' }
      ];
    }
    if (grade <= 8) {
      return [
        { label: '🎨 Draw an Elephant', prompt: 'make image of elephant and explain the matriarch and its trunk adaptations', category: 'Visual Science' },
        { label: '🔬 Photosynthesis Process', prompt: 'Explain the process of photosynthesis and write its chemical equation for GSEB Class 7 Science.', category: 'Science' },
        { label: '📐 Linear Equations in 1 Variable', prompt: 'How do I solve linear equations like 2x + 7 = 15? Give step-by-step Socratic hints.', category: 'Mathematics' },
        { label: '🏰 The Mughal Empire', prompt: 'Who was Shah Jahan and why is his reign known as the Golden Age of Mughal architecture?', category: 'Social Science' }
      ];
    }
    if (grade <= 10) {
      return [
        { label: '🎨 Diagram of Solar System', prompt: 'show me a picture of solar system and explain the planets for GSEB Science', category: 'Visual Astronomy' },
        { label: '🏛️ Shah Jahan & Cultural Heritage', prompt: 'Who was Shah Jahan? Detail his architecture (Taj Mahal, Red Fort, Peacock Throne) for GSEB Std 10 Social Science Board exams.', category: 'Social Science' },
        { label: '⚡ Ohm’s Law & Electric Circuits', prompt: 'State Ohm\'s Law with mathematical formula V = IR, circuit diagram explanation, and 2-mark GSEB Board exam tips.', category: 'Science' },
        { label: '🔢 Quadratic Equations Formula', prompt: 'Explain the quadratic formula x = (-b ± √(b² - 4ac)) / (2a) with derivation and a solved example.', category: 'Mathematics' }
      ];
    }
    return [
      { label: '🎨 Diagram of Human Heart', prompt: 'draw a diagram of human heart and explain double circulation for GSEB Biology', category: 'Visual Biology' },
      { label: '⚡ Coulomb’s Law Derivation', prompt: 'Derive Coulomb\'s Law in vector form with permittivity of free space for GSEB Standard 12 Physics.', category: 'Physics' },
      { label: '🧪 Electrochemistry & Nernst Equation', prompt: 'Explain the Nernst Equation and its derivation for calculating cell potential in Standard 12 Chemistry.', category: 'Chemistry' },
      { label: '🧬 DNA Replication & Transcription', prompt: 'Describe the central dogma of molecular biology and DNA replication fork mechanisms for Standard 12 Biology.', category: 'Biology' }
    ];
  };

  const starterPrompts = getStarterPrompts();

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full bg-[#FAF9F5] text-[#1F1E1D] relative overflow-hidden">
      
      {/* Top Claude Minimal Header */}
      <header className="flex-shrink-0 px-4 sm:px-6 pl-14 sm:pl-20 md:pl-6 py-2.5 border-b border-[#E5E3DC] bg-[#FAF9F5]/90 backdrop-blur-sm z-20 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Active Standard & Subject indicator */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenGradeModal}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F3F1EC] hover:bg-[#EAE7DF] border border-[#E5E3DC] text-xs font-bold transition-all text-[#1F1E1D]"
            title="Switch GSEB Standard"
          >
            <GraduationCap className="w-3.5 h-3.5 text-[#C96442]" />
            <span>Standard {grade}</span>
            <ChevronDown className="w-3 h-3 text-[#949088]" />
          </button>

          {/* Subject Dropdown Pill */}
          <div className="relative">
            <select
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1 rounded-xl bg-[#F3F1EC] hover:bg-[#EAE7DF] border border-[#E5E3DC] text-xs font-bold text-[#1F1E1D] cursor-pointer focus:outline-none focus:border-[#C96442]"
            >
              {availableSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-[#949088] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {studentName && (
            <div 
              onClick={onOpenGradeModal}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-900 cursor-pointer hover:bg-amber-500/20 transition-all shadow-xs"
              title="Click to edit your name or standard"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{studentName}</span>
            </div>
          )}

          <span className="hidden md:inline-flex items-center text-[11px] text-[#6B6862] font-medium">
            GSEB English Medium
          </span>
        </div>

        {/* Right: Quick Action Buttons & Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          {/* Socratic Mode Toggle */}
          <button
            onClick={() => setSocraticMode(!socraticMode)}
            className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1 ${
              socraticMode
                ? 'bg-[#C96442]/10 border-[#C96442]/30 text-[#C96442]'
                : 'bg-[#F3F1EC] border-[#E5E3DC] text-[#6B6862]'
            }`}
            title="Socratic Guided Mode"
          >
            <Lightbulb className="w-3 h-3" />
            <span className="hidden sm:inline">Socratic: {socraticMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* GSEB Books */}
          <button
            onClick={() => setIsGsebModalOpen(true)}
            className="p-1.5 rounded-xl hover:bg-[#F3F1EC] border border-[#E5E3DC] text-[#6B6862] hover:text-[#1F1E1D] transition-colors"
            title={`Browse GSEB Std ${grade} Textbooks`}
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Quiz Shortcut */}
          {onOpenQuiz && (
            <button
              onClick={onOpenQuiz}
              className="p-1.5 rounded-xl hover:bg-[#F3F1EC] border border-[#E5E3DC] text-[#6B6862] hover:text-[#1F1E1D] transition-colors"
              title="Practice Topic Quiz"
            >
              <GraduationCap className="w-4 h-4" />
            </button>
          )}

          {/* Flashcards */}
          {onOpenFlashcards && (
            <button
              onClick={onOpenFlashcards}
              className="p-1.5 rounded-xl hover:bg-[#F3F1EC] border border-[#E5E3DC] text-[#6B6862] hover:text-[#1F1E1D] transition-colors"
              title="Revision Flashcards"
            >
              <Layers className="w-4 h-4" />
            </button>
          )}

          {/* Reset / New Chat */}
          {messages.length > 0 && (
            <button
              onClick={handleResetChat}
              className="p-1.5 rounded-xl hover:bg-[#F3F1EC] border border-[#E5E3DC] text-[#6B6862] hover:text-[#1F1E1D] transition-colors"
              title="Clear conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Conversation Canvas */}
      <div 
        ref={chatContainerRef}
        onScroll={handleContainerScroll}
        className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-6"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          
          {messages.length === 0 ? (
            /* Empty State / Welcome Screen */
            <div className="py-12 md:py-20 flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
              <VidyAILogo size="lg" className="shadow-xs" />

              <div className="space-y-2 max-w-lg">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1F1E1D]">
                  {studentName ? `Welcome to Class, ${studentName}! 🌟` : 'How can VidyAI help you today?'}
                </h2>
                <p className="text-sm text-[#6B6862] leading-relaxed">
                  {studentName ? (
                    <>
                      Hello <strong className="text-[#1F1E1D]">{studentName}</strong>! VidyAI is your personal GSEB teacher for <strong className="text-[#1F1E1D]">Standard {grade} {subject}</strong>. 
                      Ask any math calculation, textbook concept, formula, or Gujarat Board exam question!
                    </>
                  ) : (
                    <>
                      GSEB English Medium tutor for <strong className="text-[#1F1E1D]">Standard {grade} {subject}</strong>. 
                      Ask any question about chapter concepts, formulas, definitions, or Gujarat Board exam pointers.
                    </>
                  )}
                </p>
              </div>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left pt-4">
                {starterPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="p-4 rounded-2xl bg-white hover:bg-[#FBFBFA] border border-[#E5E3DC] hover:border-[#C96442]/40 transition-all text-xs group shadow-xs hover:shadow-sm"
                  >
                    <span className="text-[10px] text-[#C96442] font-bold uppercase tracking-wider block mb-1">
                      {item.category}
                    </span>
                    <span className="text-[#1F1E1D] font-semibold text-sm group-hover:text-[#C96442] transition-colors block">
                      {item.label}
                    </span>
                    <p className="text-[#6B6862] text-xs mt-1.5 line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </p>
                  </button>
                ))}
              </div>

              {/* Quick Workspace Modules */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setIsGsebModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F3F1EC] text-[#1F1E1D] border border-[#E5E3DC] text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#C96442]" />
                  <span>Browse Std {grade} Textbooks</span>
                </button>
                {onOpenQuiz && (
                  <button
                    onClick={onOpenQuiz}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F3F1EC] text-[#1F1E1D] border border-[#E5E3DC] text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Practice Board Quiz</span>
                  </button>
                )}
                {onOpenFlashcards && (
                  <button
                    onClick={onOpenFlashcards}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F3F1EC] text-[#1F1E1D] border border-[#E5E3DC] text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Revision Flashcards</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Message Stream */
            <div className="space-y-6">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const isOutOfScope = msg.is_out_of_scope;

                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                  >
                    {/* Role Header */}
                    <div className="flex items-center gap-2 px-1 text-xs text-[#6B6862]">
                      {isUser ? (
                        <span className="font-semibold text-[#1F1E1D]">You</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <VidyAILogo size={18} />
                          <span className="font-semibold text-[#1F1E1D]">VidyAI Teacher</span>
                          <span className="text-[10px] text-[#949088]">• Std {grade} {subject}</span>
                        </div>
                      )}
                    </div>

                    {/* Message Container */}
                    <div
                      className={`rounded-2xl px-5 py-4 text-[14.5px] max-w-2xl leading-relaxed ${
                        isUser
                          ? 'bg-[#ECE9E2] text-[#1F1E1D] rounded-tr-sm shadow-xs'
                          : isOutOfScope
                          ? 'bg-amber-500/10 text-amber-900 border border-amber-500/20 rounded-tl-sm'
                          : 'bg-white text-[#1F1E1D] border border-[#E5E3DC] rounded-tl-sm shadow-xs'
                      }`}
                    >
                      <MarkdownWithMath 
                        content={msg.content} 
                        latexAllowed={grade >= 6} 
                      />
                    </div>

                    {/* Actions for Assistant Message */}
                    {!isUser && (
                      <div className="flex items-center gap-2 px-1 pt-1 text-xs text-[#6B6862]">
                        <button
                          onClick={() => handleCopy(msg.content, index)}
                          className="flex items-center gap-1 p-1 hover:text-[#1F1E1D] transition-colors"
                          title="Copy text"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span className="text-[11px]">{copiedIndex === index ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          onClick={() => handleSpeakMessage(msg.content, index)}
                          className={`flex items-center gap-1 p-1 transition-colors ${
                            speakingIndex === index ? 'text-[#C96442] font-bold' : 'hover:text-[#1F1E1D]'
                          }`}
                          title="Read aloud"
                        >
                          {speakingIndex === index ? (
                            <VolumeX className="w-3.5 h-3.5 text-[#C96442]" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                          <span className="text-[11px]">{speakingIndex === index ? 'Stop Audio' : 'Listen'}</span>
                        </button>

                        <button
                          onClick={() => handleSaveToNotebook(msg.content, index)}
                          className={`flex items-center gap-1 p-1 transition-colors ${
                            savedNoteIndex === index ? 'text-emerald-700 font-bold' : 'hover:text-[#C96442]'
                          }`}
                          title="Save this explanation to your Study Notebook"
                        >
                          {savedNoteIndex === index ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
                          )}
                          <span className="text-[11px]">{savedNoteIndex === index ? 'Saved to Notebook!' : 'Save Note'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Streaming Indicator */}
              {isLoading && streamingText && (
                <div className="flex flex-col items-start space-y-1.5">
                  <div className="flex items-center gap-1.5 px-1 text-xs text-[#6B6862]">
                    <VidyAILogo size={18} animated={true} />
                    <span className="font-semibold text-[#1F1E1D]">VidyAI Teacher</span>
                    <span className="text-[10px] text-[#949088]">• Thinking...</span>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-5 py-4 text-[14.5px] max-w-2xl bg-white text-[#1F1E1D] border border-[#E5E3DC] shadow-xs">
                    <MarkdownWithMath content={streamingText} latexAllowed={grade >= 6} />
                    <span className="inline-block w-2 h-4 bg-[#C96442] ml-1 animate-pulse align-middle" />
                  </div>
                </div>
              )}

              {/* Thinking / Loading Placeholder */}
              {isLoading && !streamingText && (
                <div className="flex items-center gap-2 p-3 text-xs text-[#6B6862]">
                  <VidyAILogo size={18} animated={true} />
                  <span>Consulting GSEB Standard {consultingGrade || grade} curriculum...</span>
                </div>
              )}

              {/* Suggested Follow-up Questions */}
              {followups.length > 0 && !isLoading && (
                <div className="pt-2 pl-2">
                  <p className="text-[11px] font-bold text-[#949088] uppercase tracking-wider mb-2">
                    Suggested Next Questions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {followups.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(f)}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F3F1EC] text-[#1F1E1D] border border-[#E5E3DC] hover:border-[#C96442]/40 text-xs transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3 h-3 text-[#C96442]" />
                        <span>{f}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Claude Prompt Bar (Pinned Cleanly at Bottom of Chat Viewport) */}
      <div className="flex-shrink-0 bg-[#FAF9F5] border-t border-[#E5E3DC]/60 pt-2.5 pb-3 px-4 z-20">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-[#E5E3DC] bg-white shadow-sm focus-within:border-[#C96442] focus-within:ring-2 focus-within:ring-[#C96442]/10 transition-all claude-prompt-box p-3">
            
            {/* Multi-line Auto-expanding Textarea */}
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Ask VidyAI about Standard ${grade} ${subject} (e.g. explain Shah Jahan, solve equations, clarify concepts)...`}
              rows={1}
              className="w-full bg-transparent text-sm text-[#1F1E1D] placeholder-[#949088] focus:outline-none resize-none max-h-44 py-1 leading-relaxed"
            />

            {/* Bottom Row Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-[#F3F1EC] mt-1.5">
              {/* Left Action Buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                {/* Doubt Photo Upload Button */}
                {onOpenDoubtUpload && (
                  <button
                    type="button"
                    onClick={onOpenDoubtUpload}
                    className="p-1.5 rounded-xl text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#F3F1EC] transition-colors"
                    title="Upload photo of textbook problem / doubt"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                )}

                {/* Socratic Mode Indicator */}
                <button
                  type="button"
                  onClick={() => setSocraticMode(!socraticMode)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    socraticMode 
                      ? 'bg-[#C96442]/10 border-[#C96442]/30 text-[#C96442]' 
                      : 'bg-[#F3F1EC] border-transparent text-[#949088]'
                  }`}
                  title="Toggle Socratic Hints Mode"
                >
                  {socraticMode ? '💡 Socratic' : 'Direct Answer'}
                </button>

                {/* GSEB Books Shortcut */}
                <button
                  type="button"
                  onClick={() => setIsGsebModalOpen(true)}
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] text-[#6B6862] hover:bg-[#F3F1EC] transition-colors"
                >
                  <BookOpen className="w-3 h-3 text-[#C96442]" />
                  <span>Std {grade} Books</span>
                </button>
              </div>

              {/* Right Send Button */}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isLoading}
                className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                  inputText.trim() && !isLoading
                    ? 'bg-[#C96442] text-white hover:bg-[#B55535] shadow-xs scale-105'
                    : 'bg-[#F3F1EC] text-[#949088] cursor-not-allowed'
                }`}
                title="Send message (Enter)"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

          </div>

          {/* Claude Subtext */}
          <p className="text-center text-[11px] text-[#949088] mt-1.5">
            VidyAI is strictly aligned with GSEB English Medium (Standards 1 to 12)
          </p>
        </div>
      </div>

      {/* GSEB Textbooks Library Modal */}
      <GsebBooksModal
        isOpen={isGsebModalOpen}
        onClose={() => setIsGsebModalOpen(false)}
        selectedGrade={grade}
        onSwitchStandard={onOpenGradeModal}
        onSelectBook={(selectedGrade, selectedSubject) => {
          handleGradeChange(selectedGrade);
          handleSubjectChange(selectedSubject);
        }}
        onAskChapter={(selectedGrade, selectedSubject, chapterTitle, chapterNo) => {
          handleGradeChange(selectedGrade);
          handleSubjectChange(selectedSubject);
          const prompt = `Can you explain Chapter ${chapterNo ? `${chapterNo}: ` : ''}"${chapterTitle}" from GSEB Standard ${selectedGrade} ${selectedSubject}? What are the core concepts, definitions, and GSEB exam points?`;
          setInputText(prompt);
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.focus();
          }
        }}
      />
    </div>
  );
};
