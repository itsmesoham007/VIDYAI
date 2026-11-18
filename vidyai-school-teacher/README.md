# VidyAI — Adaptive AI School Teacher (Class 1 to 12)

VidyAI is an adaptive, curriculum-aligned (NCERT/CBSE/State Board) AI educational platform designed specifically for Indian school students from Grade 1 to Grade 12.

## ⚡ Gemini 4 Argon Chat Wrapper
- **Gemini 4 Argon (`gemini-4-argon`)**: Google's flagship reasoning model used for deep mathematical, physical, and scientific reasoning queries.
- **Dedicated Chat Wrapper UI**: Focused, responsive chat interface with live KaTeX math formula rendering ($...$ and $$...$$), code blocks with copy action, quick starter prompts, and follow-up inquiry chips.
- **SSE Streaming Support**: High-performance real-time token streaming via `/api/chat/stream`.
- **Toggleable Views**: Switch smoothly between the focused **Gemini Argon Chat Wrapper** and the multi-panel **Academic Classroom Workspace**.

## ✨ Key Features
- **Adaptive Grade Tiers**:
  - **Junior Tier (Class 1–5)**: Fun, friendly, voice-first (TTS/STT), animated avatar, big interactive buttons, simplified intuitive vocabulary.
  - **Middle Tier (Class 6–8)**: Guided inquiry, concept analogies, interactive step-by-step help.
  - **Senior Academic Tier (Class 9–12)**: Split-screen academic study workspace with live **KaTeX** LaTeX math/physics rendering, formula sheets, derivation guides, and board/competitive exam tips.
- **3-Stage Socratic Homework Helper**:
  - Stage 1: Concept & Guiding Question 💡
  - Stage 2: Formula & Intermediate Step 📐
  - Stage 3: Full Worked Solution 📝
- **Multimodal Doubt Solver**:
  - Upload handwritten notebook math/science questions or textbook diagrams for instant OCR and conceptual walkthrough.
- **Interactive 5-Question Quiz Generator**:
  - Instant NCERT topic-based MCQ generation with real-time grading, score tracking, and detailed explanations.
- **Multilingual Support**:
  - English, Hinglish, Hindi, and Gujarati.
- **Class-Filtered ChromaDB RAG**:
  - Syllabus-locked retrieval so primary students don't get senior derivations and senior students get rigorous NCERT depth.

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```
Backend runs at `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`.
