'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Loader2, Sparkles, AlertCircle, FileText, HelpCircle } from 'lucide-react';
import { api, ImageDoubtResponse } from '@/lib/api';
import { MarkdownWithMath } from '@/lib/renderMarkdown';

interface DoubtPhotoUploadProps {
  isOpen: boolean;
  onClose: () => void;
  grade: number;
  subject: string;
  language?: string;
  socraticMode?: boolean;
}

export const DoubtPhotoUpload: React.FC<DoubtPhotoUploadProps> = ({
  isOpen,
  onClose,
  grade,
  subject,
  language = 'en',
  socraticMode = true
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ImageDoubtResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleUsePreset = (type: 'senior' | 'primary') => {
    // Generate simulated lightweight canvas imageData for immediate testing
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 400, 200);
      ctx.fillStyle = '#1e293b';
      ctx.font = '16px sans-serif';
      if (type === 'senior') {
        ctx.fillText('Class 12 Physics Doubt:', 20, 40);
        ctx.fillText('q1 = 2μC, q2 = -4μC, r = 10cm', 20, 80);
        ctx.fillText('Find electrostatic force F = ?', 20, 120);
      } else {
        ctx.fillText('Class 2 Math Doubt:', 20, 40);
        ctx.fillText('Rohit has 8 apples. Gives 3 to Meera.', 20, 80);
        ctx.fillText('How many apples remain?', 20, 120);
      }
    }
    const dataUrl = canvas.toDataURL('image/jpeg');
    setPreviewUrl(dataUrl);
    setSelectedFile(null);
    setResult(null);
  };

  const handleUploadAndAnalyze = async () => {
    if (!previewUrl) return;
    setLoading(true);
    try {
      const response = await api.uploadDoubtPhoto(
        selectedFile,
        previewUrl,
        grade,
        subject,
        language,
        socraticMode
      );
      setResult(response);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1E1D]/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FAF9F5] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#E5E3DC] text-[#1F1E1D]">
        
        {/* Header */}
        <div className="bg-[#F3F1EC] px-6 py-4 border-b border-[#E5E3DC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C96442] text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1F1E1D]">Multimodal Doubt Scanner</h2>
                <span className="text-[10px] bg-[#C96442]/15 text-[#C96442] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Std {grade} • {subject}
                </span>
              </div>
              <p className="text-xs text-[#6B6862]">Upload handwritten notes, textbook questions, or formulas</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl hover:bg-[#EAE7DF] text-[#6B6862] hover:text-[#1F1E1D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Upload Area */}
          {!previewUrl ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#E5E3DC] hover:border-[#C96442]/60 bg-white hover:bg-[#FDFBF7] rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center group shadow-2xs"
            >
              <div className="w-16 h-16 rounded-full bg-[#C96442]/10 text-[#C96442] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-[#1F1E1D] text-sm mb-1">Click to browse or drop notebook photo</h3>
              <p className="text-xs text-[#6B6862] mb-4">PNG, JPG, or WEBP (handwritten math or science problem)</p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleUsePreset('senior'); }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E3DC] text-xs font-semibold text-[#1F1E1D] hover:bg-[#F3F1EC] shadow-2xs"
                >
                  ⚡ Preset: GSEB Std 12 Physics Doubt
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleUsePreset('primary'); }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E3DC] text-xs font-semibold text-[#1F1E1D] hover:bg-[#F3F1EC] shadow-2xs"
                >
                  🍎 Preset: GSEB Std 2 Math Doubt
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-[#E5E3DC] bg-[#F5F3EC] max-h-52 flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={previewUrl} 
                  alt="Doubt photo" 
                  className="max-h-48 object-contain rounded-xl shadow-xs" 
                />
                <button
                  onClick={() => { setPreviewUrl(null); setSelectedFile(null); setResult(null); }}
                  className="absolute top-2 right-2 p-1.5 bg-[#1F1E1D]/70 hover:bg-[#1F1E1D] text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!result && (
                <button
                  disabled={loading}
                  onClick={handleUploadAndAnalyze}
                  className="w-full py-3 px-4 bg-[#C96442] hover:bg-[#B55535] disabled:opacity-50 text-white rounded-2xl text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Reading handwriting & analyzing concept...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze Doubt with Gemini Vision</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Analysis Result */}
          {result && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Extracted Text */}
              <div className="p-4 rounded-2xl bg-white border border-[#E5E3DC] shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-[#6B6862] uppercase tracking-wider mb-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#C96442]" />
                  <span>Extracted Problem Text</span>
                </div>
                <p className="text-xs sm:text-sm text-[#1F1E1D] font-mono bg-[#FAF9F5] p-2.5 rounded-xl border border-[#E5E3DC]">
                  {result.extracted_text}
                </p>
              </div>

              {/* Identified Concept */}
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#C96442]/10 border border-[#C96442]/20 text-[#C96442] text-xs">
                <span className="font-bold">Core Concept:</span>
                <span className="px-2 py-0.5 rounded-full bg-white text-[#C96442] font-semibold border border-[#C96442]/30">
                  {result.concept_identified}
                </span>
              </div>

              {/* Teaching Response */}
              <div className="p-4 rounded-2xl bg-white border border-[#E5E3DC] shadow-2xs text-[#1F1E1D]">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>VidyAI Teacher Guidance</span>
                </div>
                <div className="text-xs sm:text-sm leading-relaxed text-[#1F1E1D]">
                  <MarkdownWithMath content={result.teaching_response} />
                </div>
              </div>

              {/* Hints */}
              {result.hints && result.hints.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#FAF5ED] border border-[#EADBCC] text-[#8C4626]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#8C4626] uppercase tracking-wider mb-2">
                    <HelpCircle className="w-3.5 h-3.5 text-[#C96442]" />
                    <span>Helpful Pointers</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {result.hints.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F3F1EC] border-t border-[#E5E3DC] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#EAE7DF] border border-[#E5E3DC] text-xs font-semibold text-[#1F1E1D] transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
