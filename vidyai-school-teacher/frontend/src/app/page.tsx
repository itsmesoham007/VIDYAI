'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  Layers, 
  Camera, 
  PenTool, 
  MessageSquare, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Plus, 
  ChevronRight,
  Compass,
  CheckCircle2,
  History,
  Trash2,
  X,
  BarChart3,
  Bookmark,
  FileText,
  Award,
  Play,
  Heart,
  Code2,
  BookCheck
} from 'lucide-react';
import { IntroVideoSplash } from '@/components/IntroVideoSplash';
import { GradeSelectorModal } from '@/components/GradeSelectorModal';
import { StudentLoginModal } from '@/components/StudentLoginModal';
import { GsebBooksModal } from '@/components/GsebBooksModal';
import { QuizModal } from '@/components/QuizModal';
import { FlashcardsModal } from '@/components/FlashcardsModal';
import { DoubtPhotoUpload } from '@/components/DoubtPhotoUpload';
import { WhiteboardModal } from '@/components/WhiteboardModal';
import { SocraticHintBar } from '@/components/SocraticHintBar';
import { ChatWrapper } from '@/components/ChatWrapper';
import { GradeSelector } from '@/components/GradeSelector';
import { VidyAIChatHistory, ChatSession } from '@/lib/chatHistory';
import { VidyAILogo } from '@/components/VidyAILogo';
import { StudentDashboard } from '@/components/StudentDashboard';
import { StudyNotebook } from '@/components/StudyNotebook';
import { GsebPapersHub } from '@/components/GsebPapersHub';
import { TestCenter } from '@/components/TestCenter';
import { ExerciseZone } from '@/components/ExerciseZone';

import { PrimaryJuniorUI } from '@/components/PrimaryJuniorUI';
import { SeniorAcademicUI } from '@/components/SeniorAcademicUI';
import { api } from '@/lib/api';

// Core GSEB English Medium Subject Mapping per Standard
function getGsebSubjects(g: number): string[] {
  if (g <= 2) return ['English (First Language)', 'Mathematics'];
  if (g <= 5) return ['English (First Language)', 'Mathematics', 'Environmental Studies (EVS)'];
  if (g <= 8) return ['English', 'Mathematics', 'Science', 'Social Science'];
  if (g <= 10) return ['English', 'Mathematics', 'Science', 'Social Science', 'Computer Studies'];
  return ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Computer Studies'];
}

export type PortalViewMode = 'chat' | 'dashboard' | 'exercise_zone' | 'notebook' | 'papers' | 'test_center' | 'classroom';

