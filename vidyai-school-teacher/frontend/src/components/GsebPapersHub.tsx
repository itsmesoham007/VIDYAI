'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Award, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  Search, 
  BookOpen, 
  Bookmark, 
  Download,
  AlertCircle
} from 'lucide-react';
import { MarkdownWithMath } from '@/lib/renderMarkdown';

interface GsebPapersHubProps {
  grade: number;
  onNavigateToChat: (initialPrompt?: string, targetSubject?: string) => void;
  onSaveToNotebook?: (title: string, content: string, subject: string) => void;
}

interface QuestionItem {
  id: string;
  qNo: number;
  marks: number;
  question: string;
  solutionHint?: string;
  boardTopic?: string;
}

interface PaperSection {
  sectionName: string;
  marksPerQuestion: number;
  totalSectionMarks: number;
  description: string;
  questions: QuestionItem[];
}

interface BoardPaper {
  id: string;
  standard: number;
  subject: string;
  year: number;
  paperType: string;
  totalMarks: number;
  timeHours: number;
  sections: PaperSection[];
}

// Curated GSEB English Medium Past Board Exam Papers & Blueprints
const GSEB_PAPERS_DATABASE: BoardPaper[] = [
  // Std 10 SSC Mathematics (Standard) 2024
  {
    id: 'gseb_ssc_math_2024',
    standard: 10,
    subject: 'Mathematics',
    year: 2024,
    paperType: 'SSC Board Official Annual Examination',
    totalMarks: 80,
    timeHours: 3,
    sections: [
      {
        sectionName: 'Section A (Objective — 16 Marks)',
        marksPerQuestion: 1,
        totalSectionMarks: 16,
        description: 'Objective questions including MCQs, True/False, and one-word answers (1 Mark each).',
        questions: [
          {
            id: 'm24_sA_1',
            qNo: 1,
            marks: 1,
            question: 'State whether the following statement is True or False: "The HCF of two consecutive natural numbers is always 1."',
            solutionHint: 'True. Consecutive natural numbers $n$ and $n+1$ are always co-prime, hence $\\text{HCF}(n, n+1) = 1$.',
            boardTopic: 'Real Numbers (Chapter 1)'
          },
          {
            id: 'm24_sA_2',
            qNo: 2,
            marks: 1,
            question: 'If $\\alpha$ and $\\beta$ are the zeroes of the quadratic polynomial $p(x) = x^2 - 5x + 6$, find the value of $\\alpha + \\beta$.',
            solutionHint: 'For $ax^2 + bx + c$, sum of zeroes $\\alpha + \\beta = -\\frac{b}{a} = -\\frac{-5}{1} = 5$.',
            boardTopic: 'Polynomials (Chapter 2)'
          },
          {
            id: 'm24_sA_3',
            qNo: 3,
            marks: 1,
            question: 'Find the 10th term of the Arithmetic Progression (AP): $2, 7, 12, \\dots$',
            solutionHint: '$a = 2, d = 5$. Formula: $a_{10} = a + 9d = 2 + 9(5) = 47$.',
            boardTopic: 'Arithmetic Progressions (Chapter 5)'
          },
          {
            id: 'm24_sA_4',
            qNo: 4,
            marks: 1,
            question: 'What is the value of $\\sin^2 30^\\circ + \\cos^2 30^\\circ$?',
            solutionHint: 'By fundamental trigonometric identity $\\sin^2\\theta + \\cos^2\\theta = 1$, value is $1$.',
            boardTopic: 'Introduction to Trigonometry (Chapter 8)'
          }
        ]
      },
      {
        sectionName: 'Section B (Short Answer — 20 Marks)',
        marksPerQuestion: 2,
        totalSectionMarks: 20,
        description: 'Short answer conceptual problems and calculations (2 Marks each).',
        questions: [
          {
            id: 'm24_sB_1',
            qNo: 17,
            marks: 2,
            question: 'Prove by contradiction that $\\sqrt{5}$ is an irrational number.',
            solutionHint: 'Assume $\\sqrt{5} = \\frac{a}{b}$ where $a, b$ are co-prime integers. Square both sides to show 5 divides both $a$ and $b$, contradicting co-primality.',
            boardTopic: 'Real Numbers (Chapter 1)'
          },
          {
            id: 'm24_sB_2',
            qNo: 18,
            marks: 2,
            question: 'Find the roots of the quadratic equation $2x^2 - 7x + 3 = 0$ by factorization.',
            solutionHint: '$2x^2 - 6x - x + 3 = 0 \\implies (2x - 1)(x - 3) = 0 \\implies x = 3, x = \\frac{1}{2}$.',
            boardTopic: 'Quadratic Equations (Chapter 4)'
          }
        ]
      },
      {
        sectionName: 'Section C (Analytical & Applications — 24 Marks)',
        marksPerQuestion: 3,
        totalSectionMarks: 24,
        description: 'Step-by-step derivations and word problems (3 Marks each).',
        questions: [
          {
            id: 'm24_sC_1',
            qNo: 27,
            marks: 3,
            question: 'Solve the following pair of linear equations by elimination method:\n$$3x + 4y = 10, \\quad 2x - 2y = 2$$',
            solutionHint: 'Multiply second equation by 2: $4x - 4y = 4$. Add to first: $7x = 14 \\implies x = 2$. Then $y = 1$.',
            boardTopic: 'Pair of Linear Equations (Chapter 3)'
          }
        ]
      },
      {
        sectionName: 'Section D (Long Theorems & Proofs — 20 Marks)',
        marksPerQuestion: 4,
        totalSectionMarks: 20,
        description: 'Major GSEB Board 4-Mark Theorems (Thales BPT Theorem, Pythagoras) and statistical distributions.',
        questions: [
          {
            id: 'm24_sD_1',
            qNo: 35,
            marks: 4,
            question: 'State and prove the Basic Proportionality Theorem (Thales Theorem) with a neat geometric figure.',
            solutionHint: 'Statement: If a line is drawn parallel to one side of a triangle intersecting other two sides, it divides them in the same ratio. Construct perpendiculars and compute ratio of areas of triangles.',
            boardTopic: 'Triangles (Chapter 6 — High-Yield 4-Mark Theorem)'
          }
        ]
      }
    ]
  },

  // Std 10 SSC Science 2024
  {
    id: 'gseb_ssc_science_2024',
    standard: 10,
    subject: 'Science',
    year: 2024,
    paperType: 'SSC Board Official Annual Examination',
    totalMarks: 80,
    timeHours: 3,
    sections: [
      {
        sectionName: 'Section A (Objective — 16 Marks)',
        marksPerQuestion: 1,
        totalSectionMarks: 16,
        description: '1-Mark questions on chemical formulas, units, and definitions.',
        questions: [
          {
            id: 'sci24_sA_1',
            qNo: 1,
            marks: 1,
            question: 'What is the chemical formula of Plaster of Paris?',
            solutionHint: '$\\text{CaSO}_4 \\cdot \\frac{1}{2}\\text{H}_2\\text{O}$ (Calcium Sulphate Hemihydrate).',
            boardTopic: 'Acids, Bases and Salts (Chapter 2)'
          },
          {
            id: 'sci24_sA_2',
            qNo: 2,
            marks: 1,
            question: 'State Ohm\'s Law and write its mathematical formula.',
            solutionHint: '$V = IR$, where current is directly proportional to potential difference at constant temperature.',
            boardTopic: 'Electricity (Chapter 12)'
          }
        ]
      },
      {
        sectionName: 'Section D (Long Explanations & Diagrams — 20 Marks)',
        marksPerQuestion: 4,
        totalSectionMarks: 20,
        description: '4-Mark diagrams and physiological/electromagnetic systems.',
        questions: [
          {
            id: 'sci24_sD_1',
            qNo: 36,
            marks: 4,
            question: 'Explain the construction and working of an Electric Motor with a neat labeled diagram and Fleming\'s Left-Hand Rule.',
            solutionHint: 'Converts electrical energy to mechanical energy. Commutator reverses current direction every half-rotation.',
            boardTopic: 'Magnetic Effects of Electric Current (Chapter 13)'
          }
        ]
      }
    ]
  },

  // Std 12 HSC Physics 2024
  {
    id: 'gseb_hsc_physics_2024',
    standard: 12,
    subject: 'Physics',
    year: 2024,
    paperType: 'HSC Board Science Annual Examination',
    totalMarks: 100,
    timeHours: 3,
    sections: [
      {
        sectionName: 'Part A (50 MCQs — 50 Marks)',
        marksPerQuestion: 1,
        totalSectionMarks: 50,
        description: '50 Multiple Choice Questions (MCQs) for OMR evaluation covering all chapters.',
        questions: [
          {
            id: 'phy24_pA_1',
            qNo: 1,
            marks: 1,
            question: 'The SI unit of electric flux $\\Phi$ is:\n(A) $\\text{N/C}$  (B) $\\text{N m}^2/\\text{C}$  (C) $\\text{V/m}$  (D) $\\text{J/C}$',
            solutionHint: 'Correct Answer: (B) $\\text{N m}^2/\\text{C}$ or $\\text{V m}$.',
            boardTopic: 'Electric Charges and Fields (Chapter 1)'
          }
        ]
      },
      {
        sectionName: 'Part B: Section C (4-Mark Derivations — 16 Marks)',
        marksPerQuestion: 4,
        totalSectionMarks: 16,
        description: 'Rigorous mathematical derivations and applications of electrodynamics.',
        questions: [
          {
            id: 'phy24_pB_1',
            qNo: 21,
            marks: 4,
            question: 'State Gauss\'s Law in electrostatics. Using it, derive an expression for the electric field due to an infinitely long straight uniformly charged wire.',
            solutionHint: 'Gaussian cylinder of radius $r$ and length $L$. $\\Phi = E(2\\pi r L) = \\frac{\\lambda L}{\\varepsilon_0} \\implies E = \\frac{\\lambda}{2\\pi \\varepsilon_0 r}$.',
            boardTopic: 'Electric Charges and Fields (Chapter 1)'
          }
        ]
      }
    ]
  }
];

