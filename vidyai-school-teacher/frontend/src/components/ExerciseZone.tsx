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
  EyeOff
} from 'lucide-react';
import { api, ExerciseChapterItem, ExerciseDetailResponse, ExerciseQuestion } from '@/lib/api';
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
  
  const [chapters, setChapters] = useState<ExerciseChapterItem[]>([]);
  const [selectedChapterNo, setSelectedChapterNo] = useState<number>(1);
  const [exerciseDetail, setExerciseDetail] = useState<ExerciseDetailResponse | null>(null);
  const [loadingChapters, setLoadingChapters] = useState<boolean>(true);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  
  // View mode: 'pdf' (book PDF only) or 'interactive' (step-by-step interactive solutions)
  const [viewMode, setViewMode] = useState<'pdf' | 'interactive'>('pdf');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSolutions, setExpandedSolutions] = useState<Record<number, boolean>>({});
  const [savedIndex, setSavedIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

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
            <div className="w-8 h-8 rounded-xl bg-[#C96442]/10 border border-[#C96442]/20 flex items-center justify-center text-[#C96442]">
              <BookCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-[#1F1E1D] tracking-tight">
                  Exercise Zone (Swadhyay)
                </h1>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  Official Book PDF Solved
                </span>
              </div>
              <p className="text-[11px] text-[#6B6862]">
                Official GSEB Textbook end-of-chapter questions with step-by-step verified solutions.
              </p>
            </div>
          </div>

          {/* Right: Mode Switcher & Standard Pill */}
          <div className="flex items-center gap-2">
            {/* Standard Button */}
            <button
              onClick={onOpenGradeModal}
              className="px-2.5 py-1.5 rounded-xl bg-[#F3F1EC] hover:bg-[#EAE7DF] border border-[#E5E3DC] text-xs font-bold text-[#1F1E1D] flex items-center gap-1.5 transition-colors"
              title="Change GSEB Standard"
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#C96442]" />
              <span>Std {grade}</span>
              <ChevronDown className="w-3 h-3 text-[#949088]" />
            </button>

            {/* Mode Switcher: PDF vs Interactive */}
            <div className="bg-[#F3F1EC] p-0.5 rounded-xl border border-[#E5E3DC] flex items-center">
              <button
                onClick={() => setViewMode('pdf')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'pdf'
                    ? 'bg-white text-[#C96442] shadow-2xs'
                    : 'text-[#6B6862] hover:text-[#1F1E1D]'
                }`}
                title="View authentic textbook PDF document"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Book PDF View</span>
              </button>

              <button
                onClick={() => setViewMode('interactive')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'interactive'
                    ? 'bg-white text-[#C96442] shadow-2xs'
                    : 'text-[#6B6862] hover:text-[#1F1E1D]'
                }`}
                title="Interactive step-by-step solution cards"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interactive Swadhyay</span>
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

      {/* 2. Main Two-Column Layout */}
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

            {/* Action Buttons for the active chapter */}
            <div className="flex items-center gap-2">
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

    </div>
  );
};
