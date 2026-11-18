'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Download, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  Search,
  BookMarked,
  GraduationCap
} from 'lucide-react';
import { api, GsebBook, GsebChapter } from '@/lib/api';
import { VidyAILogo } from '@/components/VidyAILogo';

interface GsebBooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGrade?: number;
  grade?: number;
  onSwitchStandard?: () => void;
  onSelectBook: (grade: number, subject: string) => void;
  onAskChapter?: (grade: number, subject: string, chapterTitle: string, chapterNo?: number) => void;
}

export const GsebBooksModal: React.FC<GsebBooksModalProps> = ({
  isOpen,
  onClose,
  selectedGrade,
  grade,
  onSwitchStandard,
  onSelectBook,
  onAskChapter
}) => {
  const activeGrade = Number(selectedGrade || grade || 10);
  const [books, setBooks] = useState<GsebBook[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadBooks();
      setSelectedSubject('all');
      setSearchQuery('');
    }
  }, [isOpen, activeGrade]);

  const loadBooks = async () => {
    setLoading(true);
    try {
      // Strictly fetch books for activeGrade only
      const data = await api.getGsebBooks(activeGrade);
      const strictlyFiltered = (data.books || []).filter(
        b => Number(b.standard || b.grade) === activeGrade
      );
      setBooks(strictlyFiltered);
    } catch (e) {
      console.error('Failed to load GSEB books:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    setDownloadSuccess(null);
    try {
      const res = await api.downloadGsebBooks();
      setDownloadSuccess(res.message || `GSEB Standard ${activeGrade} books compiled and indexed!`);
      await loadBooks();
    } catch (e: any) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const toggleBookExpansion = (bookKey: string) => {
    setExpandedBooks(prev => ({
      ...prev,
      [bookKey]: !prev[bookKey]
    }));
  };

  const handleAskAboutChapter = (bookGrade: number, subject: string, chapter: GsebChapter) => {
    if (onAskChapter) {
      onAskChapter(bookGrade, subject, chapter.title, chapter.no);
    } else {
      onSelectBook(bookGrade, subject);
    }
    onClose();
  };

  if (!isOpen) return null;

  const totalChapters = books.reduce((acc, b) => acc + (b.chapter_count || b.chapters?.length || 0), 0);

  // Extract unique subjects strictly belonging to this Standard
  const availableSubjects = Array.from(
    new Set(books.map(b => b.subject))
  ).sort();

  // Filter books strictly within activeGrade by subject & search query
  const filteredBooks = books.filter(b => {
    // Hard constraint: standard isolation
    if (Number(b.standard || b.grade) !== activeGrade) {
      return false;
    }

    if (selectedSubject !== 'all' && b.subject !== selectedSubject) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (b.book_title || '').toLowerCase().includes(q);
      const matchSubj = (b.subject || '').toLowerCase().includes(q);
      const matchStream = (b.stream || '').toLowerCase().includes(q);
      const matchFilename = (b.filename || '').toLowerCase().includes(q);
      const matchChapter = (b.chapters || []).some(
        ch => ch.title.toLowerCase().includes(q) || (ch.concepts || '').toLowerCase().includes(q)
      );
      if (!matchTitle && !matchSubj && !matchStream && !matchFilename && !matchChapter) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1E1D]/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FAF9F5] border border-[#E5E3DC] rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-[#1F1E1D]">
        
        {/* Header */}
        <div className="bg-[#F3F1EC] px-6 py-4 border-b border-[#E5E3DC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VidyAILogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1F1E1D]">
                  GSEB Standard {activeGrade} Textbooks Library (English Medium)
                </h2>
                <span className="text-[10px] bg-[#C96442]/15 text-[#C96442] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Std {activeGrade}
                </span>
              </div>
              <p className="text-xs text-[#6B6862]">
                Official Gujarat State Board of School Textbooks (GSSTB) • {books.length} Textbooks & {totalChapters} Chapters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchStandard && (
              <button
                onClick={() => {
                  onClose();
                  onSwitchStandard();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E3DC] bg-white hover:bg-[#FAF9F5] text-xs font-semibold text-[#1F1E1D] transition-all shadow-2xs hover:border-[#C96442]/40"
                title="Switch to another GSEB Standard"
              >
                <GraduationCap className="w-3.5 h-3.5 text-[#C96442]" />
                <span>Switch Standard</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[#EAE7DF] text-[#6B6862] hover:text-[#1F1E1D] transition-colors"
              title="Close Library"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar: Subject Pills & Search */}
        <div className="p-4 bg-[#FAF9F5] border-b border-[#E5E3DC] space-y-3">
          {/* Row 1: Search & Re-compile */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#949088]" />
              <input
                type="text"
                placeholder={`Search Standard ${activeGrade} books, chapters, topics (e.g. Equations, Photosynthesis)...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E5E3DC] rounded-xl text-xs text-[#1F1E1D] placeholder-[#949088] focus:outline-none focus:border-[#C96442]"
              />
            </div>

            <button
              onClick={handleDownloadAll}
              disabled={downloading}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all whitespace-nowrap"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloading ? 'Compiling Books...' : 'Re-index Textbooks'}</span>
            </button>
          </div>

          {/* Row 2: Standard {activeGrade} Subject Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-[#6B6862] mr-1 whitespace-nowrap">Subjects:</span>
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedSubject === 'all'
                  ? 'bg-[#C96442] text-white shadow-xs'
                  : 'bg-white text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#F3F1EC] border border-[#E5E3DC]'
              }`}
            >
              All Subjects ({books.length})
            </button>

            {availableSubjects.map(subj => {
              const subjCount = books.filter(b => b.subject === subj).length;
              const isSelected = selectedSubject === subj;
              return (
                <button
                  key={subj}
                  onClick={() => setSelectedSubject(subj)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#1F1E1D] text-white shadow-xs'
                      : 'bg-white text-[#6B6862] hover:text-[#1F1E1D] hover:bg-[#F3F1EC] border border-[#E5E3DC]'
                  }`}
                >
                  {subj} ({subjCount})
                </button>
              );
            })}
          </div>
        </div>

        {downloadSuccess && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Book Cards Grid */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#C96442] animate-spin mx-auto" />
              <p className="text-xs text-[#6B6862]">Loading GSEB Standard {activeGrade} Textbooks...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-[#6B6862] text-sm">No textbooks found matching your filter in Standard {activeGrade}.</p>
              <button
                onClick={() => {
                  setSelectedSubject('all');
                  setSearchQuery('');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#C96442] text-white text-xs font-bold shadow-xs hover:bg-[#B55535] transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBooks.map((book, idx) => {
                const std = book.standard || book.grade || activeGrade;
                const bookKey = `${std}-${book.subject}-${idx}`;
                const isExpanded = !!expandedBooks[bookKey];
                const chapters = book.chapters || [];

                return (
                  <div
                    key={bookKey}
                    className="p-4 rounded-2xl bg-white border border-[#E5E3DC] hover:border-[#C96442]/40 transition-all flex flex-col justify-between shadow-xs hover:shadow-sm"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#C96442]/10 text-[#C96442] border border-[#C96442]/20 flex items-center gap-1">
                            <span>Standard {std}</span>
                            <span>{std <= 5 ? '🐣' : std <= 8 ? '🌱' : std <= 10 ? '🎯' : '🎓'}</span>
                          </span>
                          {book.stream && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1F1E1D]/5 text-[#1F1E1D] border border-[#E5E3DC]">
                              {book.stream}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#6B6862] font-medium whitespace-nowrap">
                          {book.chapter_count || chapters.length} Chapters
                        </span>
                      </div>

                      {/* Title & Subject */}
                      <h3 className="font-bold text-base text-[#1F1E1D] flex items-center gap-1.5">
                        <BookMarked className="w-4 h-4 text-[#C96442] flex-shrink-0" />
                        <span>{book.subject}</span>
                      </h3>
                      <p className="text-xs text-[#6B6862] font-medium mt-0.5">
                        {book.book_title || `${book.subject} - GSEB Class ${std}`}
                      </p>
                      <p className="text-[10px] text-[#949088] font-mono mt-1 truncate">
                        GSSTB File: {book.filename}
                      </p>

                      {/* Collapsible Chapters Section */}
                      {chapters.length > 0 && (
                        <div className="mt-3">
                          <button
                            onClick={() => toggleBookExpansion(bookKey)}
                            className="w-full py-1.5 px-2.5 rounded-xl bg-[#F3F1EC] hover:bg-[#EAE7DF] text-[#1F1E1D] text-xs font-semibold flex items-center justify-between border border-[#E5E3DC] transition-colors"
                          >
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#C96442]" />
                              <span>{isExpanded ? 'Hide Chapters' : `View ${chapters.length} Chapters & Topics`}</span>
                            </span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
                              {chapters.map(ch => (
                                <div
                                  key={ch.no}
                                  className="p-2.5 rounded-xl bg-[#FAF9F5] border border-[#E5E3DC] text-xs flex flex-col justify-between gap-1.5"
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5 font-bold text-[#1F1E1D]">
                                      <span className="w-5 h-5 rounded-md bg-[#C96442]/10 text-[#C96442] flex items-center justify-center text-[10px] font-mono">
                                        {ch.no}
                                      </span>
                                      <span className="flex-1">{ch.title}</span>
                                    </div>
                                    {ch.concepts && (
                                      <p className="text-[10px] text-[#6B6862] mt-1 line-clamp-2 pl-6">
                                        {ch.concepts}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex justify-end pt-1">
                                    <button
                                      onClick={() => handleAskAboutChapter(std, book.subject, ch)}
                                      className="px-2.5 py-1 rounded-lg bg-[#C96442] hover:bg-[#B55535] text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      <span>Ask VidyAI about this Chapter</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-[#E5E3DC] flex items-center justify-between">
                      <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Indexed in RAG
                      </span>

                      <button
                        onClick={() => {
                          onSelectBook(std, book.subject);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#F3F1EC] hover:bg-[#C96442] hover:text-white text-[#1F1E1D] text-xs font-semibold flex items-center gap-1 border border-[#E5E3DC] transition-all"
                      >
                        <span>Study This Book</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#F3F1EC] border-t border-[#E5E3DC] flex justify-between items-center text-xs text-[#6B6862]">
          <span>GSEB Standard {activeGrade} English Medium • Gujarat State Board of School Textbooks</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-[#FAF9F5] text-[#1F1E1D] border border-[#E5E3DC] font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
