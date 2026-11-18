'use client';

import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, XCircle, RotateCcw, X, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import { api, QuizQuestion, QuizResponse } from '@/lib/api';
import { MarkdownWithMath } from '@/lib/renderMarkdown';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: number;
  subject: string;
  topic?: string;
  language?: string;
  studentName?: string;
  onSaveToNotebook?: (title: string, content: string, subject: string) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  grade,
  subject,
  topic = 'High-Yield Board Concepts',
  language = 'en',
  studentName = 'GSEB Student',
  onSaveToNotebook
}) => {
  const studentId = `stu_${(studentName || 'student').toLowerCase().replace(/\s+/g, '_')}`;
  const [currentTopic, setCurrentTopic] = useState<string>(topic || 'Core Curriculum Concepts');
  const [loading, setLoading] = useState<boolean>(false);
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: number }>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [savedToPortal, setSavedToPortal] = useState<boolean>(false);
  const [savedMistakesNote, setSavedMistakesNote] = useState<boolean>(false);

  useEffect(() => {
    if (topic) {
      setCurrentTopic(topic);
    }
  }, [topic, grade, subject]);

  useEffect(() => {
    if (isOpen) {
      handleGenerateQuiz();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerateQuiz = async () => {
    setLoading(true);
    setSubmitted(false);
    setSelectedAnswers({});
    try {
      const data = await api.generateQuiz(grade, subject, currentTopic || 'Core Concepts', 5, language);
      setQuizData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx
    }));
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

  const totalQuestions = quizData?.questions?.length || 0;
  const score = calculateScore();

  const handleSubmitQuiz = async () => {
    setSubmitted(true);
    if (!quizData) return;

    // Collect mistake diagnostic data
    const mistakes: any[] = [];
    quizData.questions.forEach(q => {
      const selected = selectedAnswers[q.id];
      if (selected !== q.correct_index) {
        mistakes.push({
          qId: q.id,
          question: q.question,
          selectedAnswer: q.options[selected] || 'Unanswered',
          correctAnswer: q.options[q.correct_index],
          explanation: q.explanation,
          concept: q.concept
        });
      }
    });

    try {
      await api.recordQuizAttempt({
        student_id: studentId,
        standard: grade,
        subject,
        topic: currentTopic,
        score,
        total: totalQuestions,
        time_taken_seconds: 60,
        mistakes_summary: mistakes
      });
      setSavedToPortal(true);
    } catch (err) {
      console.error('Failed to record quiz attempt:', err);
    }
  };

  const handleSaveMistakesToNotebook = async () => {
    if (!quizData) return;
    const wrongQs = quizData.questions.filter(q => selectedAnswers[q.id] !== q.correct_index);
    if (wrongQs.length === 0) return;

    const noteTitle = `Quiz Diagnostic: ${subject} (${currentTopic})`;
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
        subject,
        chapter_title: currentTopic,
        title: noteTitle,
        content,
        tags: ['Quiz Mistakes', 'Diagnostic', subject]
      });
      setSavedMistakesNote(true);
    } catch (err) {
      console.error('Failed to save mistakes note:', err);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1E1D]/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FAF9F5] rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#E5E3DC] text-[#1F1E1D]">
        
        {/* Header (Claude Warm Palette) */}
        <div className="bg-[#F3F1EC] px-6 py-4 border-b border-[#E5E3DC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C96442] text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1F1E1D]">GSEB Practice Quiz (5 MCQs)</h2>
                <span className="text-[10px] bg-[#C96442]/15 text-[#C96442] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Std {grade} • {subject}
                </span>
              </div>
              <p className="text-xs text-[#6B6862]">
                Topic: {currentTopic} • Strictly GSEB English Medium Curriculum
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl hover:bg-[#EAE7DF] text-[#6B6862] hover:text-[#1F1E1D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Topic Selector / Customizer */}
          <div className="flex items-center gap-2 bg-white p-2.5 rounded-2xl border border-[#E5E3DC] shadow-2xs">
            <label className="text-xs font-bold text-[#6B6862] whitespace-nowrap pl-1">Topic:</label>
            <input
              type="text"
              value={currentTopic}
              onChange={(e) => setCurrentTopic(e.target.value)}
              placeholder="e.g. Electric Charges, Heritage of India, Photosynthesis"
              className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-[#E5E3DC] focus:outline-none focus:border-[#C96442] text-[#1F1E1D] font-medium"
            />
            <button
              onClick={handleGenerateQuiz}
              disabled={loading}
              className="px-3.5 py-1.5 bg-[#C96442] hover:bg-[#B55535] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>New Quiz</span>
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-9 h-9 text-[#C96442] animate-spin mx-auto" />
              <p className="text-sm font-bold text-[#1F1E1D]">Generating GSEB 5-MCQ Quiz...</p>
              <p className="text-xs text-[#6B6862]">Aligning questions with GSEB Class {grade} {subject} syllabus</p>
            </div>
          ) : quizData ? (
            <div className="space-y-5">
              {quizData.questions.map((q, idx) => {
                const selected = selectedAnswers[q.id];
                const isAnswered = selected !== undefined;
                const isCorrect = selected === q.correct_index;

                return (
                  <div 
                    key={q.id} 
                    className="p-5 rounded-2xl border border-[#E5E3DC] bg-white shadow-2xs space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-base font-bold text-[#111110] flex-1 leading-relaxed">
                        <span className="text-[#C96442] mr-2 font-mono font-extrabold">Q{idx + 1}.</span>
                        <MarkdownWithMath content={q.question} />
                      </div>
                      {submitted && (
                        <span>
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                          )}
                        </span>
                      )}
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIdx) => {
                        let btnStyle = "bg-white border-[#E5E3DC] text-[#1F1E1D] hover:bg-[#FAF9F5] hover:border-[#C96442]/60";
                        
                        if (submitted) {
                          if (optIdx === q.correct_index) {
                            btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-300";
                          } else if (selected === optIdx && !isCorrect) {
                            btnStyle = "bg-rose-50 border-rose-400 text-rose-900 font-bold ring-2 ring-rose-200";
                          } else {
                            btnStyle = "bg-[#F7F6F2] border-[#E5E3DC] text-[#949088] opacity-60";
                          }
                        } else if (selected === optIdx) {
                          btnStyle = "bg-[#C96442]/10 border-2 border-[#C96442] text-[#1F1E1D] font-bold shadow-xs";
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={submitted}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between gap-2 ${btnStyle}`}
                          >
                            <div className="flex-1 font-medium">
                              <MarkdownWithMath content={opt} />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#6B6862] bg-[#EAE7DF] px-1.5 py-0.5 rounded ml-2 shrink-0">
                              {['A', 'B', 'C', 'D'][optIdx]}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation after submission */}
                    {submitted && (
                      <div className={`p-3.5 rounded-xl text-xs space-y-1.5 ${
                        isCorrect ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-rose-50 border border-rose-200 text-rose-900'
                      }`}>
                        <div className="font-bold flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-[#C96442]" />
                          <span>Concept Focus: {q.concept}</span>
                        </div>
                        <div className="leading-relaxed">
                          <MarkdownWithMath content={q.explanation} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Submit & Score Section */}
              {!submitted ? (
                <button
                  disabled={Object.keys(selectedAnswers).length === 0}
                  onClick={handleSubmitQuiz}
                  className="w-full py-3 px-4 bg-[#C96442] hover:bg-[#B55535] disabled:opacity-50 text-white rounded-2xl text-sm font-bold shadow-xs transition-all active:scale-98"
                >
                  Submit & Check Answers ({Object.keys(selectedAnswers).length}/{totalQuestions} Answered)
                </button>
              ) : (
                <div className="p-6 rounded-2xl bg-white border border-[#E5E3DC] text-center space-y-3 shadow-xs animate-fadeIn">
                  <div className="text-2xl font-black text-[#1F1E1D]">
                    Your Score: <span className="text-[#C96442]">{score}</span> / {totalQuestions}
                  </div>
                  <p className="text-xs font-semibold text-[#6B6862]">
                    {score === totalQuestions 
                      ? '🌟 Outstanding! Full marks on this GSEB module!' 
                      : score >= 3 
                      ? '👏 Good job! Review the explanations above to perfect your concepts.' 
                      : '💪 Great practice effort! Review the textbook notes and give it another try.'}
                  </p>

                  {savedToPortal && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Saved to your Student Dashboard & Progress Radar!</span>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                    {score < totalQuestions && (
                      <button
                        onClick={handleSaveMistakesToNotebook}
                        disabled={savedMistakesNote}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all disabled:opacity-60"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>{savedMistakesNote ? 'Mistakes Saved to Notebook! 📓' : 'Save Mistakes to Notebook'}</span>
                      </button>
                    )}

                    <button
                      onClick={handleGenerateQuiz}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C96442] hover:bg-[#B55535] text-white text-xs font-bold shadow-xs transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Generate Fresh Questions</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F3F1EC] border-t border-[#E5E3DC] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#EAE7DF] border border-[#E5E3DC] text-xs font-bold text-[#1F1E1D] transition-colors"
          >
            Close Quiz
          </button>
        </div>

      </div>
    </div>
  );
};
