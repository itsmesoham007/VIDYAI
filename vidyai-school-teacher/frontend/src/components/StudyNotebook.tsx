'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Trash2, 
  Pin, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  Sparkles, 
  FileText, 
  Tag, 
  X, 
  CheckCircle2,
  Bookmark
} from 'lucide-react';
import { api, StudyNote } from '@/lib/api';
import { MarkdownWithMath } from '@/lib/renderMarkdown';

interface StudyNotebookProps {
  grade: number;
  studentName: string;
  onNavigateToChat: (initialPrompt?: string, targetSubject?: string) => void;
}

export const StudyNotebook: React.FC<StudyNotebookProps> = ({
  grade,
  studentName,
  onNavigateToChat
}) => {
  const studentId = `stu_${(studentName || 'student').toLowerCase().replace(/\s+/g, '_')}`;
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Note Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>(grade <= 8 ? 'Mathematics' : 'Physics');
  const [newChapter, setNewChapter] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newTags, setNewTags] = useState<string>('Revision, High-Yield');

  useEffect(() => {
    loadNotes();
  }, [grade, studentName]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await api.getStudyNotes(studentId, grade);
      setNotes(res.notes || []);
    } catch (err) {
      console.error('Failed to load study notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      const tagsList = newTags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await api.createStudyNote({
        student_id: studentId,
        standard: grade,
        subject: newSubject,
        chapter_title: newChapter.trim(),
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: tagsList,
        is_pinned: false
      });

      setNotes(prev => [res.note, ...prev]);
      setIsCreating(false);
      setNewTitle('');
      setNewChapter('');
      setNewContent('');
    } catch (err) {
      console.error('Failed to create study note:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this study note?')) return;
    try {
      await api.deleteStudyNote(noteId, studentId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleTogglePin = async (noteId: string) => {
    try {
      const res = await api.togglePinNote(noteId, studentId);
      setNotes(prev => prev.map(n => n.id === noteId ? res.note : n).sort((a, b) => {
        const pinA = a.is_pinned ? 1 : 0;
        const pinB = b.is_pinned ? 1 : 0;
        return pinB - pinA;
      }));
    } catch (err) {
      console.error('Failed to pin note:', err);
    }
  };

  const handleCopyNote = (note: StudyNote) => {
    const text = `# ${note.title}\n**Subject:** GSEB Standard ${note.standard} ${note.subject}\n\n${note.content}`;
    navigator.clipboard.writeText(text);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportMarkdown = () => {
    if (notes.length === 0) return;
    const header = `# VidyAI Study Notebook — GSEB Standard ${grade} English Medium\nStudent: ${studentName}\nExported on: ${new Date().toLocaleDateString()}\n\n---\n\n`;
    const body = notes.map(n => (
      `## ${n.title}\n` +
      `**Subject:** Standard ${n.standard} ${n.subject} ${n.chapter_title ? `(${n.chapter_title})` : ''}\n` +
      `**Date:** ${new Date(n.created_at).toLocaleDateString()}\n\n` +
      `${n.content}\n\n---\n`
    )).join('\n');

    const blob = new Blob([header + body], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VidyAI_GSEB_Std_${grade}_Notebook.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Seed default formula sheet for Standard
  const handleSeedFormulaSheet = async () => {
    let sheetTitle = `GSEB Standard ${grade} Core Formula & Theorem Sheet`;
    let sheetContent = '';
    let sheetSubject = 'Mathematics';

    if (grade === 10) {
      sheetSubject = 'Mathematics';
      sheetTitle = 'GSEB Std 10 SSC Mathematics Board Formula Sheet';
      sheetContent = `### 1. Real Numbers & Polynomials
- **Fundamental Theorem of Arithmetic**: Every composite number can be expressed as a product of primes uniquely.
- **Zeroes of Quadratic Polynomial** $ax^2 + bx + c$:
  $$\\alpha + \\beta = -\\frac{b}{a}, \\quad \\alpha\\beta = \\frac{c}{a}$$

### 2. Pair of Linear Equations ($a_1x + b_1y + c_1 = 0$)
- Unique Solution (Intersecting lines): $\\frac{a_1}{a_2} \\neq \\frac{b_1}{b_2}$
- Infinitely Many Solutions (Coincident lines): $\\frac{a_1}{a_2} = \\frac{b_1}{b_2} = \\frac{c_1}{c_2}$
- No Solution (Parallel lines): $\\frac{a_1}{a_2} = \\frac{b_1}{b_2} \\neq \\frac{c_1}{c_2}$

### 3. Basic Proportionality Theorem (Thales BPT Theorem)
If a line is drawn parallel to one side of a triangle to intersect the other two sides in distinct points, then the other two sides are divided in the same ratio:
$$\\frac{AD}{DB} = \\frac{AE}{EC}$$

### 4. Trigonometric Identities
- $\\sin^2\\theta + \\cos^2\\theta = 1$
- $1 + \\tan^2\\theta = \\sec^2\\theta$
- $1 + \\cot^2\\theta = \\text{cosec}^2\\theta$`;
    } else if (grade === 12) {
      sheetSubject = 'Physics';
      sheetTitle = 'GSEB Std 12 HSC Physics Board Formula Sheet';
      sheetContent = `### 1. Electrostatics & Coulomb's Law
- **Coulomb's Force in vacuum**:
  $$F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{|q_1 q_2|}{r^2}$$
  where $\\frac{1}{4\\pi\\varepsilon_0} = 9 \\times 10^9 \\text{ N m}^2/\\text{C}^2$
- **Electric Flux & Gauss's Law**:
  $$\\Phi = \\oint \\vec{E} \\cdot d\\vec{A} = \\frac{q_{\\text{enclosed}}}{\\varepsilon_0}$$

### 2. Current Electricity
- **Ohm's Law**: $V = IR$
- **Drift Velocity**: $v_d = \\frac{eE\\tau}{m}$
- **Kirchhoff's Current Law (Junction Rule)**: $\\sum I = 0$ (Conservation of Charge)
- **Kirchhoff's Voltage Law (Loop Rule)**: $\\sum \\Delta V = 0$ (Conservation of Energy)`;
    } else {
      sheetSubject = 'Science';
      sheetTitle = `GSEB Standard ${grade} High-Yield Concept Revision Sheet`;
      sheetContent = `### Key GSEB Revision Points
- Review all chapter summary definitions from the Gujarat State Board textbook.
- Focus on cause-and-effect phenomena and diagram labeling.
- Practice Section A 1-mark objective questions.`;
    }

    try {
      const res = await api.createStudyNote({
        student_id: studentId,
        standard: grade,
        subject: sheetSubject,
        chapter_title: 'Board Formula Sheet',
        title: sheetTitle,
        content: sheetContent,
        tags: ['Formula Sheet', 'GSEB Blueprint', 'Board Exam'],
        is_pinned: true
      });
      setNotes(prev => [res.note, ...prev]);
    } catch (err) {
      console.error('Failed to seed formula sheet:', err);
    }
  };

  // Filter notes
  const filteredNotes = notes.filter(n => {
    const matchesSub = selectedSubject === 'all' || n.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchesSearch = !searchQuery.trim() ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSub && matchesSearch;
  });

  const subjects = Array.from(new Set(notes.map(n => n.subject)));

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAF9F5] text-[#1F1E1D] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* 1. Notebook Header */}
        <div className="bg-white rounded-2xl p-6 border border-[#E5E3DC] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FBF0EB] border border-[#C96442]/20 text-[#C96442] text-xs font-bold mb-2">
              <Bookmark className="w-3.5 h-3.5" />
              <span>GSEB Standard {grade} • Study Notebook</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1F1E1D]">
              Personal Revision Notebook & Formulas 📓
            </h1>
            <p className="text-xs text-[#6B6862] mt-1">
              All your bookmarked AI teacher explanations, KaTeX LaTeX formulas, and GSEB board revision notes.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportMarkdown}
              disabled={notes.length === 0}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#E5E3DC] bg-[#FAF9F5] hover:bg-[#F5F3EC] text-[#1F1E1D] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#C96442]" />
              <span>Export .MD</span>
            </button>

            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#C96442] hover:bg-[#B85536] text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Note</span>
            </button>
          </div>
        </div>

        {/* 2. Search & Subject Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedSubject === 'all'
                  ? 'bg-[#C96442] text-white shadow-xs'
                  : 'bg-[#F5F3EC] text-[#6B6862] hover:bg-[#EAE7DF]'
              }`}
            >
              All Notes ({notes.length})
            </button>
            {subjects.map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedSubject.toLowerCase() === sub.toLowerCase()
                    ? 'bg-[#C96442] text-white shadow-xs'
                    : 'bg-[#F5F3EC] text-[#6B6862] hover:bg-[#EAE7DF]'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-[#949088] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notes or formula tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-[#E5E3DC] focus:outline-none focus:border-[#C96442]"
            />
          </div>
        </div>

        {/* 3. New Note Modal / Inline Form */}
        {isCreating && (
          <form 
            onSubmit={handleCreateNote}
            className="bg-white rounded-2xl border border-[#C96442]/40 p-6 shadow-md space-y-4 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between border-b border-[#E5E3DC] pb-3">
              <h3 className="text-sm font-bold text-[#1F1E1D] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C96442]" />
                Create New Study Note or Formula Sheet
              </h3>
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="text-[#949088] hover:text-[#1F1E1D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#6B6862] block mb-1">Subject</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF9F5] rounded-xl border border-[#E5E3DC] focus:outline-none focus:border-[#C96442]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B6862] block mb-1">Chapter / Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 6: Triangles"
                  value={newChapter}
                  onChange={(e) => setNewChapter(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF9F5] rounded-xl border border-[#E5E3DC] focus:outline-none focus:border-[#C96442]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B6862] block mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Revision, Theorem, Formula"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-[#FAF9F5] rounded-xl border border-[#E5E3DC] focus:outline-none focus:border-[#C96442]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#6B6862] block mb-1">Note Title</label>
              <input
                type="text"
                placeholder="e.g. BPT Theorem 4-Mark Board Proof"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-[#FAF9F5] rounded-xl border border-[#E5E3DC] focus:outline-none focus:border-[#C96442]"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#6B6862] block mb-1">
                Content (Markdown & KaTeX LaTeX supported with $...$ and $$...$$)
              </label>
              <textarea
                rows={6}
                placeholder="Write your study notes, derivations, or paste AI explanations here..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F5] rounded-xl border border-[#E5E3DC] font-mono focus:outline-none focus:border-[#C96442]"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-[#6B6862] hover:bg-[#F5F3EC]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#C96442] hover:bg-[#B85536] text-white shadow-xs"
              >
                Save to Notebook
              </button>
            </div>
          </form>
        )}

        {/* 4. Notes Grid */}
        {loading ? (
          <div className="py-16 text-center text-xs text-[#949088]">
            Loading your study notes...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-[#E5E3DC] p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FBF0EB] text-[#C96442] mx-auto flex items-center justify-center text-xl font-bold">
              📓
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1F1E1D]">Your Notebook is Fresh!</h3>
              <p className="text-xs text-[#6B6862] max-w-md mx-auto mt-1">
                You haven&apos;t saved any revision notes for Standard {grade} yet. 
                You can create a custom note or import the official GSEB Board Formula Sheet.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleSeedFormulaSheet}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#C96442] hover:bg-[#B85536] text-white shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Import Std {grade} Formula Sheet</span>
              </button>
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E5E3DC] bg-[#FAF9F5] hover:bg-[#F5F3EC] text-[#1F1E1D]"
              >
                Write Custom Note
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.map(note => {
              const isPinned = Boolean(note.is_pinned);
              const isCopied = copiedId === note.id;

              return (
                <div 
                  key={note.id}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-xs flex flex-col justify-between ${
                    isPinned ? 'border-[#C96442]/60 ring-1 ring-[#C96442]/20' : 'border-[#E5E3DC] hover:border-[#C96442]/40'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Note Top Bar */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FBF0EB] text-[#C96442] px-2 py-0.5 rounded-md border border-[#C96442]/20">
                          {note.subject}
                        </span>
                        {note.chapter_title && (
                          <span className="text-[11px] text-[#8C827A] font-medium truncate max-w-[180px]">
                            {note.chapter_title}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTogglePin(note.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isPinned ? 'text-[#C96442] bg-[#FBF0EB]' : 'text-[#949088] hover:text-[#1F1E1D] hover:bg-[#FAF9F5]'
                          }`}
                          title={isPinned ? 'Unpin note' : 'Pin to top'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleCopyNote(note)}
                          className="p-1.5 rounded-lg text-[#949088] hover:text-[#1F1E1D] hover:bg-[#FAF9F5] transition-colors"
                          title="Copy note text"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1.5 rounded-lg text-[#949088] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Note Title */}
                    <h3 className="text-sm font-bold text-[#1F1E1D] leading-snug">
                      {note.title}
                    </h3>

                    {/* Note Rendered Content */}
                    <div className="bg-[#FAF9F5] rounded-xl p-3.5 border border-[#E5E3DC]/70 max-h-72 overflow-y-auto text-xs">
                      <MarkdownWithMath content={note.content} />
                    </div>

                    {/* Tags */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {note.tags.map((tag, tIdx) => (
                          <span 
                            key={tIdx} 
                            className="text-[10px] text-[#6B6862] bg-[#F5F3EC] px-2 py-0.5 rounded-md flex items-center gap-1"
                          >
                            <Tag className="w-2.5 h-2.5 text-[#949088]" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Note Footer */}
                  <div className="pt-3 mt-3 border-t border-[#E5E3DC]/60 flex items-center justify-between text-[10px] text-[#949088]">
                    <span>Saved on {new Date(note.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => onNavigateToChat(`Let's discuss my saved note on "${note.title}". Can you give me 2 board exam practice questions on this topic?`, note.subject)}
                      className="text-[#C96442] font-semibold hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Practice in AI Chat</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
