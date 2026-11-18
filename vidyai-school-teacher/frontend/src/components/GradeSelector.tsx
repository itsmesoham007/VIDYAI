'use client';

import React from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Globe, 
  Sparkles, 
  Camera, 
  Lightbulb, 
  Award,
  PenTool
} from 'lucide-react';

interface GradeSelectorProps {
  grade: number;
  onGradeChange: (grade: number) => void;
  subject: string;
  onSubjectChange: (subject: string) => void;
  availableSubjects: string[];
  language: string;
  onLanguageChange: (lang: string) => void;
  socraticMode: boolean;
  onToggleSocratic: () => void;
  onOpenQuiz: () => void;
  onOpenDoubtUpload: () => void;
  onOpenHintBar: () => void;
  onOpenWhiteboard?: () => void;
  onOpenFlashcards?: () => void;
}

export const GradeSelector: React.FC<GradeSelectorProps> = ({
  grade,
  onGradeChange,
  subject,
  onSubjectChange,
  availableSubjects,
  language,
  onLanguageChange,
  socraticMode,
  onToggleSocratic,
  onOpenQuiz,
  onOpenDoubtUpload,
  onOpenHintBar,
  onOpenWhiteboard,
  onOpenFlashcards
}) => {
  const isPrimary = grade <= 5;
  const isSenior = grade >= 9;

  return (
    <header className={`sticky top-0 z-30 transition-colors duration-200 border-b ${
      isPrimary 
        ? 'bg-gradient-to-r from-amber-50 via-rose-50 to-sky-50 border-amber-200 shadow-sm' 
        : 'bg-slate-900 border-slate-800 shadow-sm'
    }`}>
      <div className="w-full px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand & Grade Tier Indicator */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${
            isPrimary ? 'bg-amber-400 text-white' : 'bg-blue-600 text-white'
          }`}>
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`font-black text-base tracking-tight ${isPrimary ? 'text-slate-800' : 'text-white'}`}>
                VidyAI
              </h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isPrimary 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                  : isSenior 
                  ? 'bg-blue-950 text-blue-300 border border-blue-800' 
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {isPrimary ? 'GSEB Primary (Std 1-5)' : isSenior ? 'GSEB HSC/Board (Std 9-12)' : 'GSEB Middle (Std 6-8)'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">English Medium Only</p>
          </div>
        </div>

        {/* Central Selectors: Class, Subject, Language, Socratic */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Class Dropdown */}
          <div className={`flex items-center rounded-lg px-2 py-1 border text-xs ${
            isPrimary ? 'bg-white border-amber-200 text-slate-700' : 'bg-slate-950 border-slate-700 text-slate-300'
          }`}>
            <span className="font-semibold mr-1">Class:</span>
            <select
              value={grade}
              onChange={(e) => onGradeChange(Number(e.target.value))}
              aria-label="Select Grade / Class"
              className={`bg-transparent text-xs font-bold focus:outline-none cursor-pointer ${
                isPrimary ? 'text-slate-800' : 'text-blue-400'
              }`}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                <option key={g} value={g} className="text-slate-900 bg-white">
                  Class {g} {g <= 5 ? '🐣' : g <= 8 ? '🌱' : '🎓'}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Dropdown */}
          <div className={`flex items-center rounded-lg px-2 py-1 border text-xs ${
            isPrimary ? 'bg-white border-amber-200 text-slate-700' : 'bg-slate-950 border-slate-700 text-slate-300'
          }`}>
            <BookOpen className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <select
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              aria-label="Select Subject"
              className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer ${
                isPrimary ? 'text-slate-800' : 'text-slate-200'
              }`}
            >
              {availableSubjects.map((s) => (
                <option key={s} value={s} className="text-slate-900 bg-white">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Language Dropdown */}
          <div className={`flex items-center rounded-lg px-2 py-1 border text-xs ${
            isPrimary ? 'bg-white border-amber-200 text-slate-700' : 'bg-slate-950 border-slate-700 text-slate-300'
          }`}>
            <Globe className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              aria-label="Select Language"
              className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer ${
                isPrimary ? 'text-slate-800' : 'text-slate-200'
              }`}
            >
              <option value="en" className="text-slate-900 bg-white">English</option>
              <option value="hinglish" className="text-slate-900 bg-white">Hinglish</option>
              <option value="hi" className="text-slate-900 bg-white">हिंदी</option>
              <option value="gu" className="text-slate-900 bg-white">ગુજરાતી</option>
            </select>
          </div>

          {/* Socratic Mode Toggle */}
          <button
            onClick={onToggleSocratic}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shadow-sm ${
              socraticMode
                ? 'bg-purple-600 text-white hover:bg-purple-700 ring-1 ring-purple-400'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Socratic: {socraticMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Action Tool Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onOpenWhiteboard && (
            <button
              onClick={onOpenWhiteboard}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
              title="Open Interactive Drawing Whiteboard"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Whiteboard</span>
            </button>
          )}

          {onOpenFlashcards && (
            <button
              onClick={onOpenFlashcards}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
              title="Open Revision Flashcards"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Flashcards</span>
            </button>
          )}

          <button
            onClick={onOpenHintBar}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
            title="Open 3-Stage Homework Helper"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="hidden md:inline">3-Stage Hints</span>
          </button>

          <button
            onClick={onOpenDoubtUpload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
            title="Scan Handwritten Notebook Doubt"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Photo Doubt</span>
          </button>

          <button
            onClick={onOpenQuiz}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
            title="Take 5-Question Topic Quiz"
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden md:inline">5-MCQ Quiz</span>
          </button>
        </div>
      </div>
    </header>
  );
};
