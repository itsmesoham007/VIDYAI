'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, SkipForward, Sparkles, CheckCircle2 } from 'lucide-react';
import { VidyAILogo, VidyAIIcon } from '@/components/VidyAILogo';

interface IntroVideoSplashProps {
  onFinish: () => void;
  autoPlayMuted?: boolean;
}

export const IntroVideoSplash: React.FC<IntroVideoSplashProps> = ({
  onFinish,
  autoPlayMuted = true
}) => {
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(autoPlayMuted);
  const [videoFailed, setVideoFailed] = useState<boolean>(false);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [fallbackProgress, setFallbackProgress] = useState<number>(0);
  const [fallbackStage, setFallbackStage] = useState<string>('Initializing VidyAI Core Engine...');
  const videoRef = useRef<HTMLVideoElement>(null);
  const isFinishedRef = useRef<boolean>(false);

  const finishIntro = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;
    setIsFadingOut(true);

    try {
      sessionStorage.setItem('vidyai_intro_seen', 'true');
    } catch {
      // Ignore storage errors
    }

    if (videoRef.current) {
      videoRef.current.pause();
    }

    setTimeout(() => {
      onFinish();
    }, 700);
  };

  const toggleSound = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
      if (!nextMuted && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    } else {
      setIsMuted(prev => !prev);
    }
  };

  // Fallback 4-second motion graphics timer if video fails or is missing
  useEffect(() => {
    if (!videoFailed) return;

    const stages = [
      { at: 10, text: 'Initializing VidyAI Core Engine...' },
      { at: 35, text: 'Loading GSEB Standards 1 to 12 Textbooks...' },
      { at: 65, text: 'Connecting ChromaDB Vector Store & KaTeX Math AST...' },
      { at: 90, text: 'Google Gemini AI Teacher Ready!' }
    ];

    const startTime = Date.now();
    const duration = 4000; // 4 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setFallbackProgress(pct);

      const currentStage = [...stages].reverse().find(s => pct >= s.at);
      if (currentStage) {
        setFallbackStage(currentStage.text);
      }

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(finishIntro, 400);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [videoFailed]);

  // Attempt autoplay when mounted
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // If autoplay blocked, remain muted
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {
            setVideoFailed(true);
          });
        }
      });
    }
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#141312] text-[#FAF9F5] flex flex-col justify-between items-center select-none overflow-hidden transition-opacity duration-700 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="VidyAI Introduction"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#C96442]/15 blur-[140px] rounded-full" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#E27B5B]/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#FAF9F5_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
      </div>

      {/* Top Controls Bar */}
      <header className="relative z-20 w-full px-6 py-5 flex items-center justify-between">
        {/* Brand Badge */}
        <div className="flex items-center gap-2.5">
          <VidyAILogo size="sm" showText={true} inverted={true} />
          <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#C96442]/20 text-[#E27B5B] border border-[#C96442]/30">
            GSEB English Medium
          </span>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-3">
          {!videoFailed && (
            <button
              type="button"
              onClick={toggleSound}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 backdrop-blur-md text-xs font-semibold shadow-lg transition-all active:scale-95"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-[#E27B5B]" />
                  <span>Unmute 🔊</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sound On</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={finishIntro}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-[#C96442] text-white border border-white/20 hover:border-transparent backdrop-blur-md text-xs font-bold shadow-lg transition-all hover:scale-105 active:scale-95 group"
            title="Skip Intro"
          >
            <span>Skip Intro</span>
            <SkipForward className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* Main Center Stage: Video Player OR Cinematic Motion Graphics Fallback */}
      <main className="relative z-10 flex-1 w-full flex items-center justify-center p-4 md:p-8">
        {!videoFailed ? (
          <div className="relative w-full max-w-5xl max-h-[75vh] aspect-video flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl bg-black/60 border border-white/10 backdrop-blur-xs">
            <video
              ref={videoRef}
              src="/intro.mp4"
              autoPlay
              muted={isMuted}
              playsInline
              preload="auto"
              onEnded={finishIntro}
              onError={() => setVideoFailed(true)}
              onLoadedData={() => setVideoLoaded(true)}
              className="w-full h-full object-contain"
            />

            {/* Subtle Overlay watermark */}
            <div className="absolute top-4 left-4 pointer-events-none opacity-40">
              <VidyAILogo size="xs" showText={false} />
            </div>
          </div>
        ) : (
          /* Cinematic Fallback Animation */
          <div className="w-full max-w-xl text-center space-y-8 animate-fadeIn">
            {/* Animated Logo with Terracotta Glow */}
            <div className="relative inline-block mx-auto">
              <div className="absolute -inset-4 bg-[#C96442]/30 rounded-full blur-xl animate-pulse" />
              <div className="relative p-4 rounded-3xl bg-white/5 border border-white/15 backdrop-blur-md shadow-2xl">
                <VidyAIIcon size={84} animated={true} />
              </div>
            </div>

            {/* Titles */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                VidyAI — GSEB English Medium AI Teacher
              </h1>
              <p className="text-xs sm:text-sm text-[#FAF9F5]/70 font-medium">
                Standards 1 to 12 • Powered by Google Gemini & GSSTB Textbooks
              </p>
            </div>

            {/* Sleek Progress Bar */}
            <div className="space-y-2.5 max-w-md mx-auto pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#FAF9F5]/80">
                <span className="flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-[#E27B5B] animate-spin" />
                  <span className="truncate">{fallbackStage}</span>
                </span>
                <span className="font-mono text-[#E27B5B] ml-2">{fallbackProgress}%</span>
              </div>

              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#C96442] to-[#E27B5B] rounded-full transition-all duration-100 ease-out shadow-sm"
                  style={{ width: `${fallbackProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] text-[#FAF9F5]/50 pt-1">
                <span>✦ 158 Official Textbooks</span>
                <span>✦ KaTeX Math</span>
                <span>✦ Socratic Tutor</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Footer Bar */}
      <footer className="relative z-20 w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50 border-t border-white/10 bg-[#141312]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Gujarat Secondary and Higher Secondary Education Board (GSEB) • English Medium Only</span>
        </div>

        <button
          type="button"
          onClick={finishIntro}
          className="inline-flex items-center gap-1.5 text-xs text-[#E27B5B] hover:text-white font-semibold transition-colors"
        >
          <span>Enter VidyAI Workspace</span>
          <span>→</span>
        </button>
      </footer>
    </div>
  );
};
