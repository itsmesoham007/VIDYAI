'use client';

import React, { useState } from 'react';
import { Lightbulb, ChevronRight, CheckCircle2, Lock, Sparkles, X, ArrowRight, Loader2 } from 'lucide-react';
import { api, SocraticHintResponse } from '@/lib/api';
import { MarkdownWithMath } from '@/lib/renderMarkdown';

interface SocraticHintBarProps {
  isOpen: boolean;
  onClose: () => void;
  grade: number;
  subject: string;
  language?: string;
  initialProblem?: string;
}

export const SocraticHintBar: React.FC<SocraticHintBarProps> = ({
  isOpen,
  onClose,
  grade,
  subject,
  language = 'en',
  initialProblem = ''
}) => {
  const [problemText, setProblemText] = useState(initialProblem || '');
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [unlockedStages, setUnlockedStages] = useState<{ [key: number]: SocraticHintResponse }>({});
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFetchStage = async (stageToFetch: number) => {
    if (!problemText.trim()) return;
    setLoading(true);
    try {
      const result = await api.getSocraticHint(problemText, grade, subject, stageToFetch, language);
      setUnlockedStages(prev => ({ ...prev, [stageToFetch]: result }));
      setCurrentStage(stageToFetch);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stagesMeta = [
    { num: 1, title: 'Concept & Intuition', icon: '💡', desc: 'Core scientific principle & guiding question' },
    { num: 2, title: 'Formula & Key Step', icon: '📐', desc: 'Governing equation & intermediate milestone' },
    { num: 3, title: 'Full Solution', icon: '📝', desc: 'Complete worked-out solution & verification' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-4 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">3-Stage Socratic Homework Helper</h2>
              <p className="text-xs text-amber-100">Step-by-step guidance without spoiling the solution immediately</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Question / Problem Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Enter Homework Question / Problem:
            </label>
            <div className="relative">
              <textarea
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder="e.g. A ball is dropped from a height of 20m. Find the velocity when it touches the ground (take g = 10 m/s²)..."
                rows={3}
                className="w-full text-sm rounded-2xl border border-slate-300 p-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-800 placeholder-slate-400 bg-slate-50/50"
              />
            </div>
            {!unlockedStages[1] && (
              <button
                disabled={!problemText.trim() || loading}
                onClick={() => handleFetchStage(1)}
                className="mt-2.5 w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-98"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Begin Socratic Guidance (Stage 1)</span>
              </button>
            )}
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {stagesMeta.map((s) => {
              const isUnlocked = !!unlockedStages[s.num];
              const isCurrent = currentStage === s.num;
              return (
                <div 
                  key={s.num}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    isUnlocked
                      ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                      : isCurrent
                      ? 'bg-slate-100 border-slate-300 text-slate-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="text-base">{s.icon}</span>
                    <span className="text-xs font-bold">Stage {s.num}</span>
                    {isUnlocked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 inline" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400 inline" />
                    )}
                  </div>
                  <div className="text-[11px] font-medium leading-tight truncate">{s.title}</div>
                </div>
              );
            })}
          </div>

          {/* Unlocked Hint Stages Cards */}
          <div className="space-y-4 pt-1">
            {stagesMeta.map((s) => {
              const stageData = unlockedStages[s.num];
              if (!stageData) return null;

              return (
                <div 
                  key={s.num} 
                  className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm animate-fadeIn"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200/60 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <span>{s.icon}</span>
                      <span>Stage {s.num}: {s.title}</span>
                    </span>
                    <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded-full text-amber-800">
                      Unlocked
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                    <MarkdownWithMath content={stageData.hint_content} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unlock Next Stage Button */}
          {unlockedStages[currentStage] && currentStage < 3 && (
            <div className="pt-2">
              <button
                disabled={loading}
                onClick={() => handleFetchStage(currentStage + 1)}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white rounded-2xl text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Unlock Next Stage: {stagesMeta[currentStage].title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-slate-400 mt-1.5">
                💡 Try thinking through the current clue before unlocking the next stage!
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Class {grade} {subject} Socratic Engine</span>
          <button
            onClick={() => {
              setUnlockedStages({});
              setCurrentStage(1);
            }}
            className="text-amber-600 hover:underline font-semibold"
          >
            Reset Clues
          </button>
        </div>

      </div>
    </div>
  );
};