export const GsebPapersHub: React.FC<GsebPapersHubProps> = ({
  grade,
  onNavigateToChat,
  onSaveToNotebook
}) => {
  const [selectedPaperId, setSelectedPaperId] = useState<string>(
    grade === 12 ? 'gseb_hsc_physics_2024' : 'gseb_ssc_math_2024'
  );
  const [selectedSectionIdx, setSelectedSectionIdx] = useState<number>(0);
  const [revealedSolutions, setRevealedSolutions] = useState<{ [qId: string]: boolean }>({});
  const [copiedQId, setCopiedQId] = useState<string | null>(null);

  // Filter papers for standard
  const availablePapers = GSEB_PAPERS_DATABASE.filter(p => p.standard === (grade >= 11 ? 12 : 10));
  const activePaper = availablePapers.find(p => p.id === selectedPaperId) || availablePapers[0] || GSEB_PAPERS_DATABASE[0];
  const activeSection = activePaper.sections[selectedSectionIdx] || activePaper.sections[0];

  const toggleSolution = (qId: string) => {
    setRevealedSolutions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleSolveWithVidyAI = (q: QuestionItem) => {
    const prompt = `I am practicing GSEB Standard ${activePaper.standard} ${activePaper.subject} Past Board Paper (${activePaper.year}).

Please provide the official GSEB Board marking scheme and step-by-step solution for this Question:
"${q.question}"

Include:
1. Section ${q.marks}-Mark Model Solution
2. KaTeX LaTeX formulas
3. GSEB Examiner rubric points`;
    onNavigateToChat(prompt, activePaper.subject);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAF9F5] text-[#1F1E1D] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* 1. Header Banner */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E3DC] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>GSEB Board Examination Hub • English Medium</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1F1E1D]">
              Official Past Board Papers & Blueprints 📜
            </h1>
            <p className="text-xs text-[#6B6862] mt-1">
              Class 10 SSC & Class 12 HSC Gujarat Board papers with Section A, B, C, D marking criteria and AI solutions.
            </p>
          </div>

          {/* Paper Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6B6862]">Select Exam Paper:</span>
            <select
              value={activePaper.id}
              onChange={(e) => {
                setSelectedPaperId(e.target.value);
                setSelectedSectionIdx(0);
              }}
              className="px-3 py-1.5 text-xs font-bold bg-[#FAF9F5] text-[#1F1E1D] rounded-xl border border-[#E5E3DC] focus:outline-none focus:border-[#C96442]"
            >
              {availablePapers.map(p => (
                <option key={p.id} value={p.id}>
                  Std {p.standard} {p.subject} ({p.year} Board Exam)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Paper Metadata Bar */}
        <div className="bg-white rounded-xl p-4 border border-[#E5E3DC] shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-[#1F1E1D] font-bold">
              <FileText className="w-4 h-4 text-[#C96442]" />
              <span>{activePaper.paperType}</span>
            </div>
            <div className="flex items-center gap-1 text-[#6B6862]">
              <Calendar className="w-3.5 h-3.5 text-[#949088]" />
              <span>Year {activePaper.year}</span>
            </div>
            <div className="flex items-center gap-1 text-[#6B6862]">
              <Clock className="w-3.5 h-3.5 text-[#949088]" />
              <span>Time: {activePaper.timeHours} Hours</span>
            </div>
            <div className="flex items-center gap-1 text-[#6B6862]">
              <Award className="w-3.5 h-3.5 text-[#949088]" />
              <span>Max Marks: {activePaper.totalMarks}</span>
            </div>
          </div>

          <div className="text-[11px] font-bold text-[#C96442] bg-[#FBF0EB] px-2.5 py-1 rounded-lg border border-[#C96442]/20">
            Strict GSEB English Medium Format
          </div>
        </div>

        {/* 3. Section Tabs Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {activePaper.sections.map((sec, idx) => (
            <button
              key={sec.sectionName}
              onClick={() => setSelectedSectionIdx(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedSectionIdx === idx
                  ? 'bg-[#C96442] text-white shadow-xs'
                  : 'bg-white text-[#6B6862] border border-[#E5E3DC] hover:bg-[#FAF9F5]'
              }`}
            >
              <span>{sec.sectionName}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedSectionIdx === idx ? 'bg-white/20 text-white' : 'bg-[#F5F3EC] text-[#6B6862]'
              }`}>
                {sec.totalSectionMarks}M
              </span>
            </button>
          ))}
        </div>

        {/* 4. Section Questions List */}
        <div className="bg-white rounded-2xl border border-[#E5E3DC] p-6 shadow-xs space-y-4">
          <div className="border-b border-[#E5E3DC] pb-3">
            <h2 className="text-base font-bold text-[#1F1E1D]">{activeSection.sectionName}</h2>
            <p className="text-xs text-[#6B6862] mt-0.5">{activeSection.description}</p>
          </div>

          <div className="space-y-4 pt-1">
            {activeSection.questions.map((q) => {
              const isSolutionOpen = revealedSolutions[q.id] ?? false;

              return (
                <div 
                  key={q.id}
                  className="p-4 rounded-xl border border-[#E5E3DC] bg-[#FAF9F5] hover:bg-white hover:border-[#C96442]/40 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[#1F1E1D] text-white text-xs font-bold flex items-center justify-center">
                        Q{q.qNo}
                      </span>
                      {q.boardTopic && (
                        <span className="text-[10px] font-semibold text-[#8C827A] bg-[#F5F3EC] px-2 py-0.5 rounded-md border border-[#E5E3DC]">
                          {q.boardTopic}
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-bold text-[#C96442] bg-[#FBF0EB] px-2.5 py-0.5 rounded-full border border-[#C96442]/20">
                      {q.marks} Mark{q.marks > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Question Text with KaTeX */}
                  <div className="text-xs text-[#1F1E1D] font-medium leading-relaxed pl-1">
                    <MarkdownWithMath content={q.question} />
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-[#E5E3DC]/70 flex items-center justify-between text-xs">
                    <button
                      onClick={() => toggleSolution(q.id)}
                      className="text-xs font-semibold text-[#6B6862] hover:text-[#1F1E1D] flex items-center gap-1 transition-colors"
                    >
                      <span>{isSolutionOpen ? 'Hide Answer Key' : 'Reveal Model Answer'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSolutionOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <button
                      onClick={() => handleSolveWithVidyAI(q)}
                      className="px-3 py-1 rounded-lg bg-[#C96442] hover:bg-[#B85536] text-white font-bold text-[11px] shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Solve with VidyAI</span>
                    </button>
                  </div>

                  {/* Revealed Solution Card */}
                  {isSolutionOpen && (
                    <div className="mt-2 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1.5 text-emerald-950 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Official GSEB Model Answer & Marking Scheme:</span>
                      </div>
                      <div className="pl-5 text-emerald-900 leading-relaxed font-sans">
                        <MarkdownWithMath content={q.solutionHint || 'Full step-by-step solution available via VidyAI.'} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Board Exam Blueprint Advisory */}
        <div className="bg-[#FAF9F5] rounded-2xl border border-[#E5E3DC] p-5 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
            📋
          </div>
          <div className="space-y-1 text-xs text-[#6B6862]">
            <h4 className="font-bold text-[#1F1E1D] text-xs">GSEB SSC/HSC Examination Strategy:</h4>
            <p>
              Board examiners allocate step marks for every formula, neat geometrical figure, and balanced chemical equation. 
              Always state the theorem name (e.g. <em>Thales BPT Theorem</em> or <em>Gauss&apos;s Law</em>) at the start of your derivation.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
