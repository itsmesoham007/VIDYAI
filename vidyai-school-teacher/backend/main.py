"""
VidyAI — GSEB English Medium Adaptive School Teacher API
Standards 1 to 12 (GSEB English Medium ONLY)
Powered by official Google Gemini API (gemini-2.5-flash)
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure environment variables are loaded before config imports
_root_dir = Path(__file__).resolve().parent.parent
_root_env = _root_dir / ".env"
_backend_env = Path(__file__).resolve().parent / ".env"
if _root_env.exists():
    load_dotenv(_root_env, override=True)
if _backend_env.exists():
    load_dotenv(_backend_env, override=True)
load_dotenv(override=True)

# Silence ChromaDB telemetry noise and posthog signature mismatches
os.environ["ANONYMIZED_TELEMETRY"] = "False"
os.environ["CHROMA_TELEMETRY"] = "False"
try:
    import posthog
    posthog.capture = lambda *args, **kwargs: None
except Exception:
    pass

import uvicorn
import json
import base64
import requests
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, BackgroundTasks, Query
from fastapi.responses import StreamingResponse, PlainTextResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import exercise_engine

from config import (
    HOST,
    PORT,
    GEMINI_MODEL,
    get_grade_tier,
    get_subjects_for_grade,
    BOARD_NAME,
    BOARD_MEDIUM,
    WHATSAPP_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_VERIFY_TOKEN,
    WHATSAPP_API_VERSION
)
from whatsapp_service import whatsapp_client, process_whatsapp_event
from models import (
    ChatRequest,
    ChatResponse,
    SocraticHintRequest,
    SocraticHintResponse,
    QuizRequest,
    QuizResponse,
    FlashcardsRequest,
    FlashcardsResponse,
    ImageDoubtRequest,
    ImageDoubtResponse,
    ImageGenerationRequest,
    ImageGenerationResponse,
    StudentProfileRequest,
    ChapterMasteryUpdateRequest,
    StudyNoteCreateRequest,
    QuizAttemptRecordRequest,
    CustomExerciseSolveRequest,
    CustomExerciseSolveResponse
)
from teacher_engine import teacher_engine, extract_image_subject, generate_educational_image_url
from rag_pipeline import rag_pipeline
from gseb_downloader import download_all_gseb_books, get_gseb_books_list
from specialized_model import (
    specialized_model_engine,
    generate_gseb_finetuning_dataset,
    check_school_curriculum_scope
)
from portal_db import (
    get_or_create_student,
    update_student_profile,
    get_chapter_mastery,
    update_chapter_status,
    get_study_notes,
    create_study_note,
    delete_study_note,
    toggle_pin_study_note,
    record_quiz_attempt,
    get_quiz_attempts,
    get_portal_stats
)

app = FastAPI(
    title="VidyAI — GSEB English Medium School Teacher API",
    description="Dedicated AI School Teacher API for GSEB (Gujarat Board) English Medium Standards 1 to 12 powered by Google Gemini API.",
    version="2.0.0"
)

# CORS setup for Next.js frontend supporting localhost, public tunnels, and mobile devices
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3005",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3005",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "VidyAI Backend",
        "board": "GSEB (Gujarat Secondary and Higher Secondary Education Board)",
        "medium": "English Medium ONLY",
        "standards_supported": "Standard 1 to 12",
        "status": "active",
        "model": teacher_engine.default_model,
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "board": "GSEB",
        "medium": "English",
        "configured_model": teacher_engine.default_model,
        "gemini_ready": teacher_engine.client is not None,
        "rag_chunks_loaded": len(rag_pipeline.in_memory_docs),
        "chromadb_active": rag_pipeline.collection is not None
    }

@app.get("/api/models")
def get_models():
    return {
        "active_model": teacher_engine.default_model,
        "available_models": [
            {
                "id": "vidyai-gseb-english-specialized-v1",
                "name": "VidyAI GSEB English Medium Teacher (Std 1-12)",
                "description": "Specialized GSEB model strictly grounded in Standards 1 to 12 Gujarat Board English Medium curriculum with KaTeX derivations, Socratic scaffolding, and Board marking rubrics.",
                "is_default": True,
                "supports_reasoning": True,
                "is_specialized": True
            },
            {
                "id": "gemini-3.5-flash",
                "name": "Google Gemini 3.5 Flash",
                "description": "Google's ultra high-speed multimodal reasoning model for live chat, vision, quizzes, and homework hints.",
                "is_default": False,
                "supports_reasoning": True,
                "is_specialized": False
            }
        ],
        "backend_status": "connected" if teacher_engine.client else "simulation",
        "board_supported": "GSEB (Standards 1 to 12 English Medium ONLY)"
    }

@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(payload: ChatRequest):
    try:
        response = teacher_engine.generate_chat_reply(
            messages=payload.messages,
            grade=payload.grade,
            subject=payload.subject,
            topic=payload.topic,
            student_name=payload.student_name,
            language=payload.language,
            socratic_mode=payload.socratic_mode,
            model=payload.model,
            system_prompt_override=payload.system_prompt,
            board="GSEB",
            medium="English"
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/stream")
async def chat_stream_endpoint(payload: ChatRequest):
    """Real-time token streaming wrapper for Gemini queries."""
    try:
        async def event_generator():
            try:
                for chunk in teacher_engine.generate_chat_reply_stream(
                    messages=payload.messages,
                    grade=payload.grade,
                    subject=payload.subject,
                    topic=payload.topic,
                    student_name=payload.student_name,
                    language=payload.language,
                    socratic_mode=payload.socratic_mode,
                    model=payload.model,
                    system_prompt_override=payload.system_prompt,
                    board="GSEB",
                    medium="English"
                ):
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as stream_err:
                yield f"data: {json.dumps({'error': str(stream_err)})}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Model-Used": payload.model or teacher_engine.default_model
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/gseb/books")
def list_gseb_books(grade: Optional[int] = None, standard: Optional[int] = None):
    """Returns list of downloaded GSEB English Medium textbooks for Standards 1 to 12.
    Strict data isolation: If grade or standard is provided, returns ONLY that standard's books."""
    target_std = standard if standard is not None else grade
    books = get_gseb_books_list(standard=target_std)
    if target_std is not None:
        books = [b for b in books if int(b.get("standard") or b.get("grade") or 0) == int(target_std)]
    total_ch = sum(b.get("chapter_count", len(b.get("chapters", []))) for b in books)
    return {
        "status": "success",
        "board": "GSEB",
        "medium": "English",
        "standard": target_std,
        "total_books": len(books),
        "total_chapters": total_ch,
        "books": books
    }

