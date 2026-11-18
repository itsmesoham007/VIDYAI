"""
VidyAI — GSEB English Medium Student Portal Database Engine
Lightweight, zero-config SQLite persistence layer for:
- Student Profiles & Learning Streaks
- Chapter Mastery & Syllabus Progress (Standard 1 to 12)
- Saved Study Notes & LaTeX Formula Sheets
- Quiz & Examination History with Diagnostic Tracking
"""

import os
import json
import sqlite3
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

from gseb_catalog_data import GSEB_ENGLISH_CATALOG
from config import get_subjects_for_grade

DB_DIR = Path(__file__).resolve().parent / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "portal.db"

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_portal_db():
    """Initializes the SQLite database tables and indexes."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        standard INTEGER NOT NULL,
        stream TEXT DEFAULT 'General',
        school_name TEXT DEFAULT '',
        target_score INTEGER DEFAULT 90,
        daily_target_minutes INTEGER DEFAULT 45,
        streak_count INTEGER DEFAULT 1,
        last_active_date TEXT,
        created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS chapter_mastery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        standard INTEGER NOT NULL,
        subject TEXT NOT NULL,
        chapter_no INTEGER NOT NULL,
        chapter_title TEXT NOT NULL,
        concepts TEXT DEFAULT '',
        status TEXT DEFAULT 'not_started',
        confidence_score INTEGER DEFAULT 0,
        last_reviewed_at TEXT,
        FOREIGN KEY(student_id) REFERENCES students(id),
        UNIQUE(student_id, standard, subject, chapter_no)
    );

    CREATE INDEX IF NOT EXISTS idx_mastery_student_std ON chapter_mastery(student_id, standard);
    CREATE INDEX IF NOT EXISTS idx_mastery_subject ON chapter_mastery(student_id, standard, subject);

    CREATE TABLE IF NOT EXISTS study_notes (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        standard INTEGER NOT NULL,
        subject TEXT NOT NULL,
        chapter_title TEXT DEFAULT '',
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        is_pinned INTEGER DEFAULT 0,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY(student_id) REFERENCES students(id)
    );

    CREATE INDEX IF NOT EXISTS idx_notes_student ON study_notes(student_id, standard);

    CREATE TABLE IF NOT EXISTS quiz_attempts (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        standard INTEGER NOT NULL,
        subject TEXT NOT NULL,
        topic TEXT NOT NULL,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        time_taken_seconds INTEGER DEFAULT 0,
        mistakes_summary TEXT DEFAULT '[]',
        created_at TEXT,
        FOREIGN KEY(student_id) REFERENCES students(id)
    );

    CREATE INDEX IF NOT EXISTS idx_quizzes_student ON quiz_attempts(student_id, standard);

    CREATE TABLE IF NOT EXISTS whatsapp_sessions (
        wa_id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        name TEXT NOT NULL,
        standard INTEGER DEFAULT 10,
        subject TEXT DEFAULT 'General Science & Math',
        onboarding_step TEXT DEFAULT 'new',
        context_data TEXT DEFAULT '{}',
        last_interaction_at TEXT,
        created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wa_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_wa_messages_wa_id ON whatsapp_messages(wa_id);
    """)

    conn.commit()
    conn.close()

# Initialize DB on module import
init_portal_db()

def _get_today_str() -> str:
    return datetime.date.today().isoformat()

