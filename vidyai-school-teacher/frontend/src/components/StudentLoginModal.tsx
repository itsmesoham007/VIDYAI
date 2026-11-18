'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  GraduationCap, 
  User, 
  Check, 
  X, 
  ArrowRight,
  Compass,
  Award,
  Atom,
  BookOpen
} from 'lucide-react';
import { VidyAILogo } from '@/components/VidyAILogo';

interface StudentLoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  initialName?: string;
  initialGrade?: number;
  isMandatory?: boolean;
  onComplete: (studentName: string, selectedGrade: number) => void;
}

interface GradeTier {
  id: string;
  name: string;
  badge: string;
  grades: number[];
  icon: React.ReactNode;
  accentBg: string;
}

const GRADE_TIERS: GradeTier[] = [
  {
    id: 'primary',
    name: 'Primary School',
    badge: 'Standards 1 to 5',
    grades: [1, 2, 3, 4, 5],
    icon: <Sparkles className="w-4 h-4 text-amber-600" />,
    accentBg: 'border-amber-400 bg-amber-50 text-amber-900'
  },
  {
    id: 'middle',
    name: 'Middle School',
    badge: 'Standards 6 to 8',
    grades: [6, 7, 8],
    icon: <Compass className="w-4 h-4 text-emerald-600" />,
    accentBg: 'border-emerald-400 bg-emerald-50 text-emerald-900'
  },
  {
    id: 'secondary',
    name: 'Secondary (SSC Board)',
    badge: 'Standards 9 & 10',
    grades: [9, 10],
    icon: <Award className="w-4 h-4 text-[#C96442]" />,
    accentBg: 'border-[#C96442] bg-[#FBF0EB] text-[#C96442]'
  },
  {
    id: 'higher',
    name: 'Higher Secondary (HSC Board)',
    badge: 'Standards 11 & 12',
    grades: [11, 12],
    icon: <Atom className="w-4 h-4 text-indigo-600" />,
    accentBg: 'border-indigo-400 bg-indigo-50 text-indigo-900'
  }
];

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  isOpen,
  onClose,
  initialName = '',
  initialGrade = 10,
  isMandatory = false,
  onComplete
}) => {
  const [name, setName] = useState<string>(initialName);
  const [selectedGrade, setSelectedGrade] = useState<number>(initialGrade);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (initialName) setName(initialName);
    if (initialGrade) setSelectedGrade(initialGrade);
  }, [initialName, initialGrade, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    // Allow empty name or custom name; strip any stale 'soham' or generic names
    const finalName = (!trimmed || trimmed.toLowerCase() === 'student' || trimmed.toLowerCase().includes('soham') || trimmed.toLowerCase().includes('rajpurohit'))
      ? ''
      : trimmed;

    if (typeof window !== 'undefined') {
      try {
        if (finalName) {
          localStorage.setItem('vidyai_student_name', finalName);
        } else {
          localStorage.removeItem('vidyai_student_name');
        }
        localStorage.setItem('vidyai_standard', selectedGrade.toString());
      } catch (err) {
        console.error(err);
      }
    }

    onComplete(finalName, selectedGrade);
    if (onClose) onClose();
  };

  const handleContinueAsGuest = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('vidyai_student_name');
        localStorage.setItem('vidyai_standard', selectedGrade.toString());
      } catch (err) {
        console.error(err);
      }
    }
    onComplete('', selectedGrade);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-[#FAF9F5] border border-[#E5E3DC] rounded-3xl shadow-2xl overflow-hidden my-auto animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-[#F3F1EC] px-6 py-5 border-b border-[#E5E3DC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VidyAILogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1F1E1D] tracking-tight">VidyAI Classroom Login</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#C96442]/10 text-[#C96442] px-2 py-0.5 rounded-full border border-[#C96442]/20">
                  GSEB English Med
                </span>
              </div>
              <p className="text-xs text-[#6B6862]">
                Official Gujarat Board Curriculum • Standards 1 to 12
              </p>
            </div>
          </div>

          {!isMandatory && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[#E5E3DC] text-[#6B6862] hover:text-[#1F1E1D] transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 1. Student Name Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1F1E1D] uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#C96442]" />
                <span>Student Name <span className="text-[#949088] font-normal lowercase">(optional)</span></span>
              </label>
              {name && (
                <button
                  type="button"
                  onClick={() => {
                    setName('');
                    try { localStorage.removeItem('vidyai_student_name'); } catch {}
                  }}
                  className="text-[11px] font-semibold text-[#6B6862] hover:text-rose-600 transition-colors"
                >
                  Clear Name ✕
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Enter your name (e.g. Ananya, Harsh, or leave blank for 'Student')"
                autoFocus
                className="w-full px-4 py-3 rounded-2xl bg-white border border-[#E5E3DC] focus:border-[#C96442] focus:ring-2 focus:ring-[#C96442]/20 text-[#1F1E1D] placeholder-[#949088] text-sm md:text-base font-medium outline-hidden transition-all shadow-xs pr-16"
              />
            </div>
            {errorMsg ? (
              <p className="text-xs font-semibold text-rose-600 animate-fadeIn">
                ⚠️ {errorMsg}
              </p>
            ) : (
              <p className="text-[11px] text-[#6B6862]">
                Optional: If left blank, VidyAI will address you respectfully as a GSEB Scholar without any hardcoded names.
              </p>
            )}
          </div>

          {/* 2. Standard Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#1F1E1D] uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#C96442]" />
                <span>Select Your Standard (Class 1 to 12)</span>
              </label>
              <span className="text-xs font-bold text-[#C96442] bg-[#C96442]/10 px-2.5 py-0.5 rounded-full">
                Active: Standard {selectedGrade}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {GRADE_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className="p-3.5 rounded-2xl bg-white border border-[#E5E3DC] space-y-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-[#FAF9F5] border border-[#E5E3DC]">
                        {tier.icon}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-[#1F1E1D]">{tier.name}</h4>
                        <p className="text-[10px] text-[#6B6862]">{tier.badge}</p>
                      </div>
                    </div>
                  </div>

                  {/* Grade selection pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tier.grades.map((g) => {
                      const isSelected = selectedGrade === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setSelectedGrade(g)}
                          className={`flex-1 min-w-[50px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-[#C96442] text-white shadow-xs scale-102 ring-2 ring-[#C96442]/30'
                              : 'bg-[#F3F1EC] hover:bg-[#EAE7DF] text-[#1F1E1D] border border-transparent'
                          }`}
                        >
                          <span>Std {g}</span>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Action Submit Button */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#C96442] hover:bg-[#B35536] active:scale-98 text-white font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <span>{name.trim() ? `Start Learning as ${name.trim()}` : `Start Learning in Standard ${selectedGrade}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleContinueAsGuest}
              className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#EAE7DF]/60 transition-colors"
            >
              Continue anonymously without a name
            </button>
            <p className="text-center text-[11px] text-[#949088] pt-1">
              GSEB English Medium Textbook Syllabus • Gujarat State Board of School Textbooks (GSSTB)
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
