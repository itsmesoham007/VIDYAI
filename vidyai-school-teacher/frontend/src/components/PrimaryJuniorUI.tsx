'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  Star, 
  Smile, 
  BookOpen, 
  Heart,
  HelpCircle,
  Lightbulb,
  Award
} from 'lucide-react';
import { ChatMessage, api } from '@/lib/api';
import { MarkdownWithMath } from '@/lib/renderMarkdown';
import { cleanMathForSpeech, getSpeechVoice } from '@/lib/speech';

interface PrimaryJuniorUIProps {
  grade: number;
  subject: string;
  language: string;
  socraticMode: boolean;
  onOpenQuiz: () => void;
  onOpenDoubtUpload: () => void;
  onOpenHintBar: () => void;
  onOpenWhiteboard?: () => void;
  onOpenFlashcards?: () => void;
}

export const PrimaryJuniorUI: React.FC<PrimaryJuniorUIProps> = ({
  grade,
  subject,
  language,
  socraticMode,
  onOpenQuiz,
  onOpenDoubtUpload,
  onOpenHintBar,
  onOpenWhiteboard,
  onOpenFlashcards
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Namaste little champion! 🌟 I'm your teacher Vidya Didi!\nWhat fun thing are we learning in Class ${grade} ${subject} today? You can type or tap the big microphone 🎤 to speak to me!`,
      timestamp: Date.now()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [stars, setStars] = useState(3);
  const [loading, setLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `Namaste little champion! 🌟 I'm your teacher Vidya Didi!\nWhat fun thing are we learning in Class ${grade} ${subject} today? You can type or tap the big microphone 🎤 to speak to me!`,
        timestamp: Date.now()
      }
    ]);
  }, [grade, subject]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Web Speech API: Text-to-Speech (TTS)
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const cleanText = cleanMathForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9; // Friendly, slightly slower pace for kids
    utterance.pitch = 1.15; // Cheerful warm pitch for Vidya Didi

    if (language === 'hi' || language === 'hinglish') {
      utterance.lang = 'hi-IN';
    } else if (language === 'gu') {
      utterance.lang = 'gu-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    const voice = getSpeechVoice(language, grade);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Web Speech API: Speech-to-Text (STT)
  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      if (language === 'hi' || language === 'hinglish') {
        recognition.lang = 'hi-IN';
      } else if (language === 'gu') {
        recognition.lang = 'gu-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim() || loading) return;

    const newMsg: ChatMessage = { role: 'user', content: textToSend, timestamp: Date.now() };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.sendMessage(
        updatedMessages,
        grade,
        subject,
        'Foundations',
        language,
        socraticMode
      );
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: response.reply,
        timestamp: Date.now()
      }]);
      // Reward child with a star!
      setStars(prev => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: 'Count apples! 🍎', prompt: 'Can we count some apples and fruits together?' },
    { label: 'Shapes & Patterns 🎨', prompt: 'Tell me about circles, triangles, and squares!' },
    { label: 'Tell a story 🦄', prompt: 'Can you tell me an exciting story about numbers or animals?' },
    { label: 'Why is water wet? 💧', prompt: 'Why is water wet and where does rain come from?' }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gradient-to-b from-amber-50/70 via-rose-50/40 to-sky-50/70">
      
      {/* Top Banner: Stars & Teacher Avatar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-amber-200/80 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-2xl shadow-md border-2 border-white">
              👩‍🏫
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-slate-800 text-sm sm:text-base">Vidya Didi</h2>
              <span className="text-[11px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                Class {grade} Buddy
              </span>
            </div>
            <p className="text-xs text-slate-500">I love explaining with games and emojis!</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenWhiteboard && (
            <button
              onClick={onOpenWhiteboard}
              className="px-3 py-1.5 rounded-2xl bg-cyan-100 hover:bg-cyan-200 border border-cyan-300 text-cyan-800 text-xs font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
            >
              <span>🎨 Drawing Board</span>
            </button>
          )}

          {onOpenFlashcards && (
            <button
              onClick={onOpenFlashcards}
              className="px-3 py-1.5 rounded-2xl bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-800 text-xs font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
            >
              <span>🃏 Flashcards</span>
            </button>
          )}

          {/* Stars Gamification Badge */}
          <div className="flex items-center gap-2 bg-amber-100/80 border border-amber-300 px-3.5 py-1.5 rounded-2xl shadow-sm">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400 animate-spin-slow" />
            <span className="text-xs font-black text-amber-900 tracking-wide">
              {stars} Stars!
            </span>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-amber-300 flex items-center justify-center text-base flex-shrink-0 shadow-sm">
                  👩‍🏫
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-3xl p-4 shadow-sm text-sm sm:text-base ${
                  isUser
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-none'
                    : 'bg-white border-2 border-amber-100 text-slate-800 rounded-bl-none shadow-amber-100/50'
                }`}
              >
                <div className="leading-relaxed">
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <MarkdownWithMath content={m.content} latexAllowed={false} />
                  )}
                </div>

                {/* Read Aloud Button for Teacher Messages */}
                {!isUser && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => speakText(m.content)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-xl transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isSpeaking ? 'Listening...' : 'Read Aloud 🔊'}</span>
                    </button>
                    <span className="text-[11px] text-slate-400">Class {grade} {subject}</span>
                  </div>
                )}
              </div>
              {isUser && (
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                  Me
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-xs italic pl-10">
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
            <span>Vidya Didi is thinking of a fun example for you...</span>
          </div>
        )}


      </div>

      {/* Quick Prompts Carousel */}
      <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp.prompt)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full bg-white/90 border border-amber-200 text-xs font-bold text-amber-900 hover:bg-amber-100 shadow-xs transition-all active:scale-95"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Bottom Voice-First Input Bar */}
      <div className="p-4 bg-white/95 backdrop-blur-md border-t border-amber-200">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          
          {/* Big Voice Microphone Button (STT) */}
          <button
            type="button"
            onClick={toggleListening}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md ${
              isListening
                ? 'bg-rose-500 text-white ring-4 ring-rose-200 animate-pulse'
                : 'bg-gradient-to-tr from-amber-400 to-rose-400 text-white hover:opacity-90'
            }`}
            title="Speak into the microphone"
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Text Input Box */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? 'Listening to your voice... Speak now!' : 'Type your question or tap the mic...'}
              className="w-full text-sm sm:text-base py-3 px-4 rounded-2xl border-2 border-amber-200 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 text-slate-800 placeholder-slate-400 bg-amber-50/30"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading}
            className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
            title="Send Message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

    </div>
  );
};
