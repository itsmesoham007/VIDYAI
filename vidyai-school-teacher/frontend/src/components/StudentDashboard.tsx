'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Flame, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  ArrowUpRight, 
  BarChart3, 
  Search, 
  Target, 
  Layers, 
  Lightbulb, 
  FileText,
  RotateCcw,
  Check,
  Compass
} from 'lucide-react';
import { api, PortalStats, ChapterMastery, SubjectStat } from '@/lib/api';

interface StudentDashboardProps {
  grade: number;
  studentName: string;
  onNavigateToChat: (initialPrompt?: string, targetSubject?: string) => void;
  onOpenNotebook: () => void;
  onOpenQuiz: (topic?: string, subject?: string) => void;
  onOpenPapers: () => void;
  onGradeChange: (grade: number) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  grade,
  studentName,
  onNavigateToChat,
  onOpenNotebook,
  onOpenQuiz,
  onOpenPapers,
  onGradeChange
}) => {
  const studentId = `stu_${(studentName || 'student').toLowerCase().replace(/\s+/g, '_')}`;
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [chapters, setChapters] = useState<ChapterMastery[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedSubjects, setExpandedSubjects] = useState<{ [subject: string]: boolean }>({});
  const [updatingChapterId, setUpdatingChapterId] = useState<number | null>(null);

  // Load portal stats and chapters
  useEffect(() => {
    loadDashboardData();
  }, [grade, studentName]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Ensure student profile is registered & active
      await api.getPortalProfile(studentName || 'GSEB Student', grade);

      // 2. Fetch stats
      const statsRes = await api.getPortalStats(studentId, grade);
      setStats(statsRes.stats);

      // 3. Fetch chapter mastery
      const masteryRes = await api.getPortalMastery(studentId, grade);
      setChapters(masteryRes.chapters || []);

      // Auto-expand the first 2 subjects
      if (statsRes.stats?.subjects?.length > 0) {
        const initialExpand: { [k: string]: boolean } = {};
        statsRes.stats.subjects.slice(0, 3).forEach(s => {
          initialExpand[s.subject] = true;
        });
        setExpandedSubjects(initialExpand);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    ch: ChapterMastery,
    newStatus: 'not_started' | 'in_progress' | 'mastered'
  ) => {
    setUpdatingChapterId(ch.id);
    try {
      const newConfidence = newStatus === 'mastered' ? 95 : newStatus === 'in_progress' ? 50 : 0;
      await api.updateChapterMastery(studentId, grade, ch.subject, ch.chapter_no, newStatus, newConfidence);

      // Optimistically update local state
      setChapters(prev => prev.map(item => {
        if (item.id === ch.id) {
          return { ...item, status: newStatus, confidence_score: newConfidence };
        }
        return item;
      }));

      // Refresh stats
      const statsRes = await api.getPortalStats(studentId, grade);
      setStats(statsRes.stats);
    } catch (err) {
      console.error('Failed to update chapter status:', err);
    } finally {
      setUpdatingChapterId(null);
    }
  };

  const toggleSubjectExpand = (sub: string) => {
    setExpandedSubjects(prev => ({ ...prev, [sub]: !prev[sub] }));
  };

  // Filter chapters
  const filteredChapters = chapters.filter(ch => {
    const matchesSub = selectedSubject === 'all' || ch.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchesSearch = !searchQuery.trim() || 
      ch.chapter_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ch.concepts && ch.concepts.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSub && matchesSearch;
  });

  // Group filtered chapters by subject
  const groupedChapters: { [subject: string]: ChapterMastery[] } = {};
  filteredChapters.forEach(ch => {
    if (!groupedChapters[ch.subject]) {
      groupedChapters[ch.subject] = [];
    }
    groupedChapters[ch.subject].push(ch);
  });

  const subjectsList = stats?.subjects || [];
  const overallPct = stats?.overall_completion_percentage || 0;
  const streak = stats?.daily_streak || 1;
  const totalCh = stats?.total_chapters || chapters.length;
  const masteredCh = stats?.mastered_chapters || chapters.filter(c => c.status === 'mastered').length;
  const inProgressCh = chapters.filter(c => c.status === 'in_progress').length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAF9F5] text-[#1F1E1D] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* 1. Header Banner */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#E5E3DC] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#C96442]/10 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBF0EB] border border-[#C96442]/20 text-[#C96442] text-xs font-bold mb-3">
                <Compass className="w-3.5 h-3.5" />
                <span>GSEB Standard {grade} • English Medium Learning Portal</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1F1E1D]">
                Namaste, {studentName || 'Superstar'}! 🌟
              </h1>
              <p className="text-sm text-[#6B6862] mt-1">
                Your Gujarat Board syllabus tracking, revision analytics, and AI study roadmap.
              </p>
            </div>

            {/* Streak & Goal Badges */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Flame className="w-5 h-5 fill-amber-500 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block">Study Streak</span>
                  <span className="text-base font-bold text-amber-900 leading-none">{streak} Days Active</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#F5F3EC] border border-[#E5E3DC]">
                <div className="w-9 h-9 rounded-lg bg-[#C96442]/10 flex items-center justify-center text-[#C96442]">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#6B6862] tracking-wider block">Board Target</span>
                  <span className="text-base font-bold text-[#1F1E1D] leading-none">
                    {stats?.student?.target_score || 90}% SSC/HSC
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Syllabus Progress Bar */}
          <div className="mt-6 pt-5 border-t border-[#E5E3DC]/70">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-[#6B6862] flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-[#C96442]" />
                Overall GSEB Syllabus Mastery
              </span>
              <span className="text-[#C96442] font-bold text-sm">{overallPct}% Completed</span>
            </div>
            <div className="w-full h-3 bg-[#EAE7DF] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#C96442] via-amber-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.max(overallPct, 2)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#949088] mt-2">
              <span>{masteredCh} of {totalCh} Chapters Mastered</span>
              <span>{inProgressCh} in Progress</span>
            </div>
          </div>
        </div>

        {/* 2. Quick Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-[#E5E3DC] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-[#6B6862] font-medium">
              <span>Total Chapters</span>
              <BookOpen className="w-4 h-4 text-[#C96442]" />
            </div>
            <div className="text-2xl font-bold text-[#1F1E1D] mt-2">{totalCh}</div>
            <div className="text-[11px] text-[#949088] mt-0.5">Across {subjectsList.length} Subjects</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E3DC] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
              <span>Mastered (Board-Ready)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-800 mt-2">{masteredCh}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Confidence $\ge$ 80%</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E3DC] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-amber-700 font-medium">
              <span>Under Revision</span>
              <RotateCcw className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-800 mt-2">{inProgressCh}</div>
            <div className="text-[11px] text-amber-600 mt-0.5">Active concepts</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E3DC] shadow-2xs">
            <div className="flex items-center justify-between text-xs text-[#C96442] font-medium">
              <span>Saved Notes & Formulas</span>
              <FileText className="w-4 h-4 text-[#C96442]" />
            </div>
            <div className="text-2xl font-bold text-[#C96442] mt-2">{stats?.notes_count || 0}</div>
            <button 
              onClick={onOpenNotebook}
              className="text-[11px] font-semibold text-[#C96442] hover:underline mt-0.5 inline-flex items-center gap-0.5"
            >
              Open Notebook <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 3. Action Hub Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div 
            onClick={() => onNavigateToChat(`I am ready to learn! Please guide me through Standard ${grade} topics.`, subjectsList[0]?.subject || 'Mathematics')}
            className="group cursor-pointer p-4 rounded-xl bg-white border border-[#E5E3DC] hover:border-[#C96442]/60 hover:shadow-xs transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FBF0EB] text-[#C96442] flex items-center justify-center font-bold">
                💬
              </div>
              <div>
                <span className="text-xs font-bold text-[#1F1E1D] group-hover:text-[#C96442] block transition-colors">
                  Ask AI Teacher
                </span>
                <span className="text-[11px] text-[#6B6862]">
                  Socratic tutoring with GSEB textbooks
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#949088] group-hover:text-[#C96442] transition-colors" />
          </div>

          <div 
            onClick={() => onOpenQuiz(subjectsList[0]?.subject || 'Mathematics', subjectsList[0]?.subject || 'Mathematics')}
            className="group cursor-pointer p-4 rounded-xl bg-white border border-[#E5E3DC] hover:border-[#C96442]/60 hover:shadow-xs transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                📝
              </div>
              <div>
                <span className="text-xs font-bold text-[#1F1E1D] group-hover:text-emerald-700 block transition-colors">
                  Take Chapter Quiz
                </span>
                <span className="text-[11px] text-[#6B6862]">
                  Diagnostic MCQ assessment
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#949088] group-hover:text-emerald-700 transition-colors" />
          </div>

          <div 
            onClick={onOpenPapers}
            className="group cursor-pointer p-4 rounded-xl bg-white border border-[#E5E3DC] hover:border-[#C96442]/60 hover:shadow-xs transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                📜
              </div>
              <div>
                <span className="text-xs font-bold text-[#1F1E1D] group-hover:text-indigo-700 block transition-colors">
                  GSEB Past Papers
                </span>
                <span className="text-[11px] text-[#6B6862]">
                  10-year official board questions & blueprints
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#949088] group-hover:text-indigo-700 transition-colors" />
          </div>
        </div>

        {/* 4. Curriculum Chapters Mastery Explorer */}
        <div className="bg-white rounded-2xl border border-[#E5E3DC] p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#1F1E1D]">GSEB Curriculum Chapter Mastery</h2>
              <p className="text-xs text-[#6B6862]">
                Mark each chapter's revision status to keep your Gujarat Board exam prep on schedule.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-[#949088] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search chapter or concept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF9F5] rounded-xl border border-[#E5E3DC] focus:outline-none focus:border-[#C96442]"
              />
            </div>
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSubject === 'all'
                  ? 'bg-[#C96442] text-white shadow-xs'
                  : 'bg-[#F5F3EC] text-[#6B6862] hover:bg-[#EAE7DF]'
              }`}
            >
              All Subjects ({chapters.length})
            </button>
            {subjectsList.map(sub => (
              <button
                key={sub.subject}
                onClick={() => setSelectedSubject(sub.subject)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedSubject.toLowerCase() === sub.subject.toLowerCase()
                    ? 'bg-[#C96442] text-white shadow-xs'
                    : 'bg-[#F5F3EC] text-[#6B6862] hover:bg-[#EAE7DF]'
                }`}
              >
                <span>{sub.subject}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedSubject.toLowerCase() === sub.subject.toLowerCase()
                    ? 'bg-white/20 text-white'
                    : 'bg-[#E5E3DC] text-[#6B6862]'
                }`}>
                  {sub.completion_percentage}%
                </span>
              </button>
            ))}
          </div>

          {/* Grouped Chapter Accordions */}
          {loading ? (
            <div className="py-12 text-center text-xs text-[#949088]">
              Loading GSEB English Medium syllabus...
            </div>
          ) : Object.keys(groupedChapters).length === 0 ? (
            <div className="py-12 text-center text-xs text-[#949088] bg-[#FAF9F5] rounded-xl border border-dashed border-[#E5E3DC]">
              No chapters found matching &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {Object.entries(groupedChapters).map(([subjectName, chList]) => {
                const subStat = subjectsList.find(s => s.subject.toLowerCase() === subjectName.toLowerCase());
                const isExpanded = expandedSubjects[subjectName] ?? false;
                const masteredCount = chList.filter(c => c.status === 'mastered').length;
                const subPct = chList.length > 0 ? Math.round((masteredCount / chList.length) * 100) : 0;

                return (
                  <div 
                    key={subjectName} 
                    className="border border-[#E5E3DC] rounded-xl overflow-hidden bg-white shadow-2xs"
                  >
                    {/* Subject Header */}
                    <div 
                      onClick={() => toggleSubjectExpand(subjectName)}
                      className="p-3.5 bg-[#FAF9F5] hover:bg-[#F5F3EC] cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#C96442]" />
                        <span className="text-sm font-bold text-[#1F1E1D]">{subjectName}</span>
                        <span className="text-xs text-[#6B6862]">
                          ({masteredCount}/{chList.length} Mastered)
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 w-32">
                          <div className="w-full h-1.5 bg-[#EAE7DF] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#C96442] rounded-full"
                              style={{ width: `${subPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-[#6B6862] w-7">{subPct}%</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#949088]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#949088]" />
                        )}
                      </div>
                    </div>

                    {/* Chapters List */}
                    {isExpanded && (
                      <div className="divide-y divide-[#E5E3DC]/60">
                        {chList.map(ch => {
                          const isMastered = ch.status === 'mastered';
                          const isInProg = ch.status === 'in_progress';
                          const isUpdating = updatingChapterId === ch.id;

                          return (
                            <div 
                              key={ch.id} 
                              className="p-3.5 hover:bg-[#FAF9F5]/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-bold text-[#C96442] bg-[#FBF0EB] px-2 py-0.5 rounded-md border border-[#C96442]/20">
                                    Ch {ch.chapter_no}
                                  </span>
                                  <span className="text-xs font-bold text-[#1F1E1D]">
                                    {ch.chapter_title}
                                  </span>
                                </div>
                                {ch.concepts && (
                                  <p className="text-[11px] text-[#6B6862] line-clamp-1">
                                    <span className="font-semibold text-[#8C827A]">Core Concepts: </span>
                                    {ch.concepts}
                                  </p>
                                )}
                              </div>

                              {/* Controls */}
                              <div className="flex items-center gap-2 self-end sm:self-center">
                                {/* 3-Way Status Toggle */}
                                <div className="inline-flex rounded-lg border border-[#E5E3DC] p-0.5 bg-[#FAF9F5] text-[11px] font-semibold">
                                  <button
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStatus(ch, 'not_started')}
                                    className={`px-2 py-1 rounded-md transition-all ${
                                      ch.status === 'not_started'
                                        ? 'bg-white text-[#6B6862] shadow-2xs font-bold'
                                        : 'text-[#949088] hover:text-[#1F1E1D]'
                                    }`}
                                  >
                                    Not Started
                                  </button>
                                  <button
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStatus(ch, 'in_progress')}
                                    className={`px-2 py-1 rounded-md transition-all ${
                                      isInProg
                                        ? 'bg-amber-100 text-amber-900 shadow-2xs font-bold'
                                        : 'text-[#949088] hover:text-amber-800'
                                    }`}
                                  >
                                    Learning 🟡
                                  </button>
                                  <button
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStatus(ch, 'mastered')}
                                    className={`px-2 py-1 rounded-md transition-all ${
                                      isMastered
                                        ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                                        : 'text-[#949088] hover:text-emerald-700'
                                    }`}
                                  >
                                    Mastered 🟢
                                  </button>
                                </div>

                                {/* Ask VidyAI button */}
                                <button
                                  onClick={() => onNavigateToChat(
                                    `Let's study GSEB Standard ${grade} ${ch.subject} Chapter ${ch.chapter_no}: "${ch.chapter_title}". Please explain the core definitions and highest-yield board exam questions.`,
                                    ch.subject
                                  )}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-[#C96442] hover:bg-[#FBF0EB] rounded-lg border border-[#C96442]/30 transition-colors flex items-center gap-1"
                                  title="Study this chapter with AI Teacher"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Study</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. GSEB Board Examination High-Yield Notice */}
        <div className="bg-gradient-to-r from-[#FBF0EB] to-[#FAF9F5] rounded-2xl border border-[#C96442]/30 p-5 flex items-start gap-3.5 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-[#C96442] text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
            💡
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-[#1F1E1D] uppercase tracking-wider">
              GSEB English Medium Examination Blueprint Tips
            </h3>
            <p className="text-xs text-[#6B6862] leading-relaxed">
              Gujarat State Board textbooks place 30% weightage on Section A objective items (1-mark), 
              20% on conceptual 2-mark Section B questions, and 50% on long analytical derivations and 4-mark theorems 
              (Section C & D). Keep your daily study streak active and use the <strong>Study Notebook</strong> to bookmark 
              model board proofs!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