export default function Home() {
  const [viewMode, setViewMode] = useState<PortalViewMode>('chat');
  const [grade, setGrade] = useState<number>(10);
  const [subject, setSubject] = useState<string>('Social Science');
  const [language, setLanguage] = useState<string>('en');
  const [socraticMode, setSocraticMode] = useState<boolean>(true);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>(getGsebSubjects(10));
  const [curriculumTopics, setCurriculumTopics] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Student Profile & Onboarding State
  const [studentName, setStudentName] = useState<string>('');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Modals state
  const [isGradeModalOpen, setIsGradeModalOpen] = useState<boolean>(false);
  const [isQuizOpen, setIsQuizOpen] = useState<boolean>(false);
  const [isDoubtOpen, setIsDoubtOpen] = useState<boolean>(false);
  const [isHintBarOpen, setIsHintBarOpen] = useState<boolean>(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState<boolean>(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState<boolean>(false);
  const [isBooksModalOpen, setIsBooksModalOpen] = useState<boolean>(false);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string>('');
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(false);
  const [showIntro, setShowIntro] = useState<boolean>(true);

  // Chat History Engine State (vidyai_chat_sessions_v1)
  const [chatHistoryEngine, setChatHistoryEngine] = useState<VidyAIChatHistory | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);

  // Initialize VidyAIChatHistory on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const history = new VidyAIChatHistory({
        onLoadSession: (session) => {
          setActiveSessionId(session.id);
          setActiveSession(session);
          setViewMode('chat');
          const match = session.standard?.match(/\d+/);
          if (match) {
            const parsed = parseInt(match[0], 10);
            if (parsed >= 1 && parsed <= 12) setGrade(parsed);
          }
          if (session.subject) setSubject(session.subject);
        },
        onNewSession: (session) => {
          setActiveSessionId(session?.id || null);
          setActiveSession(session);
          setChatInitialPrompt('');
          setViewMode('chat');
        }
      });

      setChatHistoryEngine(history);
      setChatSessions([...history.sessions]);
      setActiveSessionId(history.activeSessionId);
      if (history.activeSessionId) {
        const found = history.sessions.find(s => s.id === history.activeSessionId);
        setActiveSession(found || null);
      }
    }
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K to start fresh conversation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleStartNewConversation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chatHistoryEngine, grade, subject]);

  const handleStartNewConversation = () => {
    if (chatHistoryEngine) {
      const newSession = chatHistoryEngine.startNewConversation(`Standard ${grade}`, subject);
      setChatSessions([...chatHistoryEngine.sessions]);
      setActiveSessionId(newSession.id);
      setActiveSession(newSession);
    }
    setChatInitialPrompt('');
    setViewMode('chat');
    closeMobileSidebar();
  };

  const handleSelectSession = (sessionId: string) => {
    if (chatHistoryEngine) {
      const session = chatHistoryEngine.selectSession(sessionId);
      if (session) {
        setChatSessions([...chatHistoryEngine.sessions]);
        setActiveSessionId(session.id);
        setActiveSession(session);
      }
    }
    setViewMode('chat');
    closeMobileSidebar();
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (chatHistoryEngine) {
      chatHistoryEngine.deleteSession(sessionId, e);
      setChatSessions([...chatHistoryEngine.sessions]);
      setActiveSessionId(chatHistoryEngine.activeSessionId);
      const nextActive = chatHistoryEngine.sessions.find(s => s.id === chatHistoryEngine.activeSessionId);
      setActiveSession(nextActive || null);
    }
  };

  const handleClearAllHistory = () => {
    if (chatHistoryEngine) {
      chatHistoryEngine.clearAllHistory();
      setChatSessions([]);
      setActiveSessionId(null);
      setActiveSession(null);
    }
  };

  const handleSaveChatMessage = (role: 'user' | 'assistant', content: string, extra?: Partial<any>) => {
    if (chatHistoryEngine) {
      const updatedSession = chatHistoryEngine.addMessage(role, content, `Standard ${grade}`, subject, extra);
      setChatSessions([...chatHistoryEngine.sessions]);
      setActiveSessionId(updatedSession.id);
      setActiveSession({ ...updatedSession });
    }
  };


  // Onboarding Gate: First check if user has entered student name & standard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
      try {
        const savedName = localStorage.getItem('vidyai_student_name');
        const savedStd = localStorage.getItem('vidyai_standard');

        if (savedName) {
          const lower = savedName.toLowerCase().trim();
          if (lower === 'soham' || lower === 'sohamrajpurohit' || lower === 'rajpurohit' || lower === 'student' || lower === 'aarav patel') {
            localStorage.removeItem('vidyai_student_name');
            setStudentName('');
          } else {
            setStudentName(savedName);
          }
        }

        if (savedStd) {
          const parsed = parseInt(savedStd, 10);
          if (parsed >= 1 && parsed <= 12) {
            setGrade(parsed);
            const subs = getGsebSubjects(parsed);
            setAvailableSubjects(subs);
            setSubject(subs.includes('Social Science') ? 'Social Science' : subs[0]);
          }
        }

        // Check if cinematic intro was already seen in this session
        const introSeen = sessionStorage.getItem('vidyai_intro_seen');
        if (introSeen === 'true') {
          setShowIntro(false);
          if (!savedStd) {
            setIsFirstVisit(true);
            setIsLoginModalOpen(true);
          }
        } else {
          setShowIntro(true);
          if (!savedStd) {
            setIsFirstVisit(true);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleIntroFinish = () => {
    setShowIntro(false);
    try {
      sessionStorage.setItem('vidyai_intro_seen', 'true');
    } catch {
      // ignore storage errors
    }

    const savedStd = localStorage.getItem('vidyai_standard');
    if (!savedStd) {
      setIsFirstVisit(true);
      setIsLoginModalOpen(true);
    }
  };

  // Synchronize subjects when standard changes
  useEffect(() => {
    const subjects = getGsebSubjects(grade);
    setAvailableSubjects(subjects);
    if (!subjects.includes(subject)) {
      setSubject(subjects[0]);
    }

    // Fetch curriculum topics for active standard and subject
    api.getCurriculumTopics(grade, subject).then(res => {
      if (res && res.topics) {
        setCurriculumTopics(res.topics);
      }
    });
  }, [grade]);

  // Update curriculum when subject changes
  useEffect(() => {
    api.getCurriculumTopics(grade, subject).then(res => {
      if (res && res.topics) {
        setCurriculumTopics(res.topics);
      }
    });
  }, [subject]);

  const handleSelectGrade = (newGrade: number, newName?: string) => {
    setGrade(newGrade);
    if (newName !== undefined) {
      setStudentName(newName);
    }
    const validSubjs = getGsebSubjects(newGrade);
    if (!validSubjs.includes(subject)) {
      setSubject(validSubjs[0]);
    }
    setIsGradeModalOpen(false);
    setIsFirstVisit(false);
  };

  const handleStudentLoginComplete = (newName: string, newGrade: number) => {
    setStudentName(newName);
    setGrade(newGrade);
    const validSubjs = getGsebSubjects(newGrade);
    if (!validSubjs.includes(subject)) {
      setSubject(validSubjs[0]);
    }
    setIsLoginModalOpen(false);
    setIsGradeModalOpen(false);
    setIsFirstVisit(false);
  };

  const handleSelectBook = (selectedGrade: number, selectedSubject: string) => {
    setGrade(selectedGrade);
    const validSubjs = getGsebSubjects(selectedGrade);
    if (validSubjs.includes(selectedSubject)) {
      setSubject(selectedSubject);
    } else {
      setSubject(validSubjs[0]);
    }
  };

  const handleAskChapter = (selectedGrade: number, selectedSubject: string, chapterTitle: string, chapterNo?: number) => {
    handleSelectBook(selectedGrade, selectedSubject);
    const prompt = `Can you explain Chapter ${chapterNo ? `${chapterNo}: ` : ''}"${chapterTitle}" from GSEB Standard ${selectedGrade} ${selectedSubject}? What are the core concepts, definitions, and GSEB exam points?`;
    setChatInitialPrompt(prompt);
    setViewMode('chat');
  };

  // High-yield topic shortcuts per grade tier
  const getRecentTopics = () => {
    if (grade <= 5) {
      return [
        'A Happy Child & Rhymes',
        'Shapes, Space & Fruit Addition',
        'Plants, Leaves & Nature (EVS)',
        'Three Little Pigs Story'
      ];
    }
    if (grade <= 8) {
      return [
        'Nutrition in Plants & Photosynthesis',
        'Mughal Empire: Shah Jahan & Architecture',
        'Linear Equations in One Variable',
        'Fibre to Fabric & Acids/Bases'
      ];
    }
    if (grade <= 10) {
      return [
        'Places of Cultural Heritage (Shah Jahan)',
        'Chemical Reactions & Balanced Equations',
        'Life Processes: Respiration & Heart',
        'Quadratic Equations & Board Derivations',
        'Ohm’s Law & Electric Circuits'
      ];
    }
    return [
      'Coulomb’s Law in Electrostatics',
      'Electrochemistry & Nernst Equation',
      'Continuity and Differentiability',
      'DNA Replication & Central Dogma',
      'Ray Optics & Wave Theory'
    ];
  };

  const isPrimary = grade <= 5;

  const handleSaveToNotebook = async (title: string, content: string, noteSubject: string) => {
    try {
      const studentId = `stu_${(studentName || 'student').toLowerCase().replace(/\s+/g, '_')}`;
      await api.createStudyNote({
        student_id: studentId,
        standard: grade,
        subject: noteSubject,
        title,
        content,
        tags: ['exercise_zone', 'swadhyay']
      });
    } catch (e) {
      console.warn('Auto-save note fallback:', e);
    }
  };

  const closeMobileSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="h-screen h-[100dvh] w-full flex bg-[#FAF9F5] text-[#1F1E1D] overflow-hidden antialiased">
      
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-[#1F1E1D]/40 backdrop-blur-xs z-40 md:hidden animate-fadeIn"
        />
      )}

      {/* 1. Claude Sleek Minimalist Sidebar (Collapsible & Mobile Drawer) */}
      <aside
        className={`${
          isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0'
        } transition-all duration-300 ease-in-out bg-[#F3F1EC] border-r border-[#E5E3DC] flex flex-col justify-between overflow-hidden fixed md:relative inset-y-0 left-0 z-50 md:z-30 flex-shrink-0 select-none shadow-xl md:shadow-none`}
      >
        <div className="w-72 flex flex-col h-full">
          {/* Sidebar Top: Branding & Collapse Toggle */}
          <div className="p-4 border-b border-[#E5E3DC] flex items-center justify-between">
            <VidyAILogo size="sm" showText={true} />

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowIntro(true)}
                className="px-2 py-1 rounded-lg text-[#6B6862] hover:text-[#C96442] hover:bg-[#EAE7DF] transition-colors flex items-center gap-1 text-[11px] font-semibold"
                title="Replay Cinematic Intro Video"
              >
                <Play className="w-3 h-3 fill-[#C96442] text-[#C96442]" />
                <span className="hidden sm:inline">Intro</span>
              </button>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF] transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Standard Indicator Card */}
          <div className="p-3 mx-3 mt-3 rounded-2xl bg-white border border-[#E5E3DC] shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-[#1F1E1D]">Standard {grade}</span>
                </div>
                <p className="text-[11px] text-[#6B6862] font-medium mt-0.5">{subject}</p>
              </div>

              <button
                onClick={() => {
                  setIsLoginModalOpen(true);
                  closeMobileSidebar();
                }}
                className="px-2.5 py-1 rounded-xl bg-[#F3F1EC] hover:bg-[#EAE7DF] text-[#C96442] text-xs font-bold transition-all"
              >
                Switch
              </button>
            </div>
          </div>

          {/* Start New Conversation Button */}
          <div className="px-3 pt-3">
            <button
              onClick={handleStartNewConversation}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#FAF9F5] text-[#1F1E1D] border border-[#E5E3DC] hover:border-[#C96442]/40 text-xs font-semibold flex items-center justify-between shadow-xs transition-all group"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#C96442]" />
                <span>New Conversation</span>
              </span>
              <span className="text-[10px] text-[#949088] font-mono group-hover:text-[#6B6862]">⌘K</span>
            </button>
          </div>

          {/* Navigation Items */}
          <div className="p-3 space-y-1">
            <button
              onClick={() => {
                setViewMode('chat');
                closeMobileSidebar();
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all ${
                viewMode === 'chat'
                  ? 'bg-white text-[#1F1E1D] border border-[#E5E3DC] shadow-xs font-bold'
                  : 'text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF]'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[#C96442]" />
              <span>AI Classroom Chat</span>
            </button>

            <button
              onClick={() => {
                setViewMode('dashboard');
                closeMobileSidebar();
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all ${
                viewMode === 'dashboard'
                  ? 'bg-white text-[#1F1E1D] border border-[#E5E3DC] shadow-xs font-bold'
                  : 'text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF]'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#C96442]" />
              <span>Student Dashboard</span>
            </button>

            <button
              onClick={() => {
                setViewMode('exercise_zone');
                closeMobileSidebar();
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                viewMode === 'exercise_zone'
                  ? 'bg-white text-[#1F1E1D] border border-[#E5E3DC] shadow-xs font-bold'
                  : 'text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookCheck className="w-4 h-4 text-[#C96442]" />
                <span>Exercise Zone (Swadhyay)</span>
              </div>
              <span className="text-[9px] bg-[#C96442]/10 text-[#C96442] px-1.5 py-0.2 rounded-md font-bold">
                Book PDF
              </span>
            </button>

            <button
              onClick={() => {
                setViewMode('notebook');
                closeMobileSidebar();
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all ${
                viewMode === 'notebook'
                  ? 'bg-white text-[#1F1E1D] border border-[#E5E3DC] shadow-xs font-bold'
                  : 'text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF]'
              }`}
            >
              <Bookmark className="w-4 h-4 text-[#C96442]" />
              <span>Study Notebook & Formulas</span>
            </button>

            <button
              onClick={() => {
                setViewMode('papers');
                closeMobileSidebar();
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all ${
                viewMode === 'papers'
                  ? 'bg-white text-[#1F1E1D] border border-[#E5E3DC] shadow-xs font-bold'
                  : 'text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF]'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>GSEB Past Papers & Blueprints</span>
            </button>

            <button
              onClick={() => {
                setViewMode('test_center');
                closeMobileSidebar();
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all ${
                viewMode === 'test_center'
                  ? 'bg-white text-[#1F1E1D] border border-[#E5E3DC] shadow-xs font-bold'
                  : 'text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF]'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Timed Exam & Test Center</span>
            </button>

            <button
              onClick={() => {
                setIsBooksModalOpen(true);
                closeMobileSidebar();
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-medium text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF] flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-[#C96442]" />
                <span>Std {grade} Textbooks</span>
              </span>
              <span className="text-[10px] bg-[#C96442]/10 text-[#C96442] px-2 py-0.5 rounded-full font-bold">
                Std {grade}
              </span>
            </button>

            <button
              onClick={() => {
                setIsQuizOpen(true);
                closeMobileSidebar();
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-medium text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF] flex items-center gap-2.5 transition-all"
            >
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>Interactive Quizzes</span>
            </button>

            <button
              onClick={() => {
                setIsFlashcardsOpen(true);
                closeMobileSidebar();
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-medium text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF] flex items-center gap-2.5 transition-all"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Revision Flashcards</span>
            </button>

            <button
              onClick={() => {
                setIsWhiteboardOpen(true);
                closeMobileSidebar();
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-medium text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF] flex items-center gap-2.5 transition-all"
            >
              <PenTool className="w-4 h-4 text-cyan-600" />
              <span>Whiteboard</span>
            </button>

            <button
              onClick={() => {
                setIsDoubtOpen(true);
                closeMobileSidebar();
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-medium text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF] flex items-center gap-2.5 transition-all"
            >
              <Camera className="w-4 h-4 text-rose-600" />
              <span>Doubt Photo Upload</span>
            </button>

            <button
              onClick={() => {
                setShowIntro(true);
                closeMobileSidebar();
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-medium text-[#6B6862] hover:text-[#C96442] hover:bg-[#EAE7DF] flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-2.5">
                <Play className="w-4 h-4 fill-[#C96442] text-[#C96442]" />
                <span>Replay Intro Video</span>
              </span>
              <span className="text-[10px] bg-[#C96442]/10 text-[#C96442] px-1.5 py-0.5 rounded-md font-bold">
                Cinematic
              </span>
            </button>

            <button
              onClick={() => {
                setViewMode('classroom');
                closeMobileSidebar();
              }}
              className={`w-full py-2 px-3 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all ${
                viewMode === 'classroom'
                  ? 'bg-white text-[#1F1E1D] border border-[#E5E3DC] shadow-xs font-bold'
                  : 'text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF]'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-600" />
              <span>Classroom Workspace</span>
            </button>
          </div>

          {/* Middle Scrollable Section: Chat History & High-Yield Topics */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
            
            {/* Chat History List */}
            <div className="space-y-1.5">
              <div className="px-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#949088] uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3 h-3 text-[#C96442]" />
                  <span>Recent Chats</span>
                  {chatSessions.length > 0 && (
                    <span className="text-[9px] bg-[#EAE7DF] text-[#6B6862] px-1.5 py-0.2 rounded-full font-bold">
                      {chatSessions.length}
                    </span>
                  )}
                </span>
                {chatSessions.length > 0 && (
                  <button
                    id="clearAllHistoryBtn"
                    onClick={handleClearAllHistory}
                    className="text-[10px] text-[#949088] hover:text-rose-600 font-semibold transition-colors flex items-center gap-0.5 cursor-pointer"
                    title="Clear all chat history"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {chatSessions.length === 0 ? (
                <div className="px-3 py-2 text-[11px] text-[#9E9488] bg-white rounded-xl border border-dashed border-[#E5E3DC]">
                  No past conversations yet.
                </div>
              ) : (
                <div id="chatHistoryList" className="space-y-1">
                  {chatSessions.map(session => {
                    const isActive = session.id === activeSessionId && viewMode === 'chat';
                    return (
                      <div
                        key={session.id}
                        data-id={session.id}
                        onClick={() => handleSelectSession(session.id)}
                        className={`history-item group w-full py-1.5 px-2.5 rounded-xl text-left cursor-pointer transition-all flex items-center justify-between gap-1.5 ${
                          isActive
                            ? 'active bg-white text-[#1F1E1D] border border-[#E5E3DC] shadow-xs font-bold'
                            : 'text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF]'
                        }`}
                      >
                        <div className="history-item-left overflow-hidden flex-1 min-w-0">
                          <span className="history-title text-xs font-semibold truncate block leading-tight">
                            {session.title || 'New Conversation'}
                          </span>
                          <span className="history-meta text-[10px] text-[#949088] font-normal truncate block mt-0.5">
                            {session.standard} • {session.subject}
                          </span>
                        </div>
                        <button
                          data-delete-id={session.id}
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="delete-chat-btn opacity-0 group-hover:opacity-100 p-1 rounded-md text-[#949088] hover:text-rose-600 hover:bg-[#F3F1EC] transition-all flex-shrink-0"
                          title="Delete chat"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* High-Yield GSEB Topic Shortcuts */}
            <div className="space-y-1 pt-2 border-t border-[#E5E3DC]/70">
              <p className="px-2 text-[10px] font-bold text-[#949088] uppercase tracking-wider mb-1.5">
                Standard {grade} Topics
              </p>
              {getRecentTopics().map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setChatInitialPrompt(`Explain ${t} for GSEB Standard ${grade} ${subject} with key concepts and exam pointers.`);
                    setViewMode('chat');
                    closeMobileSidebar();
                  }}
                  className="w-full text-left py-1.5 px-2.5 rounded-xl text-xs text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF] transition-colors truncate block"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar Bottom: Student Profile & Switch Standard */}
          <div className="p-3 border-t border-[#E5E3DC] bg-[#EFECE5]">
            <div className="flex items-center justify-between">
              <div 
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity"
                title="Edit Student Profile & Standard"
              >
                <div className="w-8 h-8 rounded-full bg-[#C96442] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {studentName ? studentName.charAt(0).toUpperCase() : `S${grade}`}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-[#1F1E1D] truncate max-w-[125px]">
                    {studentName || 'GSEB Student'}
                  </p>
                  <p className="text-[10px] text-[#6B6862]">Class {grade} • English Med</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsLoginModalOpen(true);
                  closeMobileSidebar();
                }}
                className="p-1.5 rounded-xl hover:bg-[#E5E3DC] text-[#6B6862] hover:text-[#C96442] transition-colors"
                title="Switch Student or Standard"
              >
                <GraduationCap className="w-4 h-4 text-[#C96442]" />
              </button>
            </div>
            <p className="text-[10px] text-[#949088] text-center pt-2 border-t border-[#E5E3DC]/60 mt-2">
              Created & Developed by <strong className="text-[#6B6862]">Soham Rajpurohit</strong>
            </p>
          </div>
        </div>
      </aside>

      {/* 2. Main Canvas */}
      <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative">
        
        {/* Top Portal Navigation Header Bar */}
        <header className="bg-white border-b border-[#E5E3DC] px-4 py-2.5 flex items-center justify-between gap-3 z-30 shadow-2xs">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 px-2.5 rounded-xl bg-[#FAF9F5] hover:bg-[#F3F1EC] border border-[#E5E3DC] text-[#6B6862] hover:text-[#1F1E1D] transition-all flex items-center gap-1.5 mr-1"
                title="Open sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
                <span className="text-xs font-bold text-[#1F1E1D]">Std {grade}</span>
              </button>
            )}

            <button
              onClick={() => setViewMode('chat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'chat'
                  ? 'bg-[#C96442] text-white shadow-xs'
                  : 'bg-[#FAF9F5] text-[#6B6862] hover:bg-[#F3F1EC] border border-[#E5E3DC]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Classroom</span>
            </button>

            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'dashboard'
                  ? 'bg-[#C96442] text-white shadow-xs'
                  : 'bg-[#FAF9F5] text-[#6B6862] hover:bg-[#F3F1EC] border border-[#E5E3DC]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setViewMode('exercise_zone')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'exercise_zone'
                  ? 'bg-[#C96442] text-white shadow-xs'
                  : 'bg-[#FAF9F5] text-[#6B6862] hover:bg-[#F3F1EC] border border-[#E5E3DC]'
              }`}
            >
              <BookCheck className="w-3.5 h-3.5" />
              <span>Exercise Zone</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold ${
                viewMode === 'exercise_zone' ? 'bg-white/20 text-white' : 'bg-[#C96442]/10 text-[#C96442]'
              }`}>
                PDF
              </span>
            </button>

            <button
              onClick={() => setViewMode('notebook')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'notebook'
                  ? 'bg-[#C96442] text-white shadow-xs'
                  : 'bg-[#FAF9F5] text-[#6B6862] hover:bg-[#F3F1EC] border border-[#E5E3DC]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Study Notebook</span>
            </button>

            <button
              onClick={() => setViewMode('papers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'papers'
                  ? 'bg-[#C96442] text-white shadow-xs'
                  : 'bg-[#FAF9F5] text-[#6B6862] hover:bg-[#F3F1EC] border border-[#E5E3DC]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>GSEB Papers</span>
            </button>

            <button
              onClick={() => setViewMode('test_center')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'test_center'
                  ? 'bg-[#C96442] text-white shadow-xs'
                  : 'bg-[#FAF9F5] text-[#6B6862] hover:bg-[#F3F1EC] border border-[#E5E3DC]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Test Center</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsQuizOpen(true)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors hidden sm:flex items-center gap-1 shadow-2xs"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quiz</span>
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#FBF0EB] text-[#C96442] border border-[#C96442]/20 hover:bg-[#F5E6DF] transition-colors flex items-center gap-1 shadow-2xs"
                title="Edit student profile and standard"
              >
                <span>Class {grade}</span>
                {studentName && <span className="text-[10px] text-[#8C827A] hidden md:inline">({studentName})</span>}
              </button>
              {studentName && (
                <button
                  onClick={() => {
                    try { localStorage.removeItem('vidyai_student_name'); } catch {}
                    setStudentName('');
                  }}
                  className="px-1.5 py-1 text-[11px] font-bold text-[#8C827A] hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                  title="Clear name (switch to guest scholar)"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Switcher */}
        {viewMode === 'chat' && (
          <ChatWrapper
            initialGrade={grade}
            initialSubject={subject}
            initialLanguage={language}
            initialSocratic={socraticMode}
            initialPrompt={chatInitialPrompt}
            studentName={studentName}
            activeSession={activeSession}
            onSaveMessage={handleSaveChatMessage}
            onNewSession={handleStartNewConversation}
            onGradeChange={handleSelectGrade}
            onSubjectChange={setSubject}
            onOpenDoubtUpload={() => setIsDoubtOpen(true)}
            onOpenQuiz={() => setIsQuizOpen(true)}
            onOpenWhiteboard={() => setIsWhiteboardOpen(true)}
            onOpenFlashcards={() => setIsFlashcardsOpen(true)}
            onOpenBooks={() => setIsBooksModalOpen(true)}
            onOpenGradeModal={() => setIsLoginModalOpen(true)}
          />
        )}

        {viewMode === 'dashboard' && (
          <StudentDashboard
            grade={grade}
            studentName={studentName}
            onNavigateToChat={(prompt, targetSub, targetGrade) => {
              if (targetGrade) handleSelectGrade(targetGrade);
              if (targetSub) setSubject(targetSub);
              if (prompt) setChatInitialPrompt(prompt);
              setViewMode('chat');
            }}
            onOpenNotebook={() => setViewMode('notebook')}
            onOpenQuiz={(topic, sub) => {
              if (sub) setSubject(sub);
              setIsQuizOpen(true);
            }}
            onOpenPapers={() => setViewMode('papers')}
            onGradeChange={(g) => handleSelectGrade(g)}
          />
        )}

        {viewMode === 'exercise_zone' && (
          <ExerciseZone
            grade={grade}
            initialSubject={subject}
            studentName={studentName}
            onNavigateToChat={(prompt, targetSub, targetGrade) => {
              if (targetGrade) handleSelectGrade(targetGrade);
              if (targetSub) setSubject(targetSub);
              if (prompt) setChatInitialPrompt(prompt);
              setViewMode('chat');
            }}
            onSaveToNotebook={handleSaveToNotebook}
            onOpenGradeModal={() => setIsLoginModalOpen(true)}
          />
        )}

        {viewMode === 'notebook' && (
          <StudyNotebook
            grade={grade}
            studentName={studentName}
            onNavigateToChat={(prompt, targetSub) => {
              if (targetSub) setSubject(targetSub);
              if (prompt) setChatInitialPrompt(prompt);
              setViewMode('chat');
            }}
          />
        )}

        {viewMode === 'papers' && (
          <GsebPapersHub
            grade={grade}
            onNavigateToChat={(prompt, targetSub) => {
              if (targetSub) setSubject(targetSub);
              if (prompt) setChatInitialPrompt(prompt);
              setViewMode('chat');
            }}
          />
        )}

        {viewMode === 'test_center' && (
          <TestCenter
            grade={grade}
            subject={subject}
            studentName={studentName}
            onNavigateToChat={(prompt, targetSub) => {
              if (targetSub) setSubject(targetSub);
              if (prompt) setChatInitialPrompt(prompt);
              setViewMode('chat');
            }}
            onOpenNotebook={() => setViewMode('notebook')}
            onOpenFlashcards={() => setIsFlashcardsOpen(true)}
          />
        )}

        {viewMode === 'classroom' && (
          <div className="flex-1 flex flex-col bg-[#FAF9F5] overflow-y-auto">
            {/* Classroom Header */}
            <div className="px-6 py-3 border-b border-[#E5E3DC] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1F1E1D]">Classroom Workspace</span>
                <span className="text-[10px] bg-[#C96442]/10 text-[#C96442] px-2 py-0.5 rounded-full font-bold">
                  Standard {grade} • {subject}
                </span>
              </div>
              <button
                onClick={() => setViewMode('chat')}
                className="text-xs font-bold text-[#C96442] hover:underline"
              >
                Back to Chat Workspace →
              </button>
            </div>

            <GradeSelector
              grade={grade}
              onGradeChange={handleSelectGrade}
              subject={subject}
              onSubjectChange={setSubject}
              availableSubjects={availableSubjects}
              language={language}
              onLanguageChange={setLanguage}
              socraticMode={socraticMode}
              onToggleSocratic={() => setSocraticMode(prev => !prev)}
              onOpenQuiz={() => setIsQuizOpen(true)}
              onOpenDoubtUpload={() => setIsDoubtOpen(true)}
              onOpenHintBar={() => setIsHintBarOpen(true)}
              onOpenWhiteboard={() => setIsWhiteboardOpen(true)}
              onOpenFlashcards={() => setIsFlashcardsOpen(true)}
            />

            <div className="flex-1 p-4">
              {isPrimary ? (
                <PrimaryJuniorUI
                  grade={grade}
                  subject={subject}
                  language={language}
                  socraticMode={socraticMode}
                  onOpenQuiz={() => setIsQuizOpen(true)}
                  onOpenDoubtUpload={() => setIsDoubtOpen(true)}
                  onOpenHintBar={() => setIsHintBarOpen(true)}
                  onOpenWhiteboard={() => setIsWhiteboardOpen(true)}
                  onOpenFlashcards={() => setIsFlashcardsOpen(true)}
                />
              ) : (
                <SeniorAcademicUI
                  grade={grade}
                  subject={subject}
                  language={language}
                  socraticMode={socraticMode}
                  onOpenQuiz={() => setIsQuizOpen(true)}
                  onOpenDoubtUpload={() => setIsDoubtOpen(true)}
                  onOpenHintBar={() => setIsHintBarOpen(true)}
                  onOpenWhiteboard={() => setIsWhiteboardOpen(true)}
                  onOpenFlashcards={() => setIsFlashcardsOpen(true)}
                />
              )}
            </div>
          </div>
        )}

        {/* 3. Persistent Global Bottom Bar: Coded & Crafted by Soham */}
        <footer className="flex-shrink-0 bg-[#F3F1EC] border-t border-[#E5E3DC] px-3 sm:px-5 py-2 flex items-center justify-between text-[11px] text-[#6B6862] z-30 select-none shadow-2xs">
          {/* Left: Server Status */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Public Servers</span>
            </span>
            <span className="hidden sm:inline text-[#8C827A] text-[11px]">
              • GSEB English Medium (Std 1–12)
            </span>
          </div>

          {/* Center: Coded & Crafted by Soham */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#1F1E1D]">
            <Code2 className="w-3.5 h-3.5 text-[#C96442]" />
            <span className="text-[#6B6862]">Coded & crafted with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline-block animate-pulse" />
            <span>by <strong className="text-[#C96442] font-bold tracking-tight">Soham</strong></span>
          </div>

          {/* Right: Engine Badge */}
          <div className="flex items-center gap-2 text-[10px] text-[#8C827A]">
            <span className="hidden md:inline">Google Gemini 3.1 & GSSTB RAG</span>
            <span className="px-1.5 py-0.5 rounded bg-white border border-[#E5E3DC] font-mono font-bold text-[#6B6862] shadow-2xs">
              v2.5 PROD
            </span>
          </div>
        </footer>
      </div>

      {/* 0. Cinematic Intro Splash Screen */}
      {showIntro && (
        <IntroVideoSplash onFinish={handleIntroFinish} />
      )}

      {/* Student Login & Profile Modal */}
      <StudentLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialName={studentName}
        initialGrade={grade}
        isMandatory={isFirstVisit}
        onComplete={handleStudentLoginComplete}
      />

      {/* 3. Onboarding & Standard Selection Modal */}
      <GradeSelectorModal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        currentGrade={grade}
        currentName={studentName}
        onSelectGrade={handleSelectGrade}
        isMandatoryOnboarding={isFirstVisit}
      />

      {/* 4. Modals */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        grade={grade}
        subject={subject}
        topic={curriculumTopics[0] || 'High-Yield Board Concepts'}
        language={language}
        studentName={studentName}
      />

      <DoubtPhotoUpload
        isOpen={isDoubtOpen}
        onClose={() => setIsDoubtOpen(false)}
        grade={grade}
        subject={subject}
        language={language}
        socraticMode={socraticMode}
      />

      <SocraticHintBar
        isOpen={isHintBarOpen}
        onClose={() => setIsHintBarOpen(false)}
        grade={grade}
        subject={subject}
        language={language}
      />

      <WhiteboardModal
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
        grade={grade}
        subject={subject}
      />

      <FlashcardsModal
        isOpen={isFlashcardsOpen}
        onClose={() => setIsFlashcardsOpen(false)}
        grade={grade}
        subject={subject}
      />

      <GsebBooksModal
        isOpen={isBooksModalOpen}
        onClose={() => setIsBooksModalOpen(false)}
        selectedGrade={grade}
        onSwitchStandard={() => {
          setIsBooksModalOpen(false);
          setIsGradeModalOpen(true);
        }}
        onSelectBook={handleSelectBook}
        onAskChapter={handleAskChapter}
      />

    </div>
  );
}
