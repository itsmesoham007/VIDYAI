from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message text")
    timestamp: Optional[float] = None

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    student_name: Optional[str] = Field(default=None, description="Name of student to address warmly")
    grade: int = Field(default=10, ge=1, le=12, description="Class / Standard 1 to 12")
    subject: str = Field(default="Physics", description="GSEB English Medium Subject name")
    topic: Optional[str] = Field(default="", description="Specific chapter or syllabus topic")
    language: str = Field(default="en", description="'en', 'hinglish', 'hi', 'gu'")
    socratic_mode: bool = Field(default=True, description="Whether to guide Socratically vs direct answer")
    model: Optional[str] = Field(default="gemini-3.5-flash", description="Gemini model to query (defaults to gemini-3.5-flash)")
    system_prompt: Optional[str] = Field(default=None, description="Optional custom system prompt override")
    stream: Optional[bool] = Field(default=False, description="Enable token streaming")
    board: Optional[str] = Field(default="GSEB", description="Board: strictly GSEB")
    medium: Optional[str] = Field(default="English", description="Medium: strictly English")

class ChatResponse(BaseModel):
    reply: str
    suggested_followups: List[str] = Field(default_factory=list)
    citations: List[str] = Field(default_factory=list)
    grade_tier: str = Field(default="senior")
    model_used: str = Field(default="gemini-3.5-flash")
    board: str = Field(default="GSEB")
    medium: str = Field(default="English")
    is_out_of_scope: bool = Field(default=False)
    image_url: Optional[str] = Field(default=None, description="URL of generated educational illustration")
    action_type: Optional[str] = Field(default=None, description="Action triggered, e.g. 'generate_image'")

class ImageGenerationRequest(BaseModel):
    subject: str = Field(..., description="Subject of the image (e.g. 'monkey', 'elephant', 'solar system')")
    grade: Optional[int] = Field(default=10, ge=1, le=12)
    subject_name: Optional[str] = Field(default="General Science")

class ImageGenerationResponse(BaseModel):
    status: str
    subject: str
    image_url: str
    markdown_tag: str
    description: Optional[str] = None

class SocraticHintRequest(BaseModel):
    problem_text: str = Field(..., description="The homework question or problem statement")
    grade: int = Field(default=10, ge=1, le=12)
    subject: str = Field(default="Physics")
    current_stage: int = Field(default=1, ge=1, le=3, description="1=Concept, 2=Formula/Step, 3=Full Solution")
    language: str = Field(default="en")

class SocraticHintResponse(BaseModel):
    stage: int
    stage_name: str
    hint_content: str
    next_stage_available: bool
    summary_question: Optional[str] = None

class ImageDoubtRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded photo of handwritten/printed problem")
    grade: int = Field(default=10, ge=1, le=12)
    subject: str = Field(default="Mathematics")
    language: str = Field(default="en")
    socratic_mode: bool = Field(default=True)

class ImageDoubtResponse(BaseModel):
    extracted_text: str
    concept_identified: str
    teaching_response: str
    hints: List[str] = Field(default_factory=list)

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_index: int
    explanation: str
    concept: str

class QuizRequest(BaseModel):
    grade: int = Field(default=10, ge=1, le=12)
    subject: str = Field(default="Physics")
    topic: str = Field(default="Electric Charges and Fields")
    num_questions: int = Field(default=5, ge=1, le=10)
    language: str = Field(default="en")

class QuizResponse(BaseModel):
    title: str
    grade: int
    subject: str
    topic: str
    questions: List[QuizQuestion]

class FlashcardItem(BaseModel):
    id: int
    question: str
    answer: str
    category: str
    board_tip: Optional[str] = None

class FlashcardsRequest(BaseModel):
    grade: int = Field(default=10, ge=1, le=12)
    subject: str = Field(default="Physics")
    topic: Optional[str] = Field(default="")
    num_cards: Optional[int] = Field(default=5, ge=1, le=10)
    language: Optional[str] = Field(default="en")

class FlashcardsResponse(BaseModel):
    grade: int
    subject: str
    topic: str
    board: str = "GSEB"
    medium: str = "English"
    flashcards: List[FlashcardItem]

class CurriculumTopic(BaseModel):
    grade: int
    subject: str
    chapters: List[str]

# --- Student Portal Schemas ---
class StudentProfileRequest(BaseModel):
    name: str = Field(default="Aarav Patel")
    standard: int = Field(default=10, ge=1, le=12)
    stream: Optional[str] = Field(default="General")
    school_name: Optional[str] = Field(default="")
    target_score: Optional[int] = Field(default=90, ge=35, le=100)
    daily_target_minutes: Optional[int] = Field(default=45, ge=10, le=360)

class ChapterMasteryUpdateRequest(BaseModel):
    student_id: str
    standard: int = Field(default=10, ge=1, le=12)
    subject: str
    chapter_no: int
    status: str = Field(..., description="'not_started', 'in_progress', 'mastered'")
    confidence_score: Optional[int] = Field(default=None, ge=0, le=100)

class StudyNoteCreateRequest(BaseModel):
    student_id: str
    standard: int = Field(default=10, ge=1, le=12)
    subject: str
    chapter_title: Optional[str] = Field(default="")
    title: str
    content: str
    tags: Optional[List[str]] = Field(default_factory=list)
    is_pinned: Optional[bool] = Field(default=False)

class QuizAttemptRecordRequest(BaseModel):
    student_id: str
    standard: int = Field(default=10, ge=1, le=12)
    subject: str
    topic: str
    score: int
    total: int
    time_taken_seconds: Optional[int] = Field(default=0)
    mistakes_summary: Optional[List[Any]] = Field(default_factory=list)


# --- Custom Homework & Exercise Solver Schemas (Option 1) ---
class CustomExerciseSolveRequest(BaseModel):
    question: str = Field(..., description="The homework question or problem statement")
    grade: int = Field(default=10, ge=1, le=12, description="GSEB Standard 1 to 12")
    subject: str = Field(default="Mathematics", description="Subject name")
    mode: str = Field(default="notebook", description="'hint' (Socratic) or 'notebook' (Exam model answer)")
    include_gujarati: Optional[bool] = Field(default=True, description="Include Gujarati translations for terminology")
    simple_language: Optional[bool] = Field(default=False, description="Simplify vocabulary for younger students")

class BilingualGlossaryItem(BaseModel):
    english_term: str
    gujarati_term: str
    definition: str

class TwinQuestion(BaseModel):
    question: str
    hint: str
    solution: str
    final_answer: str

class CustomExerciseSolveResponse(BaseModel):
    question: str
    grade: int
    subject: str
    mode: str
    solution_steps: List[str]
    model_answer: str
    final_answer: str
    board_tip: Optional[str] = None
    bilingual_glossary: List[BilingualGlossaryItem] = Field(default_factory=list)
    twin_question: Optional[TwinQuestion] = None
    creator_attribution: str = "VidyAI GSEB English Medium • Coded & crafted by Soham Rajpurohit"




