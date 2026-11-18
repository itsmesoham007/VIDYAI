'use client';

import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  PenTool, 
  Eraser, 
  RotateCcw, 
  Download, 
  Grid, 
  Square, 
  Minus, 
  Sparkles,
  Palette,
  Undo2
} from 'lucide-react';

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: number;
  subject: string;
}

type ToolType = 'pen' | 'eraser' | 'line' | 'rectangle';
type BgType = 'dark' | 'grid' | 'light';

export const WhiteboardModal: React.FC<WhiteboardModalProps> = ({
  isOpen,
  onClose,
  grade,
  subject
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState<string>('#38bdf8'); // sky blue
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [bgType, setBgType] = useState<BgType>('dark');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);

  const colors = [
    '#ffffff', // White
    '#38bdf8', // Sky
    '#34d399', // Emerald
    '#fbbf24', // Amber
    '#f43f5e', // Rose
    '#a78bfa', // Purple
  ];

  // Initialize and redraw background
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Adjust to container size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);

      drawBackground(ctx, rect.width, rect.height, bgType);
      saveState();
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, bgType]);

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, type: BgType) => {
    if (type === 'dark') {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);
    } else if (type === 'light') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);
    } else if (type === 'grid') {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      const step = 25;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory(prev => [...prev.slice(-15), imgData]);
    } catch {
      // ignore
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = history.slice(0, -1);
    const prevState = newHistory[newHistory.length - 1];
    if (prevState) {
      ctx.putImageData(prevState, 0, 0);
      setHistory(newHistory);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    drawBackground(ctx, rect.width, rect.height, bgType);
    saveState();
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(coords);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = tool === 'eraser' ? (bgType === 'light' ? '#f8fafc' : '#090d16') : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas || !startPos) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);

    if (tool === 'line') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else if (tool === 'rectangle') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(startPos.x, startPos.y, coords.x - startPos.x, coords.y - startPos.y);
    }

    saveState();
    setStartPos(null);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `VidyAI-Whiteboard-Class${grade}-${subject}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Toolbar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Interactive Classroom Whiteboard</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Class {grade} {subject}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Rough work, geometry diagrams, and mathematical scratchpad</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Tools */}
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 gap-1">
              <button
                onClick={() => setTool('pen')}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                  tool === 'pen' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Pen"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pen</span>
              </button>

              <button
                onClick={() => setTool('line')}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                  tool === 'line' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Straight Line"
              >
                <Minus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Line</span>
              </button>

              <button
                onClick={() => setTool('rectangle')}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                  tool === 'rectangle' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Rectangle"
              >
                <Square className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Box</span>
              </button>

              <button
                onClick={() => setTool('eraser')}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                  tool === 'eraser' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Eraser"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Eraser</span>
              </button>
            </div>

            {/* Colors */}
            <div className="flex items-center bg-slate-900 rounded-xl px-2 py-1 border border-slate-800 gap-1.5">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen'); }}
                  className={`w-4 h-4 rounded-full border transition-transform ${
                    color === c && tool !== 'eraser' ? 'scale-125 border-white ring-2 ring-blue-500' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>

            {/* Stroke Thickness */}
            <div className="flex items-center bg-slate-900 rounded-xl px-2.5 py-1 border border-slate-800 gap-2 text-xs text-slate-300">
              <span className="text-[10px] text-slate-500">Size:</span>
              {[2, 4, 8].map((s) => (
                <button
                  key={s}
                  onClick={() => setLineWidth(s)}
                  className={`px-1.5 py-0.5 rounded font-mono text-xs ${
                    lineWidth === s ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  {s}px
                </button>
              ))}
            </div>

            {/* Background Style */}
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 gap-1">
              <button
                onClick={() => setBgType(bgType === 'dark' ? 'grid' : bgType === 'grid' ? 'light' : 'dark')}
                className="px-2 py-1 text-xs text-slate-300 hover:text-white flex items-center gap-1"
                title="Toggle Blackboard / Graph Grid / Whiteboard"
              >
                <Grid className="w-3.5 h-3.5 text-cyan-400" />
                <span className="capitalize">{bgType}</span>
              </button>
            </div>

            {/* Undo */}
            <button
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 border border-slate-700 transition-colors"
              title="Undo last stroke"
            >
              <Undo2 className="w-4 h-4" />
            </button>

            {/* Clear */}
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 transition-colors"
              title="Clear Canvas"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition-colors"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Body */}
        <div className="flex-1 w-full h-full relative cursor-crosshair overflow-hidden bg-slate-950">
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            className="w-full h-full block"
          />
        </div>

        {/* Footer Hint */}
        <div className="px-5 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Click & drag to sketch geometry, physics free-body diagrams, and algebraic derivations.</span>
          <span className="font-mono text-cyan-400">Class {grade} Canvas Ready</span>
        </div>
      </div>
    </div>
  );
};