def get_or_create_student(name: str = "Student", standard: int = 10, stream: str = "General") -> Dict[str, Any]:
    """Retrieves or registers a student, updating learning streak."""
    clean_name = (name or "Student").strip()
    student_id = f"stu_{clean_name.lower().replace(' ', '_')}"
    today = _get_today_str()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    row = cursor.fetchone()

    if row is None:
        # Create new student profile
        cursor.execute("""
            INSERT INTO students (id, name, standard, stream, school_name, target_score, daily_target_minutes, streak_count, last_active_date, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (student_id, clean_name, standard, stream, "GSEB English Medium School", 90, 45, 1, today, datetime.datetime.now().isoformat()))
        conn.commit()
        cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
        row = cursor.fetchone()
    else:
        # Update streak
        last_date = row["last_active_date"]
        current_streak = row["streak_count"] or 1
        if last_date:
            try:
                last_dt = datetime.date.fromisoformat(last_date)
                today_dt = datetime.date.today()
                diff_days = (today_dt - last_dt).days
                if diff_days == 1:
                    current_streak += 1
                elif diff_days > 1:
                    current_streak = 1
            except Exception:
                current_streak = 1

        cursor.execute("""
            UPDATE students 
            SET streak_count = ?, last_active_date = ?, standard = ?
            WHERE id = ?
        """, (current_streak, today, standard, student_id))
        conn.commit()
        cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
        row = cursor.fetchone()

    student_data = dict(row)
    conn.close()

    # Pre-seed curriculum chapters for the student's standard
    ensure_chapters_seeded(student_id, standard)
    return student_data

def update_student_profile(
    student_id: str,
    name: Optional[str] = None,
    standard: Optional[int] = None,
    stream: Optional[str] = None,
    school_name: Optional[str] = None,
    target_score: Optional[int] = None,
    daily_target_minutes: Optional[int] = None
) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    updates = []
    params = []
    if name is not None:
        updates.append("name = ?")
        params.append(name.strip())
    if standard is not None:
        updates.append("standard = ?")
        params.append(int(standard))
    if stream is not None:
        updates.append("stream = ?")
        params.append(stream.strip())
    if school_name is not None:
        updates.append("school_name = ?")
        params.append(school_name.strip())
    if target_score is not None:
        updates.append("target_score = ?")
        params.append(int(target_score))
    if daily_target_minutes is not None:
        updates.append("daily_target_minutes = ?")
        params.append(int(daily_target_minutes))

    if updates:
        params.append(student_id)
        query = f"UPDATE students SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, params)
        conn.commit()

    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    row = cursor.fetchone()
    conn.close()

    if row and standard is not None:
        ensure_chapters_seeded(student_id, standard)

    return dict(row) if row else {}

def ensure_chapters_seeded(student_id: str, standard: int):
    """Populates chapter mastery records from GSEB_ENGLISH_CATALOG for the given student & grade."""
    catalog_grade = GSEB_ENGLISH_CATALOG.get(standard)
    if not catalog_grade or not isinstance(catalog_grade, dict):
        return

    books = catalog_grade.get("books", [])
    primary_subjects = get_subjects_for_grade(standard)

    conn = get_db_connection()
    cursor = conn.cursor()

    for book in books:
        subject = book.get("subject", "")
        # Filter to core subjects matching student syllabus
        is_relevant = any(ps.lower() in subject.lower() or subject.lower() in ps.lower() for ps in primary_subjects)
        if not is_relevant and len(books) > 6:
            continue

        chapters = book.get("chapters", [])
        for ch in chapters:
            ch_no = ch.get("no", 1)
            ch_title = ch.get("en", f"Chapter {ch_no}")
            concepts = ch.get("concepts", "")

            cursor.execute("""
                INSERT OR IGNORE INTO chapter_mastery 
                (student_id, standard, subject, chapter_no, chapter_title, concepts, status, confidence_score, last_reviewed_at)
                VALUES (?, ?, ?, ?, ?, ?, 'not_started', 0, NULL)
            """, (student_id, standard, subject, ch_no, ch_title, concepts))

    conn.commit()
    conn.close()

def get_chapter_mastery(student_id: str, standard: int, subject: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetches chapter mastery for a student, optionally filtered by subject."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if subject and subject.strip():
        cursor.execute("""
            SELECT * FROM chapter_mastery 
            WHERE student_id = ? AND standard = ? AND (subject = ? OR subject LIKE ?)
            ORDER BY subject, chapter_no ASC
        """, (student_id, standard, subject.strip(), f"%{subject.strip()}%"))
    else:
        cursor.execute("""
            SELECT * FROM chapter_mastery 
            WHERE student_id = ? AND standard = ?
            ORDER BY subject, chapter_no ASC
        """, (student_id, standard))

    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_chapter_status(
    student_id: str,
    standard: int,
    subject: str,
    chapter_no: int,
    status: str,
    confidence_score: Optional[int] = None
) -> Dict[str, Any]:
    """Updates the status and confidence score of a specific chapter."""
    now_str = datetime.datetime.now().isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()

    if confidence_score is not None:
        cursor.execute("""
            UPDATE chapter_mastery
            SET status = ?, confidence_score = ?, last_reviewed_at = ?
            WHERE student_id = ? AND standard = ? AND (subject = ? OR subject LIKE ?) AND chapter_no = ?
        """, (status, max(0, min(100, confidence_score)), now_str, student_id, standard, subject, f"%{subject}%", chapter_no))
    else:
        cursor.execute("""
            UPDATE chapter_mastery
            SET status = ?, last_reviewed_at = ?
            WHERE student_id = ? AND standard = ? AND (subject = ? OR subject LIKE ?) AND chapter_no = ?
        """, (status, now_str, student_id, standard, subject, f"%{subject}%", chapter_no))

    conn.commit()
    cursor.execute("""
        SELECT * FROM chapter_mastery 
        WHERE student_id = ? AND standard = ? AND (subject = ? OR subject LIKE ?) AND chapter_no = ?
    """, (student_id, standard, subject, f"%{subject}%", chapter_no))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else {}

def get_study_notes(
    student_id: str,
    standard: Optional[int] = None,
    subject: Optional[str] = None,
    search: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Fetches saved notes with KaTeX and Markdown, supporting subject and keyword search."""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM study_notes WHERE student_id = ?"
    params: List[Any] = [student_id]

    if standard is not None:
        query += " AND standard = ?"
        params.append(standard)
    if subject and subject.strip():
        query += " AND (subject = ? OR subject LIKE ?)"
        params.extend([subject.strip(), f"%{subject.strip()}%"])
    if search and search.strip():
        query += " AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)"
        kw = f"%{search.strip()}%"
        params.extend([kw, kw, kw])

    query += " ORDER BY is_pinned DESC, created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        try:
            d["tags"] = json.loads(d["tags"])
        except Exception:
            d["tags"] = []
        result.append(d)
    return result

def create_study_note(
    student_id: str,
    standard: int,
    subject: str,
    title: str,
    content: str,
    chapter_title: str = "",
    tags: Optional[List[str]] = None,
    is_pinned: bool = False
) -> Dict[str, Any]:
    """Saves a revision note or formula sheet into the student's notebook."""
    note_id = f"note_{int(datetime.datetime.now().timestamp() * 1000)}"
    now_str = datetime.datetime.now().isoformat()
    tags_json = json.dumps(tags or ["Revision", subject])

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO study_notes 
        (id, student_id, standard, subject, chapter_title, title, content, tags, is_pinned, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (note_id, student_id, standard, subject, chapter_title, title.strip(), content.strip(), tags_json, 1 if is_pinned else 0, now_str, now_str))
    conn.commit()

    cursor.execute("SELECT * FROM study_notes WHERE id = ?", (note_id,))
    row = cursor.fetchone()
    conn.close()

    res = dict(row)
    res["tags"] = tags or ["Revision", subject]
    return res

def delete_study_note(note_id: str, student_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM study_notes WHERE id = ? AND student_id = ?", (note_id, student_id))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def toggle_pin_study_note(note_id: str, student_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT is_pinned FROM study_notes WHERE id = ? AND student_id = ?", (note_id, student_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    new_pin = 0 if row["is_pinned"] else 1
    cursor.execute("UPDATE study_notes SET is_pinned = ? WHERE id = ? AND student_id = ?", (new_pin, note_id, student_id))
    conn.commit()

    cursor.execute("SELECT * FROM study_notes WHERE id = ?", (note_id,))
    updated_row = cursor.fetchone()
    conn.close()
    if not updated_row:
        return None
    res = dict(updated_row)
    try:
        res["tags"] = json.loads(res["tags"])
    except Exception:
        res["tags"] = []
    return res

def record_quiz_attempt(
    student_id: str,
    standard: int,
    subject: str,
    topic: str,
    score: int,
    total: int,
    time_taken_seconds: int = 0,
    mistakes_summary: Optional[List[Any]] = None
) -> Dict[str, Any]:
    """Records a completed quiz or test attempt."""
    attempt_id = f"quiz_{int(datetime.datetime.now().timestamp() * 1000)}"
    now_str = datetime.datetime.now().isoformat()
    mistakes_json = json.dumps(mistakes_summary or [])

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO quiz_attempts
        (id, student_id, standard, subject, topic, score, total, time_taken_seconds, mistakes_summary, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (attempt_id, student_id, standard, subject, topic, score, total, time_taken_seconds, mistakes_json, now_str))

    # Also update confidence score in chapter mastery if matching topic found
    pct = int((score / total) * 100) if total > 0 else 0
    cursor.execute("""
        UPDATE chapter_mastery
        SET confidence_score = MAX(confidence_score, ?),
            status = CASE 
                WHEN ? >= 80 THEN 'mastered' 
                WHEN ? >= 40 THEN 'in_progress' 
                ELSE status 
            END,
            last_reviewed_at = ?
        WHERE student_id = ? AND standard = ? AND (chapter_title LIKE ? OR subject LIKE ?)
    """, (pct, pct, pct, now_str, student_id, standard, f"%{topic}%", f"%{subject}%"))

    conn.commit()
    cursor.execute("SELECT * FROM quiz_attempts WHERE id = ?", (attempt_id,))
    row = cursor.fetchone()
    conn.close()

    res = dict(row)
    res["mistakes_summary"] = mistakes_summary or []
    return res

def get_quiz_attempts(student_id: str, standard: Optional[int] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    if standard is not None:
        cursor.execute("""
            SELECT * FROM quiz_attempts 
            WHERE student_id = ? AND standard = ?
            ORDER BY created_at DESC LIMIT 20
        """, (student_id, standard))
    else:
        cursor.execute("""
            SELECT * FROM quiz_attempts 
            WHERE student_id = ? 
            ORDER BY created_at DESC LIMIT 20
        """, (student_id,))

    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        try:
            d["mistakes_summary"] = json.loads(d["mistakes_summary"])
        except Exception:
            d["mistakes_summary"] = []
        result.append(d)
    return result

def get_portal_stats(student_id: str, standard: int) -> Dict[str, Any]:
    """Computes comprehensive syllabus mastery stats for the student dashboard."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    student_row = cursor.fetchone()
    student = dict(student_row) if student_row else {
        "id": student_id,
        "name": "Student",
        "standard": standard,
        "streak_count": 1,
        "target_score": 90,
        "daily_target_minutes": 45
    }

    # Subject breakdown
    cursor.execute("""
        SELECT subject,
               COUNT(*) as total_chapters,
               SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) as mastered_chapters,
               SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_chapters,
               AVG(confidence_score) as avg_confidence
        FROM chapter_mastery
        WHERE student_id = ? AND standard = ?
        GROUP BY subject
    """, (student_id, standard))
    subject_rows = cursor.fetchall()

    subjects_stats = []
    total_chapters_all = 0
    mastered_chapters_all = 0

    for sr in subject_rows:
        total = sr["total_chapters"] or 0
        mastered = sr["mastered_chapters"] or 0
        in_prog = sr["in_progress_chapters"] or 0
        conf = round(sr["avg_confidence"] or 0, 1)

        total_chapters_all += total
        mastered_chapters_all += mastered

        pct = int((mastered / total) * 100) if total > 0 else 0
        subjects_stats.append({
            "subject": sr["subject"],
            "total_chapters": total,
            "mastered_chapters": mastered,
            "in_progress_chapters": in_prog,
            "completion_percentage": pct,
            "average_confidence": conf
        })

    # Total notes count
    cursor.execute("SELECT COUNT(*) as count FROM study_notes WHERE student_id = ?", (student_id,))
    notes_count = cursor.fetchone()["count"]

    # Quizzes taken & average score
    cursor.execute("SELECT COUNT(*) as count, AVG(score * 100.0 / total) as avg_score FROM quiz_attempts WHERE student_id = ?", (student_id,))
    quiz_stat = cursor.fetchone()
    quizzes_count = quiz_stat["count"] or 0
    avg_quiz_score = round(quiz_stat["avg_score"] or 0, 1)

    overall_pct = int((mastered_chapters_all / total_chapters_all) * 100) if total_chapters_all > 0 else 0

    conn.close()

    return {
        "student": student,
        "standard": standard,
        "overall_completion_percentage": overall_pct,
        "total_chapters": total_chapters_all,
        "mastered_chapters": mastered_chapters_all,
        "subjects": subjects_stats,
        "notes_count": notes_count,
        "quizzes_taken": quizzes_count,
        "average_quiz_score": avg_quiz_score,
        "daily_streak": student.get("streak_count", 1)
    }


# -------------------------------------------------------------
# WhatsApp Student Session & Message Persistence
# -------------------------------------------------------------

def get_or_create_whatsapp_session(wa_id: str, profile_name: Optional[str] = None) -> Dict[str, Any]:
    """Retrieves or creates a WhatsApp student session."""
    clean_wa_id = str(wa_id).strip()
    student_id = f"wa_{clean_wa_id}"
    fallback_name = profile_name.strip() if profile_name and profile_name.strip() else "Student"
    now_str = datetime.datetime.now().isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM whatsapp_sessions WHERE wa_id = ?", (clean_wa_id,))
    row = cursor.fetchone()

    if row is None:
        # Also ensure student exists in students table
        cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
        stu_row = cursor.fetchone()
        if stu_row is None:
            cursor.execute("""
                INSERT INTO students (id, name, standard, stream, school_name, target_score, daily_target_minutes, streak_count, last_active_date, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (student_id, fallback_name, 10, "General", "GSEB English Medium (WhatsApp)", 90, 45, 1, _get_today_str(), now_str))

        cursor.execute("""
            INSERT INTO whatsapp_sessions (wa_id, student_id, name, standard, subject, onboarding_step, context_data, last_interaction_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (clean_wa_id, student_id, fallback_name, 10, "General Science & Math", "new", "{}", now_str, now_str))
        conn.commit()
        cursor.execute("SELECT * FROM whatsapp_sessions WHERE wa_id = ?", (clean_wa_id,))
        row = cursor.fetchone()
    else:
        # Update last interaction timestamp
        cursor.execute("UPDATE whatsapp_sessions SET last_interaction_at = ? WHERE wa_id = ?", (now_str, clean_wa_id))
        conn.commit()
        cursor.execute("SELECT * FROM whatsapp_sessions WHERE wa_id = ?", (clean_wa_id,))
        row = cursor.fetchone()

    session_data = dict(row)
    conn.close()

    # Ensure chapters are seeded
    ensure_chapters_seeded(student_id, session_data.get("standard", 10))
    return session_data


def update_whatsapp_session(
    wa_id: str,
    name: Optional[str] = None,
    standard: Optional[int] = None,
    subject: Optional[str] = None,
    onboarding_step: Optional[str] = None,
    context_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Updates WhatsApp student session state and synchronizes student profile."""
    clean_wa_id = str(wa_id).strip()
    now_str = datetime.datetime.now().isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()

    updates = ["last_interaction_at = ?"]
    params = [now_str]

    if name is not None:
        updates.append("name = ?")
        params.append(name.strip())
    if standard is not None:
        updates.append("standard = ?")
        params.append(int(standard))
    if subject is not None:
        updates.append("subject = ?")
        params.append(subject.strip())
    if onboarding_step is not None:
        updates.append("onboarding_step = ?")
        params.append(onboarding_step)
    if context_data is not None:
        updates.append("context_data = ?")
        params.append(json.dumps(context_data))

    params.append(clean_wa_id)
    cursor.execute(f"UPDATE whatsapp_sessions SET {', '.join(updates)} WHERE wa_id = ?", tuple(params))
    conn.commit()

    # Also keep student table in sync
    cursor.execute("SELECT * FROM whatsapp_sessions WHERE wa_id = ?", (clean_wa_id,))
    row = cursor.fetchone()
    if row:
        session_data = dict(row)
        student_id = session_data["student_id"]
        cursor.execute("""
            UPDATE students SET name = ?, standard = ?, last_active_date = ? WHERE id = ?
        """, (session_data["name"], session_data["standard"], _get_today_str(), student_id))
        conn.commit()
        conn.close()
        ensure_chapters_seeded(student_id, session_data["standard"])
        return session_data

    conn.close()
    return {}


def save_whatsapp_message(wa_id: str, role: str, content: str):
    """Saves a conversation turn into SQLite for WhatsApp history context."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO whatsapp_messages (wa_id, role, content, created_at)
        VALUES (?, ?, ?, ?)
    """, (str(wa_id).strip(), role, content, datetime.datetime.now().isoformat()))
    conn.commit()
    conn.close()


def get_whatsapp_conversation_history(wa_id: str, limit: int = 6) -> List[Dict[str, str]]:
    """Retrieves recent conversation history for a student on WhatsApp."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT role, content FROM whatsapp_messages
        WHERE wa_id = ?
        ORDER BY id DESC LIMIT ?
    """, (str(wa_id).strip(), limit))
    rows = cursor.fetchall()
    conn.close()
    return [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]


def clear_whatsapp_conversation_history(wa_id: str):
    """Clears history for a student to reset context."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM whatsapp_messages WHERE wa_id = ?", (str(wa_id).strip(),))
    conn.commit()
    conn.close()