@app.post("/api/gseb/download")
def trigger_gseb_download():
    """Triggers compiling all 47 GSEB English Medium books and re-indexes RAG."""
    result = download_all_gseb_books()
    rag_pipeline.in_memory_docs.clear()
    rag_pipeline.ingest_curriculum()
    return {
        "status": "success",
        "message": f"Successfully compiled {result['total_books']} GSEB English Medium textbooks across Standard 1 to 12 ({result['total_chapters']} chapters).",
        "rag_chunks_loaded": len(rag_pipeline.in_memory_docs),
        "details": result
    }

# ==========================================
# Exercise Zone (Swadhyay) Endpoints
# ==========================================

@app.get("/api/exercises/chapters")
def get_exercise_chapters(grade: int = Query(10), subject: str = Query("Mathematics")):
    """Returns list of chapters for a grade and subject with exercise question counts."""
    chapters = exercise_engine.list_exercise_chapters(grade, subject)
    return {
        "status": "success",
        "grade": grade,
        "subject": subject,
        "total_chapters": len(chapters),
        "chapters": chapters
    }

@app.get("/api/exercises/detail")
def get_exercise_detail(
    grade: int = Query(10), 
    subject: str = Query("Mathematics"), 
    chapter_no: int = Query(1)
):
    """Returns verified exercise questions, options, step-by-step solutions, and board tips."""
    chapter_title, concepts = exercise_engine.get_chapter_title_and_concepts(grade, subject, chapter_no)
    exercises = exercise_engine.get_chapter_exercises(grade, subject, chapter_no)
    total_marks = sum(q.get("marks", 1) for q in exercises)
    return {
        "status": "success",
        "grade": grade,
        "subject": subject,
        "chapter_no": chapter_no,
        "chapter_title": chapter_title,
        "concepts": concepts,
        "total_questions": len(exercises),
        "total_marks": total_marks,
        "exercises": exercises
    }

