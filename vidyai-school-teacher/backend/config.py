import os
from pathlib import Path
from typing import List, Dict
from dotenv import load_dotenv

# Load .env from root or backend directory with override=True
root_dir = Path(__file__).resolve().parent.parent
backend_env = Path(__file__).resolve().parent / ".env"
root_env = root_dir / ".env"

if root_env.exists():
    load_dotenv(root_env, override=True)
if backend_env.exists():
    load_dotenv(backend_env, override=True)
load_dotenv(override=True)

# API Keys & Service Config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
GEMINI_FALLBACK_MODELS = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-3-flash-preview", "gemini-flash-lite-latest"]
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-004")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
CHROMA_DB_DIR = os.getenv("CHROMA_DB_DIR", str(root_dir / "backend" / "chroma_data"))
CURRICULUM_DIR = str(root_dir / "curriculum_pdfs")

# Meta WhatsApp Cloud API Configuration
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "vidyai_whatsapp_verify_token")
WHATSAPP_API_VERSION = os.getenv("WHATSAPP_API_VERSION", "v21.0")

# Board and Medium Specification (Strict Non-Negotiable)
BOARD_NAME = "GSEB"  # Gujarat Secondary and Higher Secondary Education Board
BOARD_MEDIUM = "English"  # GSEB English Medium ONLY

# Grade Tiers
TIER_PRIMARY = "primary"   # Standard 1 - 5
TIER_MIDDLE = "middle"     # Standard 6 - 8
TIER_SENIOR = "senior"     # Standard 9 - 12

def get_grade_tier(grade: int) -> str:
    if 1 <= grade <= 5:
        return TIER_PRIMARY
    elif 6 <= grade <= 8:
        return TIER_MIDDLE
    else:
        return TIER_SENIOR

# Tier-based Personas & Cognitive Guidelines for VidyAI GSEB English Medium
TIER_PERSONAS = {
    TIER_PRIMARY: {
        "name": "VidyAI (Primary School Teacher)",
        "style": (
            "You are 'VidyAI', an expert GSEB English Medium Primary School Teacher for Class {grade}. "
            "Explain concepts warmly, patiently, and visually using simple everyday English words, "
            "joyful emojis (🌟, 🍎, 🚀, 🎈), friendly analogies (fruits, toys, animals, everyday objects), "
            "and short bite-sized sentences suitable for young learners. "
            "Always encourage the student with praise like 'Wah! Superstar!', 'Great effort!', 'Spot on!'."
        ),
        "latex_allowed": False
    },
    TIER_MIDDLE: {
        "name": "VidyAI (Middle School Teacher)",
        "style": (
            "You are 'VidyAI', an expert GSEB English Medium Middle School Teacher for Standard {grade}. "
            "Explain concepts clearly and step-by-step using standard GSEB & NCERT definitions, guided inquiry, "
            "and real-world examples. Help the student deduce principles by understanding cause-and-effect "
            "and practical observations."
        ),
        "latex_allowed": True
    },
    TIER_SENIOR: {
        "name": "VidyAI (Senior Board & Academic Mentor)",
        "style": (
            "You are 'VidyAI', an expert GSEB English Medium Senior Secondary School Teacher and Board Mentor for Standard {grade}. "
            "Be conceptually rigorous, academically precise, and exam-focused. "
            "Provide thorough mathematical derivations, physics equations, and chemical notations using KaTeX ($...$ inline and $$...$$ block). "
            "Highlight GSEB Board blueprints, Section A/B/C/D marking criteria, numerical problem-solving steps, and high-yield examination tips."
        ),
        "latex_allowed": True
    }
}

LANGUAGE_INSTRUCTIONS = {
    "en": "Respond purely in clear, fluent English suitable for GSEB English Medium students.",
    "hinglish": "Respond in natural Indian Hinglish (a warm mix of Hindi & English written in Latin script) while retaining all formal GSEB English textbook terminology.",
    "hi": "Respond in polite Hindi in Devanagari script while keeping core scientific/mathematical terms clear in English.",
    "gu": "Respond in polite Gujarati script while keeping core GSEB textbook terms and English syllabus definitions clear."
}

# Core GSEB English Medium Subjects by Standard (Class 1 to 12)
def get_subjects_for_grade(grade: int) -> List[str]:
    """
    Returns the exact GSEB English Medium subjects for the given standard (1 to 12).
    - Std 1 to 2: English (First Language), Mathematics
    - Std 3 to 5: English (First Language), Mathematics, Environmental Studies (EVS)
    - Std 6 to 8: English, Mathematics, Science, Social Science
    - Std 9 to 10: English, Mathematics, Science, Social Science, Computer Studies
    - Std 11 to 12: Physics, Chemistry, Biology, Mathematics, English, Computer Studies
    """
    if grade in (1, 2):
        return ["English (First Language)", "Mathematics"]
    elif 3 <= grade <= 5:
        return ["English (First Language)", "Mathematics", "Environmental Studies (EVS)"]
    elif 6 <= grade <= 8:
        return ["English", "Mathematics", "Science", "Social Science"]
    elif 9 <= grade <= 10:
        return ["English", "Mathematics", "Science", "Social Science", "Computer Studies"]
    elif 11 <= grade <= 12:
        return ["Physics", "Chemistry", "Biology", "Mathematics", "English", "Computer Studies"]
    return ["English", "Mathematics", "Science"]

SUBJECTS_BY_GRADE: Dict[str, List[str]] = {
    "primary": ["English (First Language)", "Mathematics", "Environmental Studies (EVS)"],
    "middle": ["English", "Mathematics", "Science", "Social Science"],
    "senior": ["Physics", "Chemistry", "Biology", "Mathematics", "English", "Computer Studies"]
}
