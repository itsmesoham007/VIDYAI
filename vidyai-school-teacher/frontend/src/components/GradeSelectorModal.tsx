'use client';

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  X, 
  Check, 
  BookOpen, 
  Compass, 
  Award, 
  Atom,
  ArrowRight,
  User
} from 'lucide-react';
import { VidyAILogo } from '@/components/VidyAILogo';

interface GradeSelectorModalProps {
  isOpen: boolean;
  onClose?: () => void;
  currentGrade: number;
  currentName?: string;
  onSelectGrade: (grade: number, name?: string) => void;
  isMandatoryOnboarding?: boolean;
}

interface GradeTier {
  id: string;
  name: string;
  badge: string;
  description: string;
  grades: number[];
  subjects: string;
  icon: React.ReactNode;
  accentBg: string;
}

const GRADE_TIERS: GradeTier[] = [
  {
    id: 'primary',
    name: 'Primary School',
    badge: 'Standard 1 to 5',
    description: 'Joyful, foundational learning with warm analogies, vocabulary, numbers & EVS.',
    grades: [1, 2, 3, 4, 5],
    subjects: 'English (First Language), Mathematics, Environmental Studies (Std 3–5)',
    icon: <Sparkles className="w-5 h-5 text-amber-600" />,
    accentBg: 'bg-amber-500/10 border-amber-500/20 text-amber-800'
  },
  {
    id: 'middle',
    name: 'Middle School',
    badge: 'Standard 6 to 8',
    description: 'Clear step-by-step inquiry with GSEB/NCERT definitions in Science & Social Science.',
    grades: [6, 7, 8],
    subjects: 'English, Mathematics, Science, Social Science',
    icon: <Compass className="w-5 h-5 text-emerald-600" />,
    accentBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800'
  },
  {
    id: 'secondary',
    name: 'Secondary (SSC Board)',
    badge: 'Standard 9 & 10',
    description: 'Rigorous GSEB SSC Board preparation, theorems, formulas, and model examination Q&A.',
    grades: [9, 10],
    subjects: 'English, Mathematics, Science, Social Science, Computer Studies',
    icon: <Award className="w-5 h-5 text-[#C96442]" />,
    accentBg: 'bg-[#C96442]/10 border-[#C96442]/20 text-[#C96442]'
  },
  {
    id: 'higher',
    name: 'Higher Secondary (HSC Board)',
    badge: 'Standard 11 & 12',
    description: 'In-depth derivations, numericals, board syllabus & competitive science foundation.',
    grades: [11, 12],
    subjects: 'Physics, Chemistry, Biology, Mathematics, English, Computer Studies',
    icon: <Atom className="w-5 h-5 text-indigo-600" />,
    accentBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-800'
  }
];

export const GradeSelectorModal: React.FC<GradeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentGrade,
  currentName = '',
  onSelectGrade,
  isMandatoryOnboarding = false
}) => {
  const [studentName, setStudentName] = useState<string>(currentName);

  useEffect(() => {
    if (isOpen) {
      setStudentName(currentName || '');
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSelect = (grade: number) => {
    const trimmed = studentName.trim();
    const finalName = (!trimmed || trimmed.toLowerCase() === 'student' || trimmed.toLowerCase().includes('soham') || trimmed.toLowerCase().includes('rajpurohit'))
      ? ''
      : trimmed;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vidyai_standard', grade.toString());
        if (finalName) {
          localStorage.setItem('vidyai_student_name', finalName);
        } else {
          localStorage.removeItem('vidyai_student_name');
        }
      } catch (e) {
        console.error(e);
      }
    }
    onSelectGrade(grade, finalName);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1E1D]/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FAF9F5] border border-[#E5E3DC] rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-[#1F1E1D]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#F3F1EC] border-b border-[#E5E3DC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VidyAILogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-[#1F1E1D]">
                  Select Your Standard (Class 1 to 12)
                </h2>
                <span className="text-[10px] bg-[#C96442]/15 text-[#C96442] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  GSEB English Medium
                </span>
              </div>
              <p className="text-xs text-[#6B6862]">
                VidyAI personalizes explanations, textbooks & exam questions specifically for your Standard.
              </p>
            </div>
          </div>

          {!isMandatoryOnboarding && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF] transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Optional Student Name Bar */}
        <div className="px-6 py-3 bg-[#FAF9F5] border-b border-[#E5E3DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-sm">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B6862] flex items-center gap-1">
                <User className="w-3 h-3 text-[#C96442]" />
                <span>Student Name (Optional)</span>
              </label>
              {studentName && (
                <button
                  type="button"
                  onClick={() => {
                    setStudentName('');
                    try { localStorage.removeItem('vidyai_student_name'); } catch {}
                  }}
                  className="text-[10px] text-rose-600 hover:underline font-semibold"
                >
                  Clear Name ✕
                </button>
              )}
            </div>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Ananya, Harsh, or leave blank for 'Student'"
              className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#E5E3DC] focus:border-[#C96442] text-xs text-[#1F1E1D] placeholder-[#949088] outline-hidden shadow-2xs"
            />
          </div>
          <p className="text-[11px] text-[#949088] sm:max-w-xs leading-tight">
            Personalizes classroom greetings. If left blank, VidyAI will address you warmly as a GSEB Scholar.
          </p>
        </div>

        {/* Tiers & Standards Selection Grid */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {GRADE_TIERS.map(tier => {
            const hasCurrentGrade = tier.grades.includes(currentGrade);

            return (
              <div
                key={tier.id}
                className={`p-4 rounded-2xl border transition-all ${
                  hasCurrentGrade 
                    ? 'bg-white border-[#C96442]/50 shadow-sm ring-1 ring-[#C96442]/30' 
                    : 'bg-[#FBFBFA] border-[#E5E3DC] hover:border-[#D5D2C9]'
                }`}
              >
                {/* Tier Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-white border border-[#E5E3DC] shadow-xs">
                      {tier.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1F1E1D]">{tier.name}</h3>
                      <p className="text-[11px] text-[#6B6862]">{tier.description}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.accentBg}`}>
                    {tier.badge}
                  </span>
                </div>

                {/* Subjects Overview */}
                <p className="text-[11px] text-[#949088] mb-3 pl-8">
                  <strong className="text-[#6B6862]">Core Subjects:</strong> {tier.subjects}
                </p>

                {/* Grade Buttons */}
                <div className="flex flex-wrap items-center gap-2 pl-8">
                  {tier.grades.map(gradeNum => {
                    const isSelected = gradeNum === currentGrade;

                    return (
                      <button
                        key={gradeNum}
                        onClick={() => handleSelect(gradeNum)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#C96442] text-white shadow-md shadow-[#C96442]/20 scale-105'
                            : 'bg-white hover:bg-[#F3F1EC] text-[#1F1E1D] border border-[#E5E3DC] hover:border-[#C96442]/40 shadow-xs'
                        }`}
                      >
                        <span>Standard {gradeNum}</span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowRight className="w-3 h-3 text-[#949088]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F3F1EC] border-t border-[#E5E3DC] flex items-center justify-between text-xs text-[#6B6862]">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#C96442]" />
            <span>Strictly English Medium • Gujarat State Board of School Textbooks (GSSTB)</span>
          </div>
          {currentGrade && (
            <span className="font-semibold text-[#1F1E1D]">
              Active: <strong className="text-[#C96442]">Standard {currentGrade}</strong>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