@app.get("/api/exercises/pdf")
def get_exercise_pdf(
    grade: int = Query(10), 
    subject: str = Query("Mathematics"), 
    chapter_no: int = Query(1)
):
    """Generates and streams an authentic GSEB Textbook Solved Exercise PDF."""
    try:
        pdf_bytes = exercise_engine.generate_exercise_pdf(grade, subject, chapter_no)
        chapter_title, _ = exercise_engine.get_chapter_title_and_concepts(grade, subject, chapter_no)
        clean_title = "".join(c if c.isalnum() else "_" for c in chapter_title)[:30]
        filename = f"GSEB_Std{grade}_{subject}_Ch{chapter_no}_{clean_title}_Exercise.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="{filename}"',
                "Content-Type": "application/pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate exercise PDF: {str(e)}")


@app.post("/api/exercises/solve-custom", response_model=CustomExerciseSolveResponse)
def solve_custom_exercise_endpoint(req: CustomExerciseSolveRequest):
    """
    Solves any custom homework or exercise question submitted by the student.
    Provides Socratic Hint Mode, Notebook-Ready GSEB model answer, Bilingual glossary, and Practice Twin Question.
    """
    try:
        result = teacher_engine.solve_custom_exercise(
            question=req.question,
            grade=req.grade,
            subject=req.subject,
            mode=req.mode,
            include_gujarati=req.include_gujarati if req.include_gujarati is not None else True,
            simple_language=req.simple_language if req.simple_language is not None else False
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Custom exercise solve failed: {str(e)}")



@app.get("/api/model/specialized")
def get_specialized_model_details():
    """Returns specialized GSEB model specifications, dataset path, and capabilities."""
    return specialized_model_engine.get_model_metadata()

@app.post("/api/model/tune")
def trigger_model_tuning_dataset():
    """Generates / exports the GSEB fine-tuning dataset formatted for Gemini Tuning."""
    result = generate_gseb_finetuning_dataset()
    return {
        "status": "success",
        "message": "Specialized GSEB English Medium training dataset generated successfully for Gemini fine-tuning.",
        "dataset_info": result
    }

@app.get("/api/image/generate", response_model=ImageGenerationResponse)
@app.post("/api/image/generate", response_model=ImageGenerationResponse)
def generate_image_endpoint(subject: str = "monkey", grade: int = 10, subject_name: str = "Science"):
    """
    VidyAI Educational Image Generation Tool.
    Generates high-definition, child-safe textbook illustrations for school topics.
    """
    clean_sub = extract_image_subject(subject)
    img_url = generate_educational_image_url(clean_sub)
    return ImageGenerationResponse(
        status="success",
        subject=clean_sub,
        image_url=img_url,
        markdown_tag=f"![{clean_sub.title()}]({img_url})",
        description=f"Educational illustration of {clean_sub.title()} for GSEB Standard {grade} {subject_name}."
    )

@app.post("/api/hint", response_model=SocraticHintResponse)
def socratic_hint_endpoint(payload: SocraticHintRequest):
    try:
        response = teacher_engine.generate_socratic_hint(
            problem_text=payload.problem_text,
            grade=payload.grade,
            subject=payload.subject,
            current_stage=payload.current_stage,
            language=payload.language
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quiz/generate", response_model=QuizResponse)
def generate_quiz_endpoint(payload: QuizRequest):
    try:
        response = teacher_engine.generate_quiz(
            grade=payload.grade,
            subject=payload.subject,
            topic=payload.topic,
            num_questions=payload.num_questions,
            language=payload.language
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/flashcards", response_model=FlashcardsResponse)
def generate_flashcards_endpoint(payload: FlashcardsRequest):
    """Generates revision flashcards strictly for GSEB English Medium curriculum."""
    try:
        response = teacher_engine.generate_flashcards(
            grade=payload.grade,
            subject=payload.subject,
            topic=payload.topic or "",
            num_cards=payload.num_cards or 5,
            language=payload.language or "en"
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/doubt/photo", response_model=ImageDoubtResponse)
async def doubt_photo_upload_endpoint(
    request: Request,
    image: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    grade: Optional[int] = Form(None),
    subject: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    socratic_mode: Optional[bool] = Form(None)
):
    try:
        content_type = request.headers.get("content-type", "")
        raw_b64 = image_base64 or ""
        g = grade if grade is not None else 10
        s = subject or "Physics"
        l = language or "en"
        sm = socratic_mode if socratic_mode is not None else True

        if "application/json" in content_type:
            data = await request.json()
            raw_b64 = data.get("image_base64", "")
            g = data.get("grade", g)
            s = data.get("subject", s)
            l = data.get("language", l)
            sm = data.get("socratic_mode", sm)
        elif image:
            contents = await image.read()
            raw_b64 = base64.b64encode(contents).decode("utf-8")

        if not raw_b64:
            raise HTTPException(status_code=400, detail="No image provided. Please send either file or base64 string.")

        response = teacher_engine.solve_image_doubt(
            image_base64=raw_b64,
            grade=g,
            subject=s,
            language=l,
            socratic_mode=sm
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/curriculum/topics")
def get_curriculum_topics(grade: int = 10, subject: str = "Physics"):
    tier = get_grade_tier(grade)
    available_subjects = get_subjects_for_grade(grade)

    # Detailed GSEB English Medium syllabus topics for every standard and subject
    syllabi = {
        1: {
            "English (First Language)": ["A Happy Child", "Three Little Pigs", "After a Bath", "One Little Kitten", "Merry-Go-Round"],
            "Mathematics": ["Shapes and Space", "Numbers from One to Nine", "Addition (Up to 9)", "Subtraction (Up to 9)", "Numbers from 10 to 20"]
        },
        2: {
            "English (First Language)": ["First Day at School", "Haldi's Adventure", "I am Lucky!", "A Smile", "Rain in the Garden"],
            "Mathematics": ["What is Long, What is Round?", "Counting in Groups", "How Much Can You Carry?", "Counting in Tens", "Patterns Around Us"]
        },
        3: {
            "English (First Language)": ["Good Morning", "The Magic Garden", "Bird Talk", "Nina and Baby Sparrows", "Little by Little"],
            "Mathematics": ["Where to Look From", "Fun with Numbers (3-digit)", "Give and Take (Addition/Subtraction)", "Long and Short", "Shapes and Designs"],
            "Environmental Studies (EVS)": ["Poonam's Day Out", "The Plant Fairy", "Water O' Water!", "Our First School (Family)", "Chhotu's House"]
        },
        4: {
            "English (First Language)": ["Wake Up!", "Neha's Alarm Clock", "Noses", "The Little Fir Tree", "Alice in Wonderland"],
            "Mathematics": ["Building with Bricks", "Long and Short (Kilometers)", "A Trip to Bhopal", "Tick-Tick-Tick (Time)", "The Way The World Looks"],
            "Environmental Studies (EVS)": ["Going to School", "Ear to Ear", "A Day with Nandu (Elephant Herd)", "The Story of Amrita", "Anita and the Honeybees"]
        },
        5: {
            "English (First Language)": ["Ice-Cream Man", "Wonderful Waste!", "Teamwork", "Flying Together", "Robinson Crusoe"],
            "Mathematics": ["The Fish Tale (Large Numbers)", "Shapes and Angles", "How Many Squares? (Area/Perimeter)", "Parts and Wholes (Fractions)", "Does it Look the Same? (Symmetry)"],
            "Environmental Studies (EVS)": ["Super Senses of Animals", "A Snake Charmer's Story", "From Tasting to Digesting", "Mangoes Round the Year", "Seeds and Seeds"]
        },
        6: {
            "English": ["Who Did Patrick's Homework?", "How the Dog Found a Master", "Taro's Reward", "An Indian-American in Space: Kalpana Chawla"],
            "Mathematics": ["Knowing Our Numbers", "Whole Numbers", "Playing with Numbers (HCF/LCM)", "Basic Geometrical Ideas", "Integers"],
            "Science": ["Components of Food", "Sorting Materials into Groups", "Separation of Substances", "Getting to Know Plants", "Body Movements"],
            "Social Science": ["Let Us Know the History", "Primitive Man to Settled Life", "Ancient Towns & Harappa", "The Earth Our Habitat"]
        },
        7: {
            "English": ["Three Questions", "A Gift of Chappals", "Gopal and the Hilsa Fish", "The Rebel"],
            "Mathematics": ["Integers (Multiplication/Division)", "Fractions and Decimals", "Data Handling", "Simple Equations", "Lines and Angles"],
            "Science": ["Nutrition in Plants", "Nutrition in Animals", "Heat & Convection", "Acids, Bases and Salts"],
            "Social Science": ["Rajput Age & Solanki Dynasty", "Delhi Sultanate", "Mughal Empire", "Environment & Settlements"]
        },
        8: {
            "English": ["The Best Christmas Present", "The Tsunami", "Glimpses of the Past", "Geography Lesson"],
            "Mathematics": ["Rational Numbers", "Linear Equations in One Variable", "Understanding Quadrilaterals", "Squares and Square Roots", "Algebraic Identities"],
            "Science": ["Crop Production & Management", "Microorganisms: Friend and Foe", "Coal and Petroleum", "Force and Pressure"],
            "Social Science": ["Arrival of Europeans in India", "Indian Constitution & Dr. Ambedkar", "Natural Resources: Land, Soil, Water", "The Revolt of 1857"]
        },
        9: {
            "English": ["The Fun They Had", "The Sound of Music", "The Little Girl", "The Road Not Taken"],
            "Mathematics": ["Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations in Two Variables", "Lines and Angles"],
            "Science": ["Matter in Our Surroundings", "Is Matter Around Us Pure?", "Atoms and Molecules", "The Fundamental Unit of Life (Cell)", "Motion & Laws of Motion"],
            "Social Science": ["Rise of British Rule in India", "First World War & Russian Revolution", "Indian National Movement", "Physiography of India"],
            "Computer Studies": ["Introduction to Computers", "Generations of Computers", "Operating System Basics", "Word Processing & Spreadsheets"]
        },
        10: {
            "English": ["A Letter to God", "Nelson Mandela: Long Walk to Freedom", "Two Stories about Flying", "Dust of Snow"],
            "Mathematics": ["Real Numbers", "Polynomials", "Pair of Linear Equations", "Quadratic Equations", "Arithmetic Progressions", "Triangles & BPT Theorem", "Introduction to Trigonometry", "Statistics & Probability"],
            "Science": ["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals", "Carbon and its Compounds", "Life Processes", "Light - Reflection and Refraction", "Electricity & Magnetism"],
            "Social Science": ["Heritage of India & Gujarat", "Traditional Handicrafts & Fine Arts", "Architecture and Sculptures", "Economic Liberalization & LPG 1991"],
            "Computer Studies": ["Introduction to HTML", "HTML Lists, Tables and Images", "Cascading Style Sheets (CSS)", "Cyber Security & IT Ethics"]
        },
        11: {
            "Physics": ["Units and Measurements", "Motion in a Straight Line & Plane", "Laws of Motion & Work-Energy", "Gravitation", "Thermodynamics"],
            "Chemistry": ["Some Basic Concepts of Chemistry (Mole Concept)", "Structure of Atom", "Classification of Elements & Periodicity", "Chemical Bonding & Molecular Structure"],
            "Biology": ["The Living World & Classification", "Plant & Animal Kingdom", "Cell: The Unit of Life & Cell Cycle"],
            "Mathematics": ["Sets, Relations and Functions", "Trigonometric Functions", "Complex Numbers & Quadratic Equations", "Permutations and Combinations", "Limits and Derivatives"],
            "English": ["The Portrait of a Lady", "We're Not Afraid to Die...", "Discovering Tut", "A Photograph"],
            "Computer Studies": ["Problem Solving & Python Fundamentals", "Flow of Control in Python", "Strings and Lists in Python"]
        },
        12: {
            "Physics": ["Electric Charges and Fields", "Electrostatic Potential and Capacitance", "Current Electricity", "Moving Charges and Magnetism", "Electromagnetic Induction & AC", "Ray Optics and Wave Optics"],
            "Chemistry": ["Solutions", "Electrochemistry", "Chemical Kinetics", "d and f Block Elements", "Organic Chemistry (Haloalkanes, Alcohols, Aldehydes)"],
            "Biology": ["Reproduction in Organisms & Human Reproduction", "Genetics: Principles of Inheritance", "Molecular Basis of Inheritance (DNA)", "Biotechnology Principles & Processes"],
            "Mathematics": ["Relations and Functions & Inverse Trig", "Matrices & Determinants", "Continuity and Differentiability", "Integrals & Applications", "Differential Equations & 3D Geometry"],
            "English": ["The Last Lesson", "Lost Spring", "Deep Water", "My Mother at Sixty-Six"],
            "Computer Studies": ["OOP in Java", "Java Arrays and String Handling", "Database Management Systems & SQL", "E-Commerce Security"]
        }
    }

    curriculum_for_grade = syllabi.get(grade, {})
    topics = curriculum_for_grade.get(subject, [
        f"{subject} Chapter 1: Core Principles & Definitions",
        f"{subject} Chapter 2: Key Concepts & Theorems",
        f"{subject} Chapter 3: Numerical Problem Solving",
        f"{subject} Chapter 4: GSEB Board Blueprint Revision"
    ])

    return {
        "standard": grade,
        "grade": grade,
        "grade_tier": tier,
        "board": "GSEB",
        "medium": "English",
        "available_subjects": available_subjects,
        "subject": subject,
        "topics": topics
    }

# ============================================================================
# VIDYAI STUDENT PORTAL REST API ENDPOINTS (SQLite Persistent Storage)
# ============================================================================

@app.get("/api/portal/profile")
def portal_get_profile(name: Optional[str] = "Aarav Patel", standard: int = 10):
    """Fetches or registers student profile and updates learning streak."""
    try:
        student = get_or_create_student(name=name or "Aarav Patel", standard=standard)
        return {"status": "success", "student": student}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/portal/profile")
def portal_update_profile(payload: StudentProfileRequest, student_id: Optional[str] = None):
    """Updates student profile parameters and ensures curriculum chapters are seeded."""
    try:
        sid = student_id or f"stu_{(payload.name or 'student').lower().replace(' ', '_')}"
        # Ensure student exists first
        get_or_create_student(name=payload.name, standard=payload.standard, stream=payload.stream or "General")
        updated = update_student_profile(
            student_id=sid,
            name=payload.name,
            standard=payload.standard,
            stream=payload.stream,
            school_name=payload.school_name,
            target_score=payload.target_score,
            daily_target_minutes=payload.daily_target_minutes
        )
        return {"status": "success", "student": updated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/portal/stats")
def portal_get_stats(student_id: str = "stu_student", standard: int = 10):
    """Calculates overall syllabus mastery %, subject breakdown, and learning streaks."""
    try:
        stats = get_portal_stats(student_id=student_id, standard=standard)
        return {"status": "success", "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/portal/mastery")
def portal_get_mastery(student_id: str = "stu_student", standard: int = 10, subject: Optional[str] = None):
    """Retrieves chapter-by-chapter mastery records for GSEB syllabus."""
    try:
        mastery = get_chapter_mastery(student_id=student_id, standard=standard, subject=subject)
        return {
            "status": "success",
            "standard": standard,
            "subject": subject,
            "total_chapters": len(mastery),
            "chapters": mastery
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/portal/mastery/update")
def portal_update_mastery(payload: ChapterMasteryUpdateRequest):
    """Updates status ('not_started', 'in_progress', 'mastered') and confidence score of a chapter."""
    try:
        updated = update_chapter_status(
            student_id=payload.student_id,
            standard=payload.standard,
            subject=payload.subject,
            chapter_no=payload.chapter_no,
            status=payload.status,
            confidence_score=payload.confidence_score
        )
        return {"status": "success", "chapter": updated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/portal/notes")
def portal_get_notes(
    student_id: str = "stu_student",
    standard: Optional[int] = None,
    subject: Optional[str] = None,
    search: Optional[str] = None
):
    """Fetches saved study notes and KaTeX formula sheets."""
    try:
        notes = get_study_notes(student_id=student_id, standard=standard, subject=subject, search=search)
        return {"status": "success", "total": len(notes), "notes": notes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/portal/notes")
def portal_create_note(payload: StudyNoteCreateRequest):
    """Saves a new note or formula derivation into student's notebook."""
    try:
        note = create_study_note(
            student_id=payload.student_id,
            standard=payload.standard,
            subject=payload.subject,
            title=payload.title,
            content=payload.content,
            chapter_title=payload.chapter_title or "",
            tags=payload.tags,
            is_pinned=payload.is_pinned or False
        )
        return {"status": "success", "note": note}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/portal/notes/{note_id}")
def portal_delete_note(note_id: str, student_id: str = "stu_student"):
    """Deletes a study note."""
    try:
        success = delete_study_note(note_id=note_id, student_id=student_id)
        return {"status": "success" if success else "not_found", "deleted": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/portal/notes/{note_id}/pin")
def portal_pin_note(note_id: str, student_id: str = "stu_student"):
    """Toggles the pinned status of a study note."""
    try:
        updated = toggle_pin_study_note(note_id=note_id, student_id=student_id)
        if not updated:
            raise HTTPException(status_code=404, detail="Note not found")
        return {"status": "success", "note": updated}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/portal/quizzes")
def portal_get_quizzes(student_id: str = "stu_student", standard: Optional[int] = None):
    """Fetches past quiz attempts and diagnostic summaries."""
    try:
        quizzes = get_quiz_attempts(student_id=student_id, standard=standard)
        return {"status": "success", "total": len(quizzes), "quizzes": quizzes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/portal/quizzes")
def portal_record_quiz(payload: QuizAttemptRecordRequest):
    """Records a completed quiz or test attempt."""
    try:
        record = record_quiz_attempt(
            student_id=payload.student_id,
            standard=payload.standard,
            subject=payload.subject,
            topic=payload.topic,
            score=payload.score,
            total=payload.total,
            time_taken_seconds=payload.time_taken_seconds or 0,
            mistakes_summary=payload.mistakes_summary or []
        )
        return {"status": "success", "quiz_attempt": record}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Meta WhatsApp Cloud API Webhook Endpoints
# ============================================================================

@app.get("/api/whatsapp/webhook", response_class=PlainTextResponse)
def verify_whatsapp_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
):
    """
    Meta WhatsApp Cloud API Webhook Handshake Verification.
    Triggered when configuring the callback URL in the Meta Developer Portal.
    """
    if hub_mode == "subscribe" and hub_verify_token == WHATSAPP_VERIFY_TOKEN:
        print("[WhatsApp Webhook] Handshake verified successfully!")
        return hub_challenge or ""
    raise HTTPException(status_code=403, detail="Verification token mismatch or invalid mode")

@app.post("/api/whatsapp/webhook")
async def handle_whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Meta WhatsApp Cloud API Inbound Event Receiver.
    Processes incoming text questions, homework photos, and button taps asynchronously
    to guarantee an HTTP 200 OK response within Meta's mandatory 3-second timeout.
    """
    try:
        payload = await request.json()
    except Exception:
        return {"status": "ignored", "reason": "invalid_json"}

    # Process event asynchronously via FastAPI BackgroundTasks
    background_tasks.add_task(process_whatsapp_event, payload)

    return {"status": "received"}

@app.get("/api/whatsapp/status")
def get_whatsapp_status():
    """Returns configuration and health diagnostics for WhatsApp integration."""
    token_preview = f"{WHATSAPP_TOKEN[:12]}...{WHATSAPP_TOKEN[-6:]}" if WHATSAPP_TOKEN else "none"
    return {
        "status": "active",
        "is_configured": whatsapp_client.is_configured,
        "token_preview": token_preview,
        "phone_number_id": WHATSAPP_PHONE_NUMBER_ID,
        "verify_token_set": bool(WHATSAPP_VERIFY_TOKEN),
        "api_version": WHATSAPP_API_VERSION,
        "webhook_endpoint": "/api/whatsapp/webhook"
    }

@app.post("/api/whatsapp/test-send")
def trigger_whatsapp_test_send(to: str = "919429944265"):
    """Sends a test template message directly from the server to verify connectivity."""
    endpoint = f"https://graph.facebook.com/{WHATSAPP_API_VERSION}/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {"Authorization": f"Bearer {WHATSAPP_TOKEN}", "Content-Type": "application/json"}
    clean_to = to.strip().replace("+", "").replace(" ", "")
    payload = {
        "messaging_product": "whatsapp",
        "to": clean_to,
        "type": "template",
        "template": {"name": "hello_world", "language": {"code": "en_US"}}
    }
    resp = requests.post(endpoint, headers=headers, json=payload, timeout=10)
    try:
        data = resp.json()
    except Exception:
        data = resp.text
    return {"status_code": resp.status_code, "meta_response": data}

@app.get("/api/whatsapp/events")
def get_whatsapp_events():
    """Returns the most recent WhatsApp webhook events, outbound logs, and delivery statuses."""
    from whatsapp_service import get_recent_whatsapp_events
    events = get_recent_whatsapp_events()
    return {
        "count": len(events),
        "events": events
    }

@app.post("/api/whatsapp/simulate")
async def simulate_whatsapp_message(
    from_number: str = "919876543210",
    student_name: str = "Test Student",
    text: str = "Can you explain photosynthesis for Class 7?"
):
    """Simulates an incoming WhatsApp message for local testing and debugging."""
    simulated_payload = {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": "SIMULATED_ACCOUNT",
                "changes": [
                    {
                        "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {
                                "display_phone_number": "15550269999",
                                "phone_number_id": "123456789"
                            },
                            "contacts": [
                                {
                                    "profile": {"name": student_name},
                                    "wa_id": from_number
                                }
                            ],
                            "messages": [
                                {
                                    "from": from_number,
                                    "id": f"wamid_test_{os.urandom(4).hex()}",
                                    "timestamp": "1731920000",
                                    "type": "text",
                                    "text": {"body": text}
                                }
                            ]
                        },
                        "field": "messages"
                    }
                ]
            }
        ]
    }
    success = process_whatsapp_event(simulated_payload)
    return {"status": "simulated", "success": success}

if __name__ == "__main__":
    print(f"Starting VidyAI GSEB English Medium Backend on http://{HOST}:{PORT}")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)
