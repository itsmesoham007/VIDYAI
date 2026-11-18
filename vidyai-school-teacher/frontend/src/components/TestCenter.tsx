'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Sparkles, 
  HelpCircle, 
  BarChart3, 
  Timer, 
  Calendar, 
  ArrowRight, 
  Bookmark, 
  AlertTriangle,
  Play,
  Layers,
  ChevronRight
} from 'lucide-react';
import { api, QuizQuestion, QuizResponse, QuizAttempt } from '@/lib/api';
import { MarkdownWithMath } from '@/lib/renderMarkdown';

interface TestCenterProps {
  grade: number;
  subject: string;
  studentName: string;
  onNavigateToChat: (initialPrompt?: string, targetSubject?: string) => void;
  onOpenNotebook: () => void;
  onOpenFlashcards: () => void;
}

export const TestCenter: React.FC<TestCenterProps> = ({
  grade,
  subject,
  studentName,
  onNavigateToChat,
  onOpenNotebook,
  onOpenFlashcards
}) => {
  const studentId = `stu_${(studentName || 'student').toLowerCase().replace(/\s+/g, '_')}`;

  // History State
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);

  // Active Test Engine State
  const [isTestActive, setIsTestActive] = useState<boolean>(false);
  const [testTopic, setTestTopic] = useState<string>('High-Yield GSEB Board Syllabus');
  const [testSubject, setTestSubject] = useState<string>(subject || 'Mathematics');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [durationMinutes, setDurationMinutes] = useState<number>(10);
  const [timeRemaining, setTimeRemaining] = useState<number>(600);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: number }>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [lastAttemptResult, setLastAttemptResult] = useState<QuizAttempt | null>(null);
  const [savedMistakes, setSavedMistakes] = useState<boolean>(false);

  useEffect(() => {
    loadTestHistory();
  }, [grade, studentName]);

  const loadTestHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getQuizAttempts(studentId, grade);
      setHistory(res.quizzes || []);
    } catch (err) {
      console.error('Failed to load quiz history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (isTestActive && !isSubmitted && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTestActive, isSubmitted, timeRemaining]);

  const handleStartExam = async (mode: 'quick' | 'timed' | 'mock') => {
    const qCount = mode === 'quick' ? 5 : mode === 'timed' ? 10 : 15;
    const mins = mode === 'quick' ? 8 : mode === 'timed' ? 15 : 25;
    setNumQuestions(qCount);
    setDurationMinutes(mins);
    setTimeRemaining(mins * 60);
    setLoadingQuestions(true);
    setIsTestActive(true);
    setIsSubmitted(false);
    setSelectedAnswers({});
    setSavedMistakes(false);

    try {
      const data = await api.generateQuiz(grade, testSubject, testTopic, qCount, 'en');
      setQuizData(data);
    } catch (err) {
      console.error('Failed to generate test questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAutoSubmit = () => {
    handleSubmitExam();
  };

  const calculateScore = () => {
    if (!quizData) return 0;
    let score = 0;
    quizData.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct_index) {
        score += 1;
      }
    });
    return score;
  };

  const handleSubmitExam = async () => {
    setIsSubmitted(true);
    if (!quizData) return;

    const total = quizData.questions.length;
    let score = 0;
    const mistakes: any[] = [];

    quizData.questions.forEach(q => {
      const selected = selectedAnswers[q.id];
      if (selected === q.correct_index) {
        score += 1;
      } else {
        mistakes.push({
          qId: q.id,
          question: q.question,
          selectedAnswer: selected !== undefined ? q.options[selected] : 'Unanswered',
          correctAnswer: q.options[q.correct_index],
          explanation: q.explanation,
          concept: q.concept
        });
      }
    });

    const elapsed = (durationMinutes * 60) - timeRemaining;

    try {
      const res = await api.recordQuizAttempt({
        student_id: studentId,
        standard: grade,
        subject: testSubject,
        topic: testTopic,
        score,
        total,
        time_taken_seconds: elapsed,
        mistakes_summary: mistakes
      });
      setLastAttemptResult(res.quiz_attempt);
      loadTestHistory();
    } catch (err) {
      console.error('Failed to record attempt:', err);
    }
  };

  const handleSaveMistakesToNotebook = async () => {
    if (!quizData) return;
    const wrongQs = quizData.questions.filter(q => selectedAnswers[q.id] !== q.correct_index);
    if (wrongQs.length === 0) return;

    const noteTitle = `Exam Mistakes Diagnostic: ${testSubject} (${testTopic})`;
    const content = wrongQs.map((q, idx) => (
      `### Question ${idx + 1}: ${q.concept}\n` +
      `${q.question}\n\n` +
      `**Correct Answer:** ${q.options[q.correct_index]}\n\n` +
      `**GSEB Concept Breakdown:**\n${q.explanation}\n\n---\n`
    )).join('\n');

    try {
      await api.createStudyNote({
        student_id: studentId,
        standard: grade,
        subject: testSubject,
        chapter_title: testTopic,
        title: noteTitle,
        content,
        tags: ['Exam Diagnostic', 'Mistakes Review', testSubject]
      });
      setSavedMistakes(true);
    } catch (err) {
      console.error('Failed to save mistakes to notebook:', err);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Stats
  const totalTests = history.length;
  const avgScore = totalTests > 0
    ? Math.round(history.reduce((acc, h) => acc + (h.score * 100 / h.total), 0) / totalTests)
    : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAF9F5] text-[#1F1E1D] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* 1. Header Banner */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E3DC] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>GSEB Standard {grade} • Examination & Test Center</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1F1E1D]">
              Timed Board Practice & Diagnostic Center 📝
            </h1>
            <p className="text-xs text-[#6B6862] mt-1">
              GSEB exam simulations with countdown timers, persistent scorecards, and mistake diagnostic analysis.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-[#FAF9F5] border border-[#E5E3DC]">
              <span className="text-[10px] uppercase font-bold text-[#6B6862] block">Tests Completed</span>
              <span className="text-base font-bold text-[#1F1E1D]">{totalTests} Exams</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Average Score</span>
              <span className="text-base font-bold text-emerald-900">{avgScore}%</span>
            </div>
          </div>
        </div>

        {/* 2. Active Test Window (if taking exam) */}
        {isTestActive ? (
          <div className="bg-white rounded-2xl border border-[#C96442]/60 p-6 shadow-md space-y-6 animate-in fade-in duration-200">
            {/* Exam Top Bar */}
            <div className="flex items-center justify-between border-b border-[#E5E3DC] pb-4 flex-wrap gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FBF0EB] text-[#C96442] px-2.5 py-0.5 rounded-md border border-[#C96442]/20">
                  GSEB Std {grade} • {testSubject}
                </span>
                <h2 className="text-base font-bold text-[#1F1E1D] mt-1">{testTopic}</h2>
              </div>

              <div className="flex items-center gap-3">
                {/* Countdown Timer */}
                <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                  timeRemaining < 120 
                    ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse' 
                    : 'bg-[#FAF9F5] border-[#E5E3DC] text-[#1F1E1D]'
                }`}>
                  <Timer className="w-4 h-4 text-[#C96442]" />
                  <span>{formatTimer(timeRemaining)}</span>
                </div>

                <button
                  onClick={() => setIsTestActive(false)}
                  className="text-xs text-[#6B6862] hover:text-[#1F1E1D] px-2 py-1"
                >
                  Exit Exam
                </button>
              </div>
            </div>

            {loadingQuestions ? (
              <div className="py-16 text-center text-xs text-[#949088] space-y-2">
                <div className="w-6 h-6 border-2 border-[#C96442] border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Synthesizing GSEB Board Exam questions with answer keys...</p>
              </div>
            ) : quizData ? (
              <div className="space-y-6">
                {quizData.questions.map((q, idx) => {
                  const isAnswered = selectedAnswers[q.id] !== undefined;
                  const isCorrect = isSubmitted && selectedAnswers[q.id] === q.correct_index;

                  return (
                    <div 
                      key={q.id}
                      className={`p-5 rounded-2xl border space-y-3 transition-all ${
                        isSubmitted
                          ? isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                          : 'bg-[#FAF9F5] border-[#E5E3DC]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-bold text-[#C96442] font-mono">
                          Q{idx + 1} of {quizData.questions.length}
                        </span>
                        {q.concept && (
                          <span className="text-[10px] text-[#6B6862] bg-white px-2 py-0.5 rounded-md border border-[#E5E3DC]">
                            {q.concept}
                          </span>
                        )}
                      </div>

                      <div className="text-xs md:text-sm font-semibold text-[#1F1E1D] leading-relaxed">
                        <MarkdownWithMath content={q.question} />
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = selectedAnswers[q.id] === oIdx;
                          let optStyle = 'bg-white border-[#E5E3DC] text-[#1F1E1D] hover:bg-[#F3F1EC]';

                          if (isSubmitted) {
                            if (oIdx === q.correct_index) {
                              optStyle = 'bg-emerald-600 text-white font-bold border-emerald-600';
                            } else if (isSelected) {
                              optStyle = 'bg-rose-600 text-white font-bold border-rose-600';
                            } else {
                              optStyle = 'bg-white/60 text-[#949088] border-[#E5E3DC]';
                            }
                          } else if (isSelected) {
                            optStyle = 'bg-[#C96442] text-white font-bold border-[#C96442] shadow-xs';
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={isSubmitted}
                              onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                              className={`p-3 rounded-xl border text-xs text-left transition-all flex items-start gap-2.5 ${optStyle}`}
                            >
                              <span className="font-mono font-bold opacity-80">{String.fromCharCode(65 + oIdx)}.</span>
                              <span className="flex-1">{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Diagnostic Explanation */}
                      {isSubmitted && (
                        <div className={`p-3.5 rounded-xl text-xs space-y-1 mt-2 ${
                          isCorrect ? 'bg-emerald-100/60 text-emerald-950' : 'bg-rose-100/60 text-rose-950'
                        }`}>
                          <div className="font-bold flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-[#C96442]" />
                            <span>GSEB Solution Key & Concept:</span>
                          </div>
                          <div className="leading-relaxed">
                            <MarkdownWithMath content={q.explanation} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Submit & Result */}
                {!isSubmitted ? (
                  <button
                    onClick={handleSubmitExam}
                    disabled={Object.keys(selectedAnswers).length === 0}
                    className="w-full py-3.5 rounded-xl bg-[#C96442] hover:bg-[#B85536] text-white font-bold text-sm shadow-xs transition-all disabled:opacity-50"
                  >
                    Submit Exam ({Object.keys(selectedAnswers).length}/{quizData.questions.length} Answered)
                  </button>
                ) : (
                  <div className="p-6 rounded-2xl bg-[#FAF9F5] border border-[#E5E3DC] text-center space-y-3">
                    <div className="text-3xl font-black text-[#1F1E1D]">
                      Your Score: <span className="text-[#C96442]">{calculateScore()}</span> / {quizData.questions.length}
                    </div>
                    <p className="text-xs font-semibold text-[#6B6862]">
                      {calculateScore() === quizData.questions.length
                        ? '🌟 Perfect Score! Fully prepared for Gujarat Board questions!'
                        : 'Review the concept keys above to solidify your exam readiness.'}
                    </p>

                    <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                      {calculateScore() < quizData.questions.length && (
                        <button
                          onClick={handleSaveMistakesToNotebook}
                          disabled={savedMistakes}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-all flex items-center gap-1.5"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                          <span>{savedMistakes ? 'Mistakes Saved to Notebook! 📓' : 'Save Mistakes to Notebook'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setIsTestActive(false)}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-[#C96442] hover:bg-[#B85536] text-white shadow-xs"
                      >
                        Finish & View Dashboard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          /* 3. Launchpad: 3 Examination Modes */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#E5E3DC] p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#C96442]/40 transition-all">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  ⚡
                </div>
                <h3 className="text-base font-bold text-[#1F1E1D]">Quick Chapter Quiz</h3>
                <p className="text-xs text-[#6B6862] leading-relaxed">
                  5 fast multiple-choice questions to evaluate chapter understanding in 8 minutes.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#949088] pt-1">
                  <span>⏱️ 8 Mins</span>
                  <span>•</span>
                  <span>5 MCQs</span>
                  <span>•</span>
                  <span>Instant Keys</span>
                </div>
              </div>
              <button
                onClick={() => handleStartExam('quick')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Quick Quiz</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#C96442]/50 p-6 shadow-xs flex flex-col justify-between space-y-4 ring-1 ring-[#C96442]/20">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#FBF0EB] text-[#C96442] flex items-center justify-center font-bold">
                  ⏱️
                </div>
                <h3 className="text-base font-bold text-[#1F1E1D]">Timed Section Test</h3>
                <p className="text-xs text-[#6B6862] leading-relaxed">
                  10 questions matching Gujarat Board Section A weightage with live countdown timer.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#C96442] font-semibold pt-1">
                  <span>⏱️ 15 Mins</span>
                  <span>•</span>
                  <span>10 Questions</span>
                  <span>•</span>
                  <span>Board Standard</span>
                </div>
              </div>
              <button
                onClick={() => handleStartExam('timed')}
                className="w-full py-2.5 rounded-xl bg-[#C96442] hover:bg-[#B85536] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Timed Test</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E3DC] p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#C96442]/40 transition-all">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  📜
                </div>
                <h3 className="text-base font-bold text-[#1F1E1D]">Full Mock Exam</h3>
                <p className="text-xs text-[#6B6862] leading-relaxed">
                  15 questions covering multiple chapters to simulate formal annual board exams.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#949088] pt-1">
                  <span>⏱️ 25 Mins</span>
                  <span>•</span>
                  <span>15 Questions</span>
                  <span>•</span>
                  <span>Diagnostic Radar</span>
                </div>
              </div>
              <button
                onClick={() => handleStartExam('mock')}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Mock Exam</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Past Scorecard History Table */}
        <div className="bg-white rounded-2xl border border-[#E5E3DC] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1F1E1D]">Examination History & Scorecards</h2>
              <p className="text-xs text-[#6B6862]">
                Every test you take is stored persistently in your VidyAI student database.
              </p>
            </div>
            <button
              onClick={loadTestHistory}
              className="text-xs font-semibold text-[#C96442] hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-8 text-center text-xs text-[#949088]">
              Loading past exam attempts...
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#949088] bg-[#FAF9F5] rounded-xl border border-dashed border-[#E5E3DC]">
              No test attempts recorded yet. Launch your first timed exam above!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E3DC] text-[#6B6862] text-[11px] uppercase tracking-wider">
                    <th className="pb-2.5 font-bold">Date</th>
                    <th className="pb-2.5 font-bold">Subject</th>
                    <th className="pb-2.5 font-bold">Topic / Exam</th>
                    <th className="pb-2.5 font-bold">Score</th>
                    <th className="pb-2.5 font-bold">Percentage</th>
                    <th className="pb-2.5 font-bold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E3DC]/60">
                  {history.map(att => {
                    const pct = Math.round((att.score / att.total) * 100);
                    return (
                      <tr key={att.id} className="hover:bg-[#FAF9F5] transition-colors">
                        <td className="py-3 text-[#6B6862] whitespace-nowrap">
                          {new Date(att.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 font-semibold text-[#1F1E1D]">{att.subject}</td>
                        <td className="py-3 text-[#6B6862] max-w-[200px] truncate">{att.topic}</td>
                        <td className="py-3 font-mono font-bold text-[#1F1E1D]">
                          {att.score} / {att.total}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            pct >= 80 ? 'bg-emerald-50 text-emerald-800' : pct >= 50 ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'
                          }`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="py-3 text-[#949088] font-mono">
                          {att.time_taken_seconds ? `${Math.round(att.time_taken_seconds / 60)}m` : '1m'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
