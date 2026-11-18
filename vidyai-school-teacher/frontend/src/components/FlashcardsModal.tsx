'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  CheckCircle2, 
  Sparkles,
  BookOpen,
  HelpCircle,
  GraduationCap,
  Loader2
} from 'lucide-react';
import { api, FlashcardItem } from '@/lib/api';
import { MarkdownWithMath } from '@/lib/renderMarkdown';

interface FlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: number;
  subject: string;
}

export const FlashcardsModal: React.FC<FlashcardsModalProps> = ({
  isOpen,
  onClose,
  grade,
  subject
}) => {
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Load flashcards from backend API or fallback
  useEffect(() => {
    if (isOpen) {
      loadFlashcards();
    }
  }, [isOpen, grade, subject]);

  const loadFlashcards = async () => {
    setLoading(true);
    setIsFlipped(false);
    setCurrentIndex(0);
    try {
      const res = await api.getFlashcards(grade, subject);
      if (res && res.flashcards && res.flashcards.length > 0) {
        setCards(res.flashcards);
      } else {
        setCards(getDefaultCards(grade, subject));
      }
    } catch {
      setCards(getDefaultCards(grade, subject));
    } finally {
      setLoading(false);
    }
  };

  const getDefaultCards = (g: number, s: string): FlashcardItem[] => {
    if (g <= 5) {
      return [
        {
          id: 1,
          category: `GSEB Std ${g} ${s}`,
          question: "What are Tens and Ones in the number 47?",
          answer: "In 47, we have 4 Tens (40) and 7 Ones (7). 40 + 7 = 47! 🍎",
          board_tip: "Vidya Didi Tip: Grouping by 10s makes large numbers easy to count!"
        },
        {
          id: 2,
          category: "Shapes & Geometry",
          question: "How many sides and corners does a Triangle have?",
          answer: "A triangle has 3 straight sides and 3 sharp corners (vertices)! 🔺",
          board_tip: "Remember: 'Tri' means Three!"
        },
        {
          id: 3,
          category: "EVS & Nature",
          question: "What 3 things do green plants need to grow healthy?",
          answer: "Plants need: 1. Sunlight ☀️ 2. Clean Water 💧 3. Good Soil and Air 🌱",
          board_tip: "Vidya Didi Tip: Plants make their own food using green leaves!"
        },
        {
          id: 4,
          category: "Math Addition",
          question: "If you have 8 mangoes and friend gives 6 more, how many in total?",
          answer: "8 + 6 = 14 delicious mangoes! 🥭 (8 + 2 = 10, plus 4 = 14)",
          board_tip: "Tip: Make a ten first, then add the rest!"
        }
      ];
    } else if (g <= 8) {
      return [
        {
          id: 11,
          category: `GSEB Std ${g} Social Science`,
          question: "Who was Shah Jahan, and what was his royal title in architecture?",
          answer: "Shah Jahan was the fifth Mughal Emperor of India (reigned 1628–1658 CE), son of Jahangir. Known as the 'Prince of Builders' and 'Architect King', he built the Taj Mahal in Agra, the Red Fort in Delhi, and the Jama Masjid.",
          board_tip: "GSEB Key Fact: Built using pure white Makrana marble and exquisite Pietra Dura inlay."
        },
        {
          id: 12,
          category: `GSEB Std ${g} Science: Heat`,
          question: "What is the difference between Conduction and Convection?",
          answer: "Conduction transfers heat through direct particle collision in solids without actual movement of matter. Convection transfers heat through bulk movement of heated fluid (liquids and gases).",
          board_tip: "GSEB Note: Convection causes sea breeze during the day and land breeze at night."
        },
        {
          id: 13,
          category: `GSEB Std ${g} Math: Algebra`,
          question: "State the algebraic identity for $(a + b)^2$",
          answer: "$$(a + b)^2 = a^2 + 2ab + b^2$$",
          board_tip: "Verify by multiplying: $(a+b)(a+b) = a^2 + ab + ba + b^2$."
        },
        {
          id: 14,
          category: `GSEB Std ${g} Science: Acids & Bases`,
          question: "What color does Litmus paper turn in Acidic vs Basic solutions?",
          answer: "Acids turn Blue litmus to RED. Bases turn Red litmus to BLUE.",
          board_tip: "Mnemonic: 'BRB' = Base turns Red to Blue!"
        }
      ];
    } else {
      return [
        {
          id: 21,
          category: `GSEB Std ${g} Physics: Electrostatics`,
          question: "State Gauss's Law and its mathematical expression in electrostatics.",
          answer: "The total electric flux through any closed Gaussian surface equals $\\frac{1}{\\varepsilon_0}$ times the net charge enclosed:\n$$\\Phi = \\oint \\vec{E} \\cdot d\\vec{A} = \\frac{Q_{\\text{enc}}}{\\varepsilon_0}$$",
          board_tip: "GSEB HSC Board 3-Mark Question: Commonly asked with field derivation for infinite line charge."
        },
        {
          id: 22,
          category: `GSEB Std ${g} Physics: Current Electricity`,
          question: "What is Drift Velocity ($v_d$) and how is it related to electric current ($I$)?",
          answer: "Drift velocity is the average velocity acquired by electrons opposite to the applied electric field:\n$$v_d = \\frac{e E \\tau}{m}$$\nRelation with current: $$I = n e A v_d$$",
          board_tip: "Define each term: $n$ = electron number density, $A$ = cross-sectional area, $\\tau$ = relaxation time."
        },
        {
          id: 23,
          category: `GSEB Std ${g} Chemistry: Electrochemistry`,
          question: "State the Nernst Equation for a general galvanic cell at 298 K:",
          answer: "$$E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{0.0591}{n} \\log_{10} Q$$\nWhere $n$ is number of moles of electrons transferred and $Q$ is reaction quotient.",
          board_tip: "GUJCET Formula Check: At equilibrium $E_{\\text{cell}} = 0 \\implies E^\\circ_{\\text{cell}} = \\frac{0.0591}{n}\\log K_c$."
        },
        {
          id: 24,
          category: `GSEB Std ${g} Mathematics: Calculus`,
          question: "State the Integration by Parts formula with the ILATE prioritization rule.",
          answer: "$$\\int u \\, v \\, dx = u \\int v \\, dx - \\int \\left( \\frac{du}{dx} \\int v \\, dx \\right) dx$$\nPriority for first function ($u$):\n**I**nverse $\\to$ **L**ogarithmic $\\to$ **A**lgebraic $\\to$ **T**rigonometric $\\to$ **E**xponential",
          board_tip: "Always check if direct substitution ($t = \\dots$) can simplify the integral first!"
        }
      ];
    }
  };

  if (!isOpen) return null;

  const currentCard = cards[currentIndex] || cards[0];
  const isMastered = currentCard ? masteredIds.includes(currentCard.id) : false;

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    const randomIndex = Math.floor(Math.random() * cards.length);
    setCurrentIndex(randomIndex);
  };

  const toggleMastered = (id: number) => {
    setMasteredIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1E1D]/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FAF9F5] border border-[#E5E3DC] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-[#1F1E1D]">
        
        {/* Header (Claude Warm Theme) */}
        <div className="bg-[#F3F1EC] px-6 py-4 border-b border-[#E5E3DC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C96442] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1F1E1D]">GSEB Revision Flashcards</h2>
                <span className="text-[10px] bg-[#C96442]/15 text-[#C96442] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Std {grade} • {subject}
                </span>
              </div>
              <p className="text-xs text-[#6B6862]">
                Official GSEB English Medium high-yield concept review & formula memorization
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
        <div className="p-6 flex-1 flex flex-col justify-between overflow-y-auto">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#C96442] animate-spin mx-auto" />
              <p className="text-xs text-[#6B6862]">Loading GSEB Standard {grade} revision flashcards...</p>
            </div>
          ) : !currentCard ? (
            <div className="py-20 text-center text-xs text-[#6B6862]">
              No flashcards available for this topic.
            </div>
          ) : (
            <>
              {/* Progress and Category Bar */}
              <div className="flex items-center justify-between text-xs text-[#6B6862] mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-white text-[#C96442] font-bold text-xs border border-[#E5E3DC] shadow-2xs">
                    {currentCard.category}
                  </span>
                  {isMastered && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Mastered
                    </span>
                  )}
                </div>

                <span className="font-mono text-xs font-bold text-[#6B6862]">
                  Card {currentIndex + 1} of {cards.length}
                </span>
              </div>

              {/* The Flip Card (Crystal Clear High Contrast) */}
              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                className={`relative w-full min-h-[280px] p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-sm select-none ${
                  isFlipped 
                    ? 'bg-[#FDFBF7] border-[#C96442]/70 shadow-md ring-2 ring-[#C96442]/10' 
                    : 'bg-white border-[#E5E3DC] hover:border-[#C96442]/50 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-4 font-bold uppercase tracking-wider">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      isFlipped ? 'bg-[#C96442]/15 text-[#C96442]' : 'bg-[#EAE7DF] text-[#4A4742]'
                    }`}>
                      {isFlipped ? '💡 Answer & Explanation' : '❓ Question / Concept'}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#C96442] bg-[#C96442]/10 hover:bg-[#C96442]/20 px-3 py-1 rounded-full font-bold transition-colors">
                      <RotateCw className="w-3.5 h-3.5" />
                      {isFlipped ? 'Click to show Question' : 'Click to reveal Answer'}
                    </span>
                  </div>

                  {/* High Contrast Visible Typography */}
                  <div className="pt-2">
                    {isFlipped ? (
                      <div className="text-base md:text-lg font-medium text-[#111110] leading-relaxed">
                        <MarkdownWithMath content={currentCard.answer} latexAllowed={grade >= 6} />
                      </div>
                    ) : (
                      <div className="text-lg md:text-xl font-bold text-[#111110] leading-relaxed tracking-tight">
                        <MarkdownWithMath content={currentCard.question} latexAllowed={grade >= 6} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Board Examination Tip */}
                {isFlipped && currentCard.board_tip && (
                  <div className="mt-5 pt-3.5 border-t border-[#EADBCC] text-xs font-medium text-[#8C4626] bg-[#FAF5ED] p-3 rounded-2xl flex items-start gap-2 border border-[#EADBCC]/60">
                    <Sparkles className="w-4 h-4 flex-shrink-0 text-[#C96442] mt-0.5" />
                    <span>{currentCard.board_tip}</span>
                  </div>
                )}
              </div>

              {/* Controls Bar */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5E3DC]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMastered(currentCard.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                      isMastered
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#F3F1EC] border border-[#E5E3DC]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isMastered ? 'Marked Mastered' : 'Mark as Mastered'}</span>
                  </button>

                  <button
                    onClick={handleShuffle}
                    className="p-2 rounded-xl bg-white hover:bg-[#F3F1EC] text-[#6B6862] hover:text-[#1F1E1D] border border-[#E5E3DC] transition-colors"
                    title="Shuffle Cards"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F3F1EC] text-[#1F1E1D] text-xs font-bold flex items-center gap-1 transition-colors border border-[#E5E3DC]"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>
                  <button
                    onClick={handleNext}
                    className="px-4.5 py-2 rounded-xl bg-[#C96442] hover:bg-[#B55535] text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs active:scale-95"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
