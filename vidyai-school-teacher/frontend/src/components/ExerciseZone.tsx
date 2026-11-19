'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  Download, 
  Printer, 
  ExternalLink, 
  Sparkles, 
  Bookmark, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  GraduationCap, 
  Award, 
  Lightbulb, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  BookCheck,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff,
  PenTool,
  Copy,
  Globe,
  ArrowRight,
  Send,
  RotateCw,
  RefreshCw,
  Layers,
  Sparkle
} from 'lucide-react';
import { 
  api, 
  ExerciseChapterItem, 
  ExerciseDetailResponse, 
  ExerciseQuestion,
  CustomExerciseSolveResponse
} from '@/lib/api';
import { MarkdownWithMath } from '@/lib/renderMarkdown';
import { VidyAILogo } from '@/components/VidyAILogo';

interface ExerciseZoneProps {
  grade: number;
  initialSubject?: string;
  studentName?: string;
  onNavigateToChat: (prompt: string, targetSubject?: string, targetGrade?: number) => void;
  onSaveToNotebook?: (title: string, content: string, subject: string) => void;
  onOpenGradeModal?: () => void;
}

export const ExerciseZone: React.FC<ExerciseZoneProps> = ({
  grade,
  initialSubject,
  studentName,
  onNavigateToChat,
  onSaveToNotebook,
  onOpenGradeModal
}) => {
  // Available subjects for the active standard
  const getSubjects = (g: number): string[] => {
    if (g <= 2) return ['English (First Language)', 'Mathematics', 'Environmental Studies (EVS)', 'Hindi (Second Language)'];
    if (g <= 5) return ['English (First Language)', 'Mathematics', 'Environmental Studies (EVS)', 'Gujarati (Second Language)', 'Hindi (Second Language)'];
    if (g <= 8) return ['Mathematics', 'Science & Technology', 'Social Science', 'English (First Language)', 'Hindi (Second Language)', 'Sanskrit (Second Language)'];
    if (g <= 10) return ['Mathematics (Standard)', 'Mathematics (Basic)', 'Science & Technology', 'Social Science', 'English (First Language)', 'Computer Studies'];
    return ['Physics Part 1', 'Physics Part 2', 'Chemistry Part 1', 'Chemistry Part 2', 'Mathematics Part 1', 'Biology', 'English (First Language)', 'Elements of Accounts Part 1'];
  };

  const availableSubjects = getSubjects(grade);
  const [selectedSubject, setSelectedSubject] = useState<string>(
    initialSubject && availableSubjects.includes(initialSubject) ? initialSubject : availableSubjects[0]
  );

  // Primary Workspace Tab: 'textbook' (Textbook Solved PDF & Swadhyay) vs 'solver' (Custom Homework & Question Solver)
  const [primaryTab, setPrimaryTab] = useState<'textbook' | 'solver'>('textbook');
  
  // Textbook Solved State
  const [chapters, setChapters] = useState<ExerciseChapterItem[]>([]);
  const [selectedChapterNo, setSelectedChapterNo] = useState<number>(1);
  const [exerciseDetail, setExerciseDetail] = useState<ExerciseDetailResponse | null>(null);
  const [loadingChapters, setLoadingChapters] = useState<boolean>(true);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  
  // View mode for textbook tab: 'pdf' (book PDF only) or 'interactive' (step-by-step interactive solutions)
  const [viewMode, setViewMode] = useState<'pdf' | 'interactive'>('pdf');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSolutions, setExpandedSolutions] = useState<Record<number, boolean>>({});
  const [savedIndex, setSavedIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Custom Solver State (Option 1)
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [solverMode, setSolverMode] = useState<'hint' | 'notebook'>('notebook');
  const [includeGujarati, setIncludeGujarati] = useState<boolean>(true);
  const [simpleLanguage, setSimpleLanguage] = useState<boolean>(grade <= 5);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [solveResult, setSolveResult] = useState<CustomExerciseSolveResponse | null>(null);
  const [solveError, setSolveError] = useState<string | null>(null);
  const [showTwinSolution, setShowTwinSolution] = useState<boolean>(false);
  const [copiedCustom, setCopiedCustom] = useState<boolean>(false);
  const [savedCustom, setSavedCustom] = useState<boolean>(false);

  // Sync subject when grade changes
  useEffect(() => {
    const valid = getSubjects(grade);
    if (!valid.includes(selectedSubject)) {
      setSelectedSubject(valid[0]);
    }
  }, [grade]);

  // Load chapters for active grade & subject
  useEffect(() => {
    loadChapters();
  }, [grade, selectedSubject]);

  // Load detail when selected chapter changes
  useEffect(() => {
    if (selectedChapterNo) {
      loadChapterDetail(selectedChapterNo);
    }
  }, [grade, selectedSubject, selectedChapterNo]);

  const loadChapters = async () => {
    setLoadingChapters(true);
    try {
      const res = await api.getExerciseChapters(grade, selectedSubject);
      setChapters(res.chapters || []);
      if (res.chapters && res.chapters.length > 0) {
        setSelectedChapterNo(res.chapters[0].chapter_no);
      }
    } catch (err) {
      console.error('Failed to load exercise chapters:', err);
    } finally {
      setLoadingChapters(false);
    }
  };

  const loadChapterDetail = async (chNo: number) => {
    setLoadingDetail(true);
    try {
      const res = await api.getExerciseDetail(grade, selectedSubject, chNo);
      setExerciseDetail(res);
      // Auto-expand all solutions by default
      if (res?.exercises) {
        const initialExpand: Record<number, boolean> = {};
        res.exercises.forEach((_, idx) => { initialExpand[idx] = true; });
        setExpandedSolutions(initialExpand);
      }
    } catch (err) {
      console.error('Failed to load chapter exercise detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const pdfUrl = api.getExercisePdfUrl(grade, selectedSubject, selectedChapterNo);

  const toggleSolution = (idx: number) => {
    setExpandedSolutions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleAskInChat = (ex: ExerciseQuestion) => {
    const prompt = `Let's study GSEB Standard ${grade} ${selectedSubject} Chapter ${selectedChapterNo} ("${exerciseDetail?.chapter_title || ''}") Exercise Question ${ex.q_no}: "${ex.question}". Please explain the step-by-step logic, concepts, and GSEB board marking scheme points.`;
    onNavigateToChat(prompt, selectedSubject, grade);
  };

  const handleSaveNote = (ex: ExerciseQuestion, idx: number) => {
    if (onSaveToNotebook) {
      const title = `Std ${grade} ${selectedSubject} - Ch ${selectedChapterNo} Q${ex.q_no}`;
      const content = `### Question\n${ex.question}\n\n### Step-by-Step Solution\n${ex.solution}\n\n**Final Answer:** ${ex.final_answer || 'N/A'}\n\n*GSEB Board Tip:* ${ex.board_tip || 'Follow standard marking scheme.'}`;
      onSaveToNotebook(title, content, selectedSubject);
      setSavedIndex(idx);
      setTimeout(() => setSavedIndex(null), 2500);
    }
  };

  // Custom Solver Functions
  const handleSolveCustom = async (questionText?: string) => {
    const q = (questionText !== undefined ? questionText : customQuestion).trim();
    if (!q) return;
    setIsSolving(true);
    setSolveError(null);
    setShowTwinSolution(false);
    try {
      const res = await api.solveCustomExercise({
        question: q,
        grade,
        subject: selectedSubject,
        mode: solverMode,
        include_gujarati: includeGujarati,
        simple_language: simpleLanguage
      });
      setSolveResult(res);
    } catch (err: any) {
      console.error('Solve failed:', err);
      setSolveError(err.message || 'Failed to solve question. Please try again.');
    } finally {
      setIsSolving(false);
    }
  };

  const handleSaveCustomToNotebook = () => {
    if (!solveResult || !onSaveToNotebook) return;
    const title = `Std ${grade} ${solveResult.subject} - Custom Exercise Solution`;
    let content = `### Problem\n${solveResult.question}\n\n`;
    content += `### Step-by-Step Solution\n${solveResult.solution_steps.join('\n\n')}\n\n`;
    content += `### Model Answer\n${solveResult.model_answer}\n\n`;
    content += `**Final Answer:** ${solveResult.final_answer}\n\n`;
    if (solveResult.board_tip) {
      content += `*GSEB Board Tip:* ${solveResult.board_tip}\n\n`;
    }
    if (solveResult.bilingual_glossary?.length) {
      content += `### Bilingual Vocabulary\n`;
      solveResult.bilingual_glossary.forEach(item => {
        content += `- **${item.english_term}** (${item.gujarati_term}): ${item.definition}\n`;
      });
    }
    onSaveToNotebook(title, content, solveResult.subject);
    setSavedCustom(true);
    setTimeout(() => setSavedCustom(false), 2500);
  };

  const handleCopyCustomSolution = () => {
    if (!solveResult) return;
    const text = `Question: ${solveResult.question}\n\nFinal Answer: ${solveResult.final_answer}\n\nSolution:\n${solveResult.model_answer}\n\nGSEB Board Tip: ${solveResult.board_tip || 'Follow standard marking scheme.'}\n\n(VidyAI GSEB English Medium • Coded & crafted by Soham Rajpurohit)`;
    navigator.clipboard.writeText(text);
    setCopiedCustom(true);
    setTimeout(() => setCopiedCustom(false), 2500);
  };

  const handleAskCustomInChat = () => {
    if (!solveResult) return;
    const prompt = `Let's discuss this Standard ${grade} ${selectedSubject} question: "${solveResult.question}". Can you explain the deeper concepts and how I can score full marks in the GSEB board exam?`;
    onNavigateToChat(prompt, selectedSubject, grade);
  };

  // Sample questions tailored to active grade and subject
  const getSubjectSampleQuestions = (g: number, sub: string): string[] => {
    const s = sub.toLowerCase();
    if (s.includes('math')) {
      if (g <= 5) return [
        "Raju has 45 marbles. He gave 18 to his friend Rohan. How many marbles does Raju have left?",
        "Find the perimeter of a rectangle whose length is 12 cm and breadth is 8 cm.",
        "Add: 3/4 + 1/2. Show step-by-step with equivalent fractions."
      ];
      if (g <= 8) return [
        "Solve for x: 3x - 7 = 14",
        "The perimeter of a rectangular swimming pool is 154 m. Its length is 2 m more than twice its breadth. What are the length and breadth of the pool?",
        "Find the square root of 7056 using prime factorisation."
      ];
      if (g <= 10) return [
        "Find the roots of the quadratic equation: 2x² - 7x + 3 = 0 using the quadratic formula.",
        "Use Euclid's division algorithm to find the HCF of 135 and 225.",
        "Prove that √5 is an irrational number."
      ];
      return [
        "Evaluate the integral: ∫ (2x + 1) / (x² + 4x + 5) dx",
        "Find the derivative of f(x) = sin²(3x) with respect to x using chain rule.",
        "Find the vector and Cartesian equations of the line passing through (2, -1, 4) in direction i + 2j - k."
      ];
    }
    if (s.includes('sci') || s.includes('phys') || s.includes('chem') || s.includes('bio') || s.includes('evs')) {
      if (g <= 5) return [
        "What are the three states of matter? Give two examples of each.",
        "Why do plants have green leaves? Explain the role of sunlight.",
        "What is the water cycle? Name its main stages."
      ];
      if (g <= 8) return [
        "Explain the process of photosynthesis with a neat chemical word equation.",
        "What is the difference between contact and non-contact forces? Give two examples each.",
        "Why is copper used for electrical wiring whereas plastic is used to cover it?"
      ];
      if (g <= 10) return [
        "State Ohm's Law and derive its mathematical formula. Draw the V-I circuit diagram.",
        "Why do ionic compounds have high melting and boiling points? Give two reasons.",
        "Differentiate between aerobic and anaerobic respiration with biochemical equations."
      ];
      return [
        "Derive the expression for electric field intensity on the axial line of an electric dipole.",
        "State Raoult's Law for solutions of volatile liquids and write its mathematical equation.",
        "Describe the mechanism of DNA replication with relevant enzymes."
      ];
    }
    if (s.includes('soc') || s.includes('hist') || s.includes('geo')) {
      return [
        "Explain the main causes of the Revolt of 1857 according to GSEB textbook.",
        "Describe the architectural heritage of Gujarat with special reference to Modhera Sun Temple.",
        "What are the Fundamental Rights guaranteed by the Constitution of India?"
      ];
    }
    return [
      "Identify the parts of speech and tense in: 'The brave students solved the difficult mathematics problem quickly.'",
      "Write a short paragraph on 'Conservation of Forests and Wildlife' with proper transition words.",
      "Explain the central theme and figures of speech used in the textbook poem."
    ];
  };

  const sampleQuestions = getSubjectSampleQuestions(grade, selectedSubject);

  const filteredChapters = chapters.filter(ch => 
    ch.chapter_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ch.concepts.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ch.chapter_no.toString().includes(searchQuery)
  );

  const activeChapter = chapters.find(c => c.chapter_no === selectedChapterNo);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#FAF9F5] text-[#1F1E1D] overflow-hidden">
      
      {/* 1. Header Toolbar */}
      <div className="flex-shrink-0 bg-white border-b border-[#E5E3DC] px-4 md:px-6 py-3 z-10 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: Branding & Standard Selector */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#C96442]/10 border border-[#C96442]/20 flex items-center justify-center text-[#C96442] flex-shrink-0">
              <BookCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-[#1F1E1D] tracking-tight">
                  Exercise Zone (Swadhyay)
                </h1>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  GSEB English Medium
                </span>
              </div>
              <p className="text-[11px] text-[#6B6862]">
                Official textbook end-of-chapter solved PDFs & custom homework problem solver.
              </p>
            </div>
          </div>

          {/* Right: Primary Workspace Switcher (Option 1 Tab & Textbook PDF Tab) & Standard Button */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Standard Selector Button */}
            <button
              onClick={onOpenGradeModal}
              className="px-2.5 py-1.5 rounded-xl bg-[#F3F1EC] hover:bg-[#EAE7DF] border border-[#E5E3DC] text-xs font-bold text-[#1F1E1D] flex items-center gap-1.5 transition-colors"
              title="Change GSEB Standard"
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#C96442]" />
              <span>Std {grade}</span>
              <ChevronDown className="w-3 h-3 text-[#949088]" />
            </button>

            {/* Primary Tab Switcher */}
            <div className="bg-[#F3F1EC] p-0.5 rounded-xl border border-[#E5E3DC] flex items-center">
              <button
                onClick={() => setPrimaryTab('textbook')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  primaryTab === 'textbook'
                    ? 'bg-white text-[#C96442] shadow-2xs'
                    : 'text-[#6B6862] hover:text-[#1F1E1D]'
                }`}
                title="View authentic textbook chapter solved PDF"
              >
                <BookCheck className="w-3.5 h-3.5" />
                <span>Textbook PDF Solved</span>
              </button>

              <button
                onClick={() => setPrimaryTab('solver')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  primaryTab === 'solver'
                    ? 'bg-[#C96442] text-white shadow-2xs'
                    : 'text-[#6B6862] hover:text-[#1F1E1D]'
                }`}
                title="Custom Homework & Exercise Solver with Hint Mode and Notebook-ready answers"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Custom Question Solver</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  primaryTab === 'solver' ? 'bg-white/20 text-white' : 'bg-[#C96442]/10 text-[#C96442]'
                }`}>
                  Option 1
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* Subject Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-0.5 scrollbar-none">
          {availableSubjects.map((sub) => {
            const isSelected = sub === selectedSubject;
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#C96442] border-[#C96442] text-white shadow-2xs'
                    : 'bg-[#FAF9F5] border-[#E5E3DC] text-[#6B6862] hover:bg-[#F3F1EC] hover:text-[#1F1E1D]'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Body Content: Based on Primary Tab */}
      {primaryTab === 'textbook' ? (
        
        /* ========================================================
           TAB 1: TEXTBOOK SOLVED SWADHYAY (PDF VIEW & INTERACTIVE)
           ======================================================== */
        <div className="flex-1 flex min-h-0 overflow-hidden">
          
          {/* Left Sidebar: Chapters Drawer */}
          <aside className="w-72 md:w-80 border-r border-[#E5E3DC] bg-[#FAF9F5] flex flex-col flex-shrink-0 min-h-0">
            
            {/* Chapter Search */}
            <div className="p-3 border-b border-[#E5E3DC] bg-white/70">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#949088] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search chapters or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#F3F1EC] border border-[#E5E3DC] text-[#1F1E1D] placeholder-[#949088] focus:outline-none focus:border-[#C96442]"
                />
              </div>
            </div>

            {/* Chapter List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {loadingChapters ? (
                <div className="p-6 text-center text-xs text-[#949088] space-y-2">
                  <VidyAILogo size={20} animated={true} />
                  <p>Loading GSEB textbook chapters...</p>
                </div>
              ) : filteredChapters.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#949088]">
                  No chapters match your search.
                </div>
              ) : (
                filteredChapters.map((ch) => {
                  const isSelected = ch.chapter_no === selectedChapterNo;
                  return (
                    <button
                      key={ch.chapter_no}
                      onClick={() => setSelectedChapterNo(ch.chapter_no)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-white border-[#C96442] shadow-xs text-[#1F1E1D]'
                          : 'bg-white/60 hover:bg-white border-[#E5E3DC] text-[#6B6862] hover:text-[#1F1E1D]'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-[#C96442] text-white'
                          : 'bg-[#F3F1EC] text-[#6B6862]'
                      }`}>
                        {ch.chapter_no}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold leading-tight line-clamp-2 ${isSelected ? 'text-[#1F1E1D]' : ''}`}>
                          {ch.chapter_title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#949088]">
                          <span>{ch.total_questions} Questions</span>
                          <span>•</span>
                          <span>{ch.total_marks} Marks</span>
                          <span className="ml-auto text-emerald-700 font-bold">Solved ✓</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right Canvas: PDF Viewer OR Interactive Swadhyay */}
          <main className="flex-1 flex flex-col min-h-0 bg-[#FAF9F5] overflow-hidden">
            
            {/* Active Chapter Header Ribbon */}
            <div className="flex-shrink-0 bg-white border-b border-[#E5E3DC] px-4 md:px-6 py-2.5 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C96442] tracking-wider block">
                  Standard {grade} • {selectedSubject}
                </span>
                <h2 className="text-sm md:text-base font-bold text-[#1F1E1D] leading-tight">
                  Chapter {selectedChapterNo}: {exerciseDetail?.chapter_title || activeChapter?.chapter_title || `Chapter ${selectedChapterNo}`}
                </h2>
              </div>

              {/* Action Buttons for the active chapter & Mode Toggle */}
              <div className="flex items-center gap-2">
                {/* Secondary Mode Toggle: Book PDF View vs Interactive Cards */}
                <div className="hidden sm:flex bg-[#F3F1EC] p-0.5 rounded-xl border border-[#E5E3DC] items-center">
                  <button
                    onClick={() => setViewMode('pdf')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      viewMode === 'pdf'
                        ? 'bg-white text-[#C96442] shadow-2xs'
                        : 'text-[#6B6862] hover:text-[#1F1E1D]'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span>PDF View</span>
                  </button>
                  <button
                    onClick={() => setViewMode('interactive')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      viewMode === 'interactive'
                        ? 'bg-white text-[#C96442] shadow-2xs'
                        : 'text-[#6B6862] hover:text-[#1F1E1D]'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Cards</span>
                  </button>
                </div>

                <a
                  href={pdfUrl}
                  download={`GSEB_Std${grade}_${selectedSubject}_Ch${selectedChapterNo}_Solved_Exercise.pdf`}
                  className="px-3 py-1.5 rounded-xl bg-[#F3F1EC] hover:bg-[#EAE7DF] border border-[#E5E3DC] text-xs font-bold text-[#1F1E1D] flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Download this solved chapter as a clean PDF"
                >
                  <Download className="w-3.5 h-3.5 text-[#C96442]" />
                  <span className="hidden sm:inline">Download PDF</span>
                </a>

                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-xl hover:bg-[#F3F1EC] border border-[#E5E3DC] text-[#6B6862] hover:text-[#1F1E1D] transition-colors"
                  title="Open PDF in new browser tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Canvas Content */}
            <div className="flex-1 min-h-0 relative">
              {loadingDetail ? (
                <div className="h-full flex flex-col items-center justify-center p-8 space-y-3 text-xs text-[#6B6862]">
                  <VidyAILogo size={28} animated={true} />
                  <p className="font-semibold text-[#1F1E1D]">Compiling official GSEB textbook exercise...</p>
                  <p className="text-[11px] text-[#949088]">Rendering verified step-by-step solutions with marking scheme</p>
                </div>
              ) : viewMode === 'pdf' ? (
                
                /* MODE 1: Official Book PDF View (Embedded PDF Viewer) */
                <div className="w-full h-full flex flex-col bg-[#525659] relative">
                  {/* PDF Controls Overlay */}
                  <div className="flex-shrink-0 bg-[#323639] text-white px-4 py-2 flex items-center justify-between text-xs border-b border-black/40">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Official GSEB Textbook Solved PDF</span>
                      <span className="text-[10px] text-gray-400">• Standard {grade} Swadhyay</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setZoomLevel(prev => Math.max(prev - 15, 60))}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-mono">{zoomLevel}%</span>
                      <button
                        onClick={() => setZoomLevel(prev => Math.min(prev + 15, 160))}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setZoomLevel(100)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title="Reset Zoom"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* PDF Embed / Object */}
                  <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-[#525659]">
                    <object
                      data={`${pdfUrl}#zoom=${zoomLevel}`}
                      type="application/pdf"
                      className="w-full h-full border-none shadow-lg"
                    >
                      <iframe
                        src={`${pdfUrl}#zoom=${zoomLevel}`}
                        className="w-full h-full border-none"
                        title="GSEB Textbook Solved Exercise PDF"
                      >
                        <div className="p-8 text-center text-white space-y-4">
                          <p>Your browser does not support embedded PDF viewing.</p>
                          <a
                            href={pdfUrl}
                            download
                            className="px-4 py-2 rounded-xl bg-[#C96442] text-white font-bold inline-flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Chapter Solved PDF</span>
                          </a>
                        </div>
                      </iframe>
                    </object>
                  </div>
                </div>

              ) : (

                /* MODE 2: Interactive Solved Swadhyay (Rich Cards with KaTeX) */
                <div className="h-full overflow-y-auto p-4 md:p-8 space-y-4">
                  <div className="max-w-4xl mx-auto space-y-4">
                    
                    {/* Overview Card */}
                    <div className="bg-white rounded-2xl p-5 border border-[#E5E3DC] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1F1E1D]">Textbook Exercise Overview</span>
                          <span className="text-[10px] bg-[#C96442]/10 text-[#C96442] px-2 py-0.5 rounded-full font-bold">
                            {exerciseDetail?.exercises?.length || 0} Questions
                          </span>
                        </div>
                        <p className="text-xs text-[#6B6862] mt-0.5">
                          {exerciseDetail?.concepts || 'GSEB English Medium Textbook Syllabus'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const allOpen = Object.values(expandedSolutions).every(Boolean);
                            const next: Record<number, boolean> = {};
                            exerciseDetail?.exercises.forEach((_, i) => { next[i] = !allOpen; });
                            setExpandedSolutions(next);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#F3F1EC] hover:bg-[#EAE7DF] text-xs font-semibold text-[#1F1E1D] transition-colors flex items-center gap-1.5"
                        >
                          {Object.values(expandedSolutions).every(Boolean) ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-[#6B6862]" />
                              <span>Collapse Solutions</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-[#C96442]" />
                              <span>Expand All Solutions</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Question Cards */}
                    {(!exerciseDetail?.exercises || exerciseDetail.exercises.length === 0) ? (
                      <div className="bg-white p-8 rounded-2xl text-center text-xs text-[#949088] border border-[#E5E3DC]">
                        No exercises found for this chapter.
                      </div>
                    ) : (
                      exerciseDetail.exercises.map((ex, idx) => {
                        const isExpanded = expandedSolutions[idx] ?? true;
                        return (
                          <div 
                            key={idx}
                            className="bg-white rounded-2xl border border-[#E5E3DC] shadow-xs overflow-hidden transition-all hover:border-[#C96442]/30"
                          >
                            {/* Card Header: Question & Section */}
                            <div className="p-5 border-b border-[#E5E3DC]/70">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[11px] font-bold text-[#C96442] uppercase tracking-wider">
                                  Q{ex.q_no}. {ex.section}
                                </span>
                                <span className="text-[11px] font-bold bg-[#F3F1EC] text-[#6B6862] px-2 py-0.5 rounded-md">
                                  {ex.marks} {ex.marks === 1 ? 'Mark' : 'Marks'}
                                </span>
                              </div>

                              <div className="text-sm font-semibold text-[#1F1E1D] leading-relaxed">
                                <MarkdownWithMath content={ex.question} latexAllowed={grade >= 6} />
                              </div>

                              {/* Card Footer Actions */}
                              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[#E5E3DC]/60">
                                <button
                                  onClick={() => toggleSolution(idx)}
                                  className="text-xs font-bold text-[#C96442] hover:underline flex items-center gap-1"
                                >
                                  <span>{isExpanded ? 'Hide Solution' : 'View Step-by-Step Solution'}</span>
                                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </button>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleAskInChat(ex)}
                                    className="px-2.5 py-1 rounded-lg bg-[#FAF9F5] hover:bg-[#F3F1EC] border border-[#E5E3DC] text-[11px] font-semibold text-[#1F1E1D] transition-colors flex items-center gap-1"
                                    title="Ask VidyAI Teacher to explain this in chat"
                                  >
                                    <Sparkles className="w-3 h-3 text-[#C96442]" />
                                    <span>Ask Teacher</span>
                                  </button>

                                  <button
                                    onClick={() => handleSaveNote(ex, idx)}
                                    className="px-2.5 py-1 rounded-lg bg-[#FAF9F5] hover:bg-[#F3F1EC] border border-[#E5E3DC] text-[11px] font-semibold text-[#1F1E1D] transition-colors flex items-center gap-1"
                                    title="Save solution to Study Notebook"
                                  >
                                    {savedIndex === idx ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span className="text-emerald-700">Saved!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Bookmark className="w-3 h-3 text-[#6B6862]" />
                                        <span>Save Note</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expandable Solved Content */}
                            {isExpanded && (
                              <div className="p-5 bg-[#FAF9F5]/70 space-y-3.5 border-t border-[#E5E3DC]/40">
                                <div>
                                  <span className="text-[10px] font-bold text-[#949088] uppercase tracking-wider block mb-1">
                                    Step-by-Step Solution (Board Marking Scheme)
                                  </span>
                                  <div className="text-xs text-[#2E2D2A] leading-relaxed whitespace-pre-line bg-white p-3.5 rounded-xl border border-[#E5E3DC]/80 font-sans">
                                    <MarkdownWithMath content={ex.solution} latexAllowed={grade >= 6} />
                                  </div>
                                </div>

                                {ex.final_answer && (
                                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 flex items-start gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                      <span className="font-bold">Final Answer: </span>
                                      <span>{ex.final_answer}</span>
                                    </div>
                                  </div>
                                )}

                                {ex.board_tip && (
                                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-950 flex items-start gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs">
                                      <span className="font-bold">GSEB Board Exam Tip: </span>
                                      <span>{ex.board_tip}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                  </div>
                </div>

              )}
            </div>

          </main>
        </div>

      ) : (

        /* ========================================================
           TAB 2: CUSTOM HOMEWORK & QUESTION SOLVER (OPTION 1)
           ======================================================== */
        <div className="flex-1 overflow-y-auto p-4 md:p-8 min-h-0">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-amber-50/60 via-white to-amber-50/40 rounded-2xl p-5 md:p-6 border border-[#E5E3DC] shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C96442]/10 text-[#C96442] border border-[#C96442]/20">
                      GSEB Standard {grade} • {selectedSubject}
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Option 1 Active
                    </span>
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-[#1F1E1D]">
                    Custom Homework & Question Solver
                  </h2>
                  <p className="text-xs text-[#6B6862] leading-relaxed">
                    Paste or type any homework numerical, exercise problem, or board exam question to receive 
                    Socratic hints or a clean GSEB model answer ready to copy into your notebook.
                  </p>
                </div>

                <div className="hidden sm:block text-right">
                  <span className="text-[10px] text-[#949088] block">Attribution</span>
                  <span className="text-[11px] font-semibold text-[#1F1E1D]">Coded by Soham Rajpurohit</span>
                </div>
              </div>
            </div>

            {/* Input Form Card */}
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#E5E3DC] shadow-xs space-y-4">
              
              {/* Question Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1F1E1D] flex items-center justify-between">
                  <span>Enter Your Question or Exercise Problem</span>
                  <span className="text-[11px] font-normal text-[#949088]">
                    Press Ctrl + Enter to solve
                  </span>
                </label>
                
                <textarea
                  rows={4}
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSolveCustom();
                    }
                  }}
                  placeholder={`Paste or type any question from your Standard ${grade} ${selectedSubject} textbook, worksheet, or homework assignment...`}
                  className="w-full p-3.5 text-xs md:text-sm rounded-xl bg-[#FAF9F5] border border-[#E5E3DC] text-[#1F1E1D] placeholder-[#949088] focus:outline-none focus:border-[#C96442] focus:bg-white transition-all resize-y"
                />
              </div>

              {/* Sample Question Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#949088] uppercase tracking-wider block">
                  Quick Sample Questions for Std {grade} {selectedSubject}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sampleQuestions.map((sq, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCustomQuestion(sq);
                        handleSolveCustom(sq);
                      }}
                      className="text-left px-2.5 py-1 rounded-lg bg-[#F3F1EC] hover:bg-[#EAE7DF] border border-[#E5E3DC] text-[11px] text-[#2E2D2A] transition-colors line-clamp-1 max-w-full"
                      title={sq}
                    >
                      <span className="text-[#C96442] font-bold mr-1">✦</span>
                      <span>{sq}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Solve Mode Toggle & Options */}
              <div className="pt-3 border-t border-[#E5E3DC] flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Mode Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1F1E1D]">Output Mode:</span>
                  <div className="bg-[#F3F1EC] p-0.5 rounded-xl border border-[#E5E3DC] flex items-center">
                    <button
                      type="button"
                      onClick={() => setSolverMode('notebook')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        solverMode === 'notebook'
                          ? 'bg-[#C96442] text-white shadow-2xs'
                          : 'text-[#6B6862] hover:text-[#1F1E1D]'
                      }`}
                      title="GSEB Board model answer with marks allocation to copy into notebook"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Notebook-Ready (Exam Mode)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSolverMode('hint')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        solverMode === 'hint'
                          ? 'bg-[#C96442] text-white shadow-2xs'
                          : 'text-[#6B6862] hover:text-[#1F1E1D]'
                      }`}
                      title="Socratic guidance with clues and interactive blanks"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Hint Mode (Socratic Guide)</span>
                    </button>
                  </div>
                </div>

                {/* Additional Toggles */}
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[#2E2D2A]">
                    <input
                      type="checkbox"
                      checked={includeGujarati}
                      onChange={(e) => setIncludeGujarati(e.target.checked)}
                      className="rounded text-[#C96442] focus:ring-[#C96442]"
                    />
                    <Globe className="w-3.5 h-3.5 text-[#C96442]" />
                    <span>Bilingual Glossary</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[#2E2D2A]">
                    <input
                      type="checkbox"
                      checked={simpleLanguage}
                      onChange={(e) => setSimpleLanguage(e.target.checked)}
                      className="rounded text-[#C96442] focus:ring-[#C96442]"
                    />
                    <span>Explain Simply</span>
                  </label>
                </div>

                {/* Solve Action Button */}
                <button
                  onClick={() => handleSolveCustom()}
                  disabled={isSolving || !customQuestion.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#C96442] hover:bg-[#B35334] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs flex-shrink-0"
                >
                  {isSolving ? (
                    <>
                      <VidyAILogo size={14} animated={true} />
                      <span>Solving Question...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Solve Question</span>
                    </>
                  )}
                </button>

              </div>

              {solveError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs">
                  {solveError}
                </div>
              )}
            </div>

            {/* Solved Results Section */}
            {solveResult && (
              <div className="space-y-4 animate-in fade-in duration-300">
                
                {/* Result Card Header */}
                <div className="bg-white rounded-2xl p-5 border border-[#E5E3DC] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        solveResult.mode === 'hint'
                          ? 'bg-amber-500/10 text-amber-900 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-900 border border-emerald-500/20'
                      }`}>
                        {solveResult.mode === 'hint' ? '💡 Socratic Hint Mode' : '📝 Notebook-Ready GSEB Model Answer'}
                      </span>
                      <span className="text-xs text-[#949088]">
                        Standard {solveResult.grade} • {solveResult.subject}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#1F1E1D] line-clamp-2">
                      {solveResult.question}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleCopyCustomSolution}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] hover:bg-[#F3F1EC] border border-[#E5E3DC] text-xs font-semibold text-[#1F1E1D] transition-colors flex items-center gap-1.5"
                      title="Copy formatted answer"
                    >
                      {copiedCustom ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#6B6862]" />}
                      <span>{copiedCustom ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={handleSaveCustomToNotebook}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF9F5] hover:bg-[#F3F1EC] border border-[#E5E3DC] text-xs font-semibold text-[#1F1E1D] transition-colors flex items-center gap-1.5"
                      title="Save to Study Notebook"
                    >
                      {savedCustom ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5 text-[#6B6862]" />}
                      <span>{savedCustom ? 'Saved Note!' : 'Save Note'}</span>
                    </button>

                    <button
                      onClick={handleAskCustomInChat}
                      className="px-3 py-1.5 rounded-xl bg-[#C96442]/10 hover:bg-[#C96442]/20 border border-[#C96442]/30 text-xs font-bold text-[#C96442] transition-colors flex items-center gap-1.5"
                      title="Discuss with Teacher Vidya in chat"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#C96442]" />
                      <span>Ask Teacher</span>
                    </button>
                  </div>
                </div>

                {/* 1. Step-by-Step Marking Breakdown */}
                {solveResult.solution_steps && solveResult.solution_steps.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#E5E3DC] shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-[#1F1E1D] uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#C96442]" />
                      <span>{solveResult.mode === 'hint' ? 'Socratic Step Guidance' : 'GSEB Board Marking Steps Breakdown'}</span>
                    </h3>

                    <div className="space-y-2.5">
                      {solveResult.solution_steps.map((step, sIdx) => (
                        <div 
                          key={sIdx}
                          className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E3DC] text-xs text-[#2E2D2A] leading-relaxed flex items-start gap-3"
                        >
                          <div className="w-5 h-5 rounded-md bg-[#C96442]/10 text-[#C96442] text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {sIdx + 1}
                          </div>
                          <div className="flex-1">
                            <MarkdownWithMath content={step} latexAllowed={grade >= 6} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Full Model Answer / Notebook Ready Presentation */}
                <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#E5E3DC] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#1F1E1D] uppercase tracking-wider flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-[#C96442]" />
                      <span>Complete Solution Presentation</span>
                    </h3>
                    <span className="text-[10px] text-[#949088] font-mono">
                      LaTeX Math Enabled
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E5E3DC] text-xs md:text-sm text-[#1F1E1D] leading-relaxed whitespace-pre-line font-sans">
                    <MarkdownWithMath content={solveResult.model_answer} latexAllowed={grade >= 6} />
                  </div>
                </div>

                {/* 3. Final Answer Box */}
                {solveResult.final_answer && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-950 flex items-start gap-3 shadow-2xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs md:text-sm">
                      <span className="font-bold text-emerald-900 block mb-0.5">Final Answer / Conclusion:</span>
                      <span className="font-semibold">{solveResult.final_answer}</span>
                    </div>
                  </div>
                )}

                {/* 4. GSEB Board Exam Tip */}
                {solveResult.board_tip && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-950 flex items-start gap-3 shadow-2xs">
                    <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-amber-900 block mb-0.5">GSEB Board Exam Tip & Marking Rubric:</span>
                      <p className="leading-relaxed">{solveResult.board_tip}</p>
                    </div>
                  </div>
                )}

                {/* 5. Bilingual Support Glossary (English + Gujarati) */}
                {solveResult.bilingual_glossary && solveResult.bilingual_glossary.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-[#E5E3DC] shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#C96442]" />
                      <h3 className="text-xs font-bold text-[#1F1E1D] uppercase tracking-wider">
                        Bilingual Vocabulary & Terminology (English + Gujarati)
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {solveResult.bilingual_glossary.map((item, gIdx) => (
                        <div 
                          key={gIdx}
                          className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E3DC] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#1F1E1D]">{item.english_term}</span>
                            <span className="text-[11px] font-semibold text-[#C96442] bg-[#C96442]/10 px-2 py-0.5 rounded-md">
                              {item.gujarati_term}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B6862] leading-tight">
                            {item.definition}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Practice Twin Question (Self-Test Comprehension) */}
                {solveResult.twin_question && (
                  <div className="bg-gradient-to-r from-orange-50/50 via-white to-amber-50/50 rounded-2xl p-5 border border-[#E5E3DC] shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RotateCw className="w-4 h-4 text-[#C96442]" />
                        <h3 className="text-xs font-bold text-[#1F1E1D] uppercase tracking-wider">
                          Practice Twin Question (Test Your Understanding)
                        </h3>
                      </div>
                      <span className="text-[10px] bg-[#C96442]/10 text-[#C96442] font-bold px-2 py-0.5 rounded-full">
                        Parallel Question
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-[#E5E3DC] text-xs font-semibold text-[#1F1E1D] leading-relaxed">
                      <MarkdownWithMath content={solveResult.twin_question.question} latexAllowed={grade >= 6} />
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <p className="text-[11px] text-[#6B6862]">
                        💡 <b>Hint:</b> {solveResult.twin_question.hint}
                      </p>

                      <button
                        onClick={() => setShowTwinSolution(prev => !prev)}
                        className="px-3 py-1 rounded-lg bg-[#FAF9F5] hover:bg-[#F3F1EC] border border-[#E5E3DC] text-xs font-bold text-[#C96442] transition-colors flex items-center gap-1 flex-shrink-0"
                      >
                        <span>{showTwinSolution ? 'Hide Twin Solution' : 'Check Twin Answer'}</span>
                        {showTwinSolution ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {showTwinSolution && (
                      <div className="p-4 rounded-xl bg-white border border-[#E5E3DC] space-y-2 text-xs animate-in fade-in duration-200">
                        <div>
                          <span className="font-bold text-[#949088] uppercase text-[10px] block">Twin Working:</span>
                          <div className="text-[#2E2D2A] mt-1">
                            <MarkdownWithMath content={solveResult.twin_question.solution} latexAllowed={grade >= 6} />
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 font-semibold text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Final Twin Answer: {solveResult.twin_question.final_answer}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

          </div>
        </div>

      )}

    </div>
  );
};
