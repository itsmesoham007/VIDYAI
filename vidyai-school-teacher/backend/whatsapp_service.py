"""
VidyAI — Meta WhatsApp Cloud API Service
Direct integration with official Meta Cloud API (100% Free Development & Tier-1 Production).
Provides:
- WhatsApp-friendly text & math formatting (Unicode math, clean markdown)
- Bi-directional Meta Graph API messaging (Text, Interactive Buttons, Lists)
- Media download for Homework / Textbook Photo Doubts
- Session tracking and conversational memory powered by VidyAI Teacher Engine
"""

import os
import re
import json
import base64
import requests
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from collections import deque

from config import (
    WHATSAPP_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_VERIFY_TOKEN,
    WHATSAPP_API_VERSION,
    get_subjects_for_grade
)
from models import ChatMessage
from portal_db import (
    get_or_create_whatsapp_session,
    update_whatsapp_session,
    save_whatsapp_message,
    get_whatsapp_conversation_history,
    clear_whatsapp_conversation_history
)
from teacher_engine import teacher_engine

# Meta Graph API Base URL
GRAPH_API_URL = f"https://graph.facebook.com/{WHATSAPP_API_VERSION}"

# Cache of recently processed message IDs (avoids duplicate processing on webhook retries)
_PROCESSED_MESSAGE_IDS = deque(maxlen=2000)

# In-memory diagnostics event buffer (stores recent inbound & outbound events and Meta delivery statuses)
_RECENT_EVENTS = deque(maxlen=100)

def log_whatsapp_event(event_type: str, data: Dict[str, Any]):
    """Records an internal WhatsApp event with ISO timestamp."""
    _RECENT_EVENTS.append({
        "timestamp": datetime.utcnow().isoformat(),
        "type": event_type,
        "data": data
    })

def get_recent_whatsapp_events() -> List[Dict[str, Any]]:
    """Returns a list of recent webhook events, delivery receipts, and outbound logs."""
    return list(_RECENT_EVENTS)


# ============================================================================
# 1. TEXT & MATH FORMATTING FOR WHATSAPP
# ============================================================================

def format_for_whatsapp(text: str) -> str:
    """
    Transforms Markdown and LaTeX math equations into clean, readable WhatsApp text.
    WhatsApp does not natively render LaTeX ($...$), so we convert common math
    notations into Unicode superscripts, subscripts, fractions, and symbols,
    and convert standard markdown bold (**) into WhatsApp bold (*).
    """
    if not text:
        return ""

    s = text

    # Strip markdown code fences if they wrap the whole message or math
    s = re.sub(r'```(?:latex|markdown|text)?\n([\s\S]*?)\n```', r'\1', s)

    # 1. Replace block math delimiters: $$...$$ or \[...\]
    def _clean_math_block(match):
        expr = match.group(1).strip()
        return "\n" + _latex_to_unicode(expr) + "\n"

    s = re.sub(r'\$\$(.+?)\$\$', _clean_math_block, s, flags=re.DOTALL)
    s = re.sub(r'\\\[(.+?)\\\]', _clean_math_block, s, flags=re.DOTALL)

    # 2. Replace inline math delimiters: $...$ or \(...\)
    def _clean_math_inline(match):
        expr = match.group(1).strip()
        return _latex_to_unicode(expr)

    s = re.sub(r'\$([^\$\n]+?)\$', _clean_math_inline, s)
    s = re.sub(r'\\\(([^\n]+?)\\\)', _clean_math_inline, s)

    # 3. Clean headers (### Header -> *Header*)
    s = re.sub(r'^(?:#{1,6})\s*(.+)$', r'*\1*', s, flags=re.MULTILINE)

    # 4. Convert markdown bold (**bold**) to WhatsApp bold (*bold*)
    s = re.sub(r'\*\*([^*]+?)\*\*', r'*\1*', s)

    # 5. Clean bullet points: '*' or '-' at line starts -> '• '
    s = re.sub(r'^\s*[-*]\s+', '• ', s, flags=re.MULTILINE)

    # 6. Clean escaped dollar signs or brackets
    s = s.replace(r'\$', '$').replace(r'\_', '_').replace(r'\*', '*')

    # 7. Collapse excess blank lines (max 2 consecutive newlines)
    s = re.sub(r'\n{3,}', '\n\n', s)

    return s.strip()


def _latex_to_unicode(expr: str) -> str:
    """Helper to convert standard LaTeX math symbols and powers to Unicode."""
    out = expr

    # Fractions: \frac{num}{den} with support for nested braces
    while r'\frac' in out:
        idx = out.find(r'\frac')
        open1 = out.find('{', idx)
        if open1 == -1:
            out = out[:idx] + out[idx + 5:]
            break
        depth = 1
        pos1 = open1 + 1
        while pos1 < len(out) and depth > 0:
            if out[pos1] == '{':
                depth += 1
            elif out[pos1] == '}':
                depth -= 1
            pos1 += 1
        if depth != 0:
            out = out[:idx] + out[idx + 5:]
            break
        num = out[open1 + 1:pos1 - 1]

        open2 = out.find('{', pos1)
        if open2 == -1:
            out = out[:idx] + num + out[pos1:]
            break
        depth = 1
        pos2 = open2 + 1
        while pos2 < len(out) and depth > 0:
            if out[pos2] == '{':
                depth += 1
            elif out[pos2] == '}':
                depth -= 1
            pos2 += 1
        if depth != 0:
            out = out[:idx] + num + out[pos1:]
            break
        den = out[open2 + 1:pos2 - 1]
        out = out[:idx] + f"({num})/({den})" + out[pos2:]

    # Square roots: \sqrt{...} with support for nested braces
    while r'\sqrt{' in out:
        idx = out.find(r'\sqrt{')
        open_pos = idx + 5
        depth = 1
        pos = open_pos + 1
        while pos < len(out) and depth > 0:
            if out[pos] == '{':
                depth += 1
            elif out[pos] == '}':
                depth -= 1
            pos += 1
        if depth == 0:
            inner = out[open_pos + 1:pos - 1]
            out = out[:idx] + f"√({inner})" + out[pos:]
        else:
            out = out[:idx] + "√" + out[open_pos:]
    out = out.replace(r'\sqrt', '√')

    # Common LaTeX greek and math operators
    replacements = [
        (r'\times', '×'),
        (r'\div', '÷'),
        (r'\pm', '±'),
        (r'\approx', '≈'),
        (r'\neq', '≠'),
        (r'\le', '≤'),
        (r'\leq', '≤'),
        (r'\ge', '≥'),
        (r'\geq', '≥'),
        (r'\pi', 'π'),
        (r'\theta', 'θ'),
        (r'\alpha', 'α'),
        (r'\beta', 'β'),
        (r'\gamma', 'γ'),
        (r'\Delta', 'Δ'),
        (r'\delta', 'δ'),
        (r'\lambda', 'λ'),
        (r'\mu', 'µ'),
        (r'\sigma', 'σ'),
        (r'\infty', '∞'),
        (r'\rightarrow', '→'),
        (r'\to', '→'),
        (r'\in', '∈'),
        (r'\cdot', '·'),
        (r'\degree', '°'),
        (r'^\circ', '°'),
        (r'\quad', ' '),
        (r'\qquad', '  '),
        (r'\,', ' '),
    ]
    for tex, uni in replacements:
        out = out.replace(tex, uni)

    # Superscripts: ^2 -> ², ^3 -> ³, ^0..9
    sup_map = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
        'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ'
    }
    for k, v in sup_map.items():
        out = out.replace(f'^{k}', v)
        out = out.replace(f'^{{{k}}}', v)

    # Subscripts: _0..9
    sub_map = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
        '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
        'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ'
    }
    for k, v in sub_map.items():
        out = out.replace(f'_{k}', v)
        out = out.replace(f'_{{{k}}}', v)

    # Remove remaining curly braces around standalone expressions
    out = re.sub(r'\{([^{}]+)\}', r'\1', out)

    return out


def split_message_chunks(text: str, max_length: int = 3800) -> List[str]:
    """
    Splits long messages at paragraph or sentence breaks so they fit safely within
    WhatsApp's 4096 character limit.
    """
    if len(text) <= max_length:
        return [text]

    chunks = []
    current_chunk = []
    current_length = 0

    paragraphs = text.split("\n\n")
    for para in paragraphs:
        if current_length + len(para) + 2 > max_length:
            if current_chunk:
                chunks.append("\n\n".join(current_chunk).strip())
                current_chunk = []
                current_length = 0

            # If a single paragraph is longer than max_length, split by newlines or sentences
            if len(para) > max_length:
                sentences = re.split(r'([.?!]\s+)', para)
                sub_chunk = []
                sub_len = 0
                for s in sentences:
                    if sub_len + len(s) > max_length and sub_chunk:
                        chunks.append("".join(sub_chunk).strip())
                        sub_chunk = []
                        sub_len = 0
                    sub_chunk.append(s)
                    sub_len += len(s)
                if sub_chunk:
                    chunks.append("".join(sub_chunk).strip())
            else:
                current_chunk.append(para)
                current_length += len(para) + 2
        else:
            current_chunk.append(para)
            current_length += len(para) + 2

    if current_chunk:
        chunks.append("\n\n".join(current_chunk).strip())

    return chunks


# ============================================================================
# 2. WHATSAPP CLOUD API CLIENT
# ============================================================================

class WhatsAppClient:
    """Official Meta WhatsApp Cloud API Client with zero third-party dependencies."""

    def __init__(self, token: Optional[str] = None, phone_number_id: Optional[str] = None):
        self.token = token or WHATSAPP_TOKEN
        self.phone_number_id = phone_number_id or WHATSAPP_PHONE_NUMBER_ID

    @property
    def is_configured(self) -> bool:
        return bool(self.token and self.phone_number_id)

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def send_text_message(
        self,
        to: str,
        text: str,
        preview_url: bool = False,
        reply_to_message_id: Optional[str] = None
    ) -> bool:
        """Sends a text message to a WhatsApp number."""
        if not self.is_configured:
            print(f"[WhatsAppClient] Mock send to {to}: {text[:80]}...")
            return False

        clean_to = re.sub(r'[^0-9]', '', str(to))
        formatted = format_for_whatsapp(text)
        chunks = split_message_chunks(formatted)

        endpoint = f"{GRAPH_API_URL}/{self.phone_number_id}/messages"
        headers = self._get_headers()

        all_success = True
        for idx, chunk in enumerate(chunks):
            payload: Dict[str, Any] = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": clean_to,
                "type": "text",
                "text": {
                    "preview_url": preview_url,
                    "body": chunk
                }
            }
            if idx == 0 and reply_to_message_id:
                payload["context"] = {"message_id": reply_to_message_id}

            try:
                resp = requests.post(endpoint, headers=headers, json=payload, timeout=12)
                resp_data: Any = {}
                try:
                    resp_data = resp.json()
                except Exception:
                    resp_data = {"raw": resp.text[:200]}

                log_whatsapp_event("outbound_text_attempt", {
                    "to": clean_to,
                    "status_code": resp.status_code,
                    "meta_response": resp_data,
                    "preview": chunk[:80]
                })

                if resp.status_code not in (200, 201):
                    print(f"[WhatsAppClient Error] HTTP {resp.status_code}: {resp.text}")
                    all_success = False
            except Exception as e:
                log_whatsapp_event("outbound_text_exception", {"to": clean_to, "error": str(e)})
                print(f"[WhatsAppClient Exception] Failed to send message chunk: {e}")
                all_success = False

        return all_success

    def mark_as_read(self, message_id: str) -> bool:
        """Marks an incoming message as read (blue ticks)."""
        if not self.is_configured or not message_id:
            return False

        endpoint = f"{GRAPH_API_URL}/{self.phone_number_id}/messages"
        headers = self._get_headers()
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id
        }
        try:
            resp = requests.post(endpoint, headers=headers, json=payload, timeout=5)
            return resp.status_code in (200, 201)
        except Exception:
            return False

    def send_interactive_buttons(
        self,
        to: str,
        body_text: str,
        buttons: List[Tuple[str, str]],
        header_text: Optional[str] = None,
        footer_text: Optional[str] = "VidyAI • GSEB English Medium"
    ) -> bool:
        """
        Sends an interactive quick-reply button message (up to 3 buttons).
        buttons: list of (button_id, button_title) tuples.
        """
        if not self.is_configured:
            print(f"[WhatsAppClient Mock Buttons] to {to}: {[b[1] for b in buttons]}")
            return False

        clean_to = re.sub(r'[^0-9]', '', str(to))
        # WhatsApp limits interactive buttons to 3 max
        button_elements = [
            {
                "type": "reply",
                "reply": {
                    "id": b[0][:256],
                    "title": b[1][:20]
                }
            }
            for b in buttons[:3]
        ]

        interactive_payload: Dict[str, Any] = {
            "type": "button",
            "body": {"text": format_for_whatsapp(body_text)},
            "action": {"buttons": button_elements}
        }
        if header_text:
            interactive_payload["header"] = {"type": "text", "text": header_text[:60]}
        if footer_text:
            interactive_payload["footer"] = {"text": footer_text[:60]}

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_to,
            "type": "interactive",
            "interactive": interactive_payload
        }

        endpoint = f"{GRAPH_API_URL}/{self.phone_number_id}/messages"
        try:
            resp = requests.post(endpoint, headers=self._get_headers(), json=payload, timeout=10)
            return resp.status_code in (200, 201)
        except Exception as e:
            print(f"[WhatsAppClient Exception] send_interactive_buttons failed: {e}")
            return False

    def send_interactive_list(
        self,
        to: str,
        body_text: str,
        button_label: str,
        sections: List[Dict[str, Any]],
        header_text: Optional[str] = None,
        footer_text: Optional[str] = "VidyAI • GSEB English Medium"
    ) -> bool:
        """
        Sends an interactive list message (Meta allows up to 10 rows total).
        sections format:
        [
            {
                "title": "Section Title",
                "rows": [{"id": "row_id", "title": "Row Title", "description": "optional"}]
            }
        ]
        """
        if not self.is_configured:
            print(f"[WhatsAppClient Mock List] to {to}: {button_label}")
            return False

        clean_to = re.sub(r'[^0-9]', '', str(to))
        interactive_payload: Dict[str, Any] = {
            "type": "list",
            "body": {"text": format_for_whatsapp(body_text)},
            "action": {
                "button": button_label[:20],
                "sections": sections
            }
        }
        if header_text:
            interactive_payload["header"] = {"type": "text", "text": header_text[:60]}
        if footer_text:
            interactive_payload["footer"] = {"text": footer_text[:60]}

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_to,
            "type": "interactive",
            "interactive": interactive_payload
        }

        endpoint = f"{GRAPH_API_URL}/{self.phone_number_id}/messages"
        try:
            resp = requests.post(endpoint, headers=self._get_headers(), json=payload, timeout=10)
            return resp.status_code in (200, 201)
        except Exception as e:
            print(f"[WhatsAppClient Exception] send_interactive_list failed: {e}")
            return False

    def download_media(self, media_id: str) -> Tuple[Optional[bytes], str]:
        """
        Downloads media bytes from Meta Graph API using media_id.
        Returns: (file_bytes, mime_type)
        """
        if not self.is_configured:
            return None, ""

        headers = self._get_headers()
        meta_url = f"{GRAPH_API_URL}/{media_id}"

        try:
            # 1. Get media download URL
            resp = requests.get(meta_url, headers=headers, timeout=10)
            if resp.status_code != 200:
                print(f"[WhatsAppClient Media Error] Could not retrieve media URL: {resp.text}")
                return None, ""

            media_info = resp.json()
            download_url = media_info.get("url")
            mime_type = media_info.get("mime_type", "image/jpeg")

            if not download_url:
                return None, mime_type

            # 2. Download the binary payload
            dl_resp = requests.get(download_url, headers=headers, timeout=20)
            if dl_resp.status_code == 200:
                return dl_resp.content, mime_type
            else:
                print(f"[WhatsAppClient Media Error] Download failed HTTP {dl_resp.status_code}")
                return None, mime_type
        except Exception as e:
            print(f"[WhatsAppClient Exception] Error downloading media: {e}")
            return None, ""


# Singleton WhatsApp Client
whatsapp_client = WhatsAppClient()


# ============================================================================
# 3. MESSAGE DISPATCHER & BOT WORKFLOW
# ============================================================================

def process_whatsapp_event(payload: Dict[str, Any]) -> bool:
    """
    Main webhook entry point for processing incoming WhatsApp Cloud API events.
    Handles onboarding, text doubts, photo doubts, and interactive menu selections.
    """
    try:
        log_whatsapp_event("raw_webhook_payload", payload)
        entry = payload.get("entry", [])
        if not entry:
            return True

        for item in entry:
            changes = item.get("changes", [])
            for change in changes:
                value = change.get("value", {})
                messages = value.get("messages", [])
                contacts = value.get("contacts", [])
                statuses = value.get("statuses", [])

                if statuses:
                    for s in statuses:
                        log_whatsapp_event("status_update", {
                            "id": s.get("id"),
                            "status": s.get("status"),
                            "recipient_id": s.get("recipient_id"),
                            "errors": s.get("errors", []),
                            "conversation": s.get("conversation", {})
                        })
                        print(f"[WhatsApp Webhook Status] id={s.get('id')} status={s.get('status')} errors={s.get('errors')}")

                if not messages:
                    # Ignore status updates (sent, delivered, read receipts)
                    continue

                contact_name = "Student"
                if contacts and "profile" in contacts[0]:
                    contact_name = contacts[0]["profile"].get("name", "Student")

                for msg in messages:
                    _handle_single_message(msg, contact_name)

        return True
    except Exception as e:
        print(f"[WhatsApp Webhook] Exception while processing event: {e}")
        return False


def _handle_single_message(msg: Dict[str, Any], contact_name: str):
    """Processes a single incoming message from a student."""
    msg_id = msg.get("id", "")
    sender_phone = msg.get("from", "")
    msg_type = msg.get("type", "")

    if not sender_phone:
        return

    # De-duplicate incoming retries from Meta
    if msg_id and msg_id in _PROCESSED_MESSAGE_IDS:
        return
    if msg_id:
        _PROCESSED_MESSAGE_IDS.append(msg_id)

    # Mark message as read
    whatsapp_client.mark_as_read(msg_id)

    # Fetch or initialize student session
    session = get_or_create_whatsapp_session(sender_phone, contact_name)

    # 1. Handle Interactive Button / List Replies
    if msg_type == "interactive":
        interactive = msg.get("interactive", {})
        itype = interactive.get("type", "")

        button_id = ""
        button_title = ""
        if itype == "button_reply":
            reply = interactive.get("button_reply", {})
            button_id = reply.get("id", "")
            button_title = reply.get("title", "")
        elif itype == "list_reply":
            reply = interactive.get("list_reply", {})
            button_id = reply.get("id", "")
            button_title = reply.get("title", "")

        _handle_button_action(sender_phone, session, button_id, button_title)
        return

    # 2. Handle Image Uploads (Homework / Textbook Doubts)
    if msg_type == "image":
        image_info = msg.get("image", {})
        media_id = image_info.get("id", "")
        caption = image_info.get("caption", "").strip()
        _handle_image_doubt(sender_phone, session, media_id, caption)
        return

    # 3. Handle Text Queries
    if msg_type == "text":
        text_body = msg.get("text", {}).get("body", "").strip()
        _handle_text_query(sender_phone, session, text_body)
        return

    # 4. Fallback for unsupported media types (audio, documents, stickers)
    whatsapp_client.send_text_message(
        to=sender_phone,
        text=(
            f"Hello {session['name']}! 👋\n\n"
            "Currently, I can help you with:\n"
            "• *Text doubts & concepts* (type your question)\n"
            "• *Homework & textbook photos* (send an image)\n"
            "• *Practice quizzes* (type *quiz*)\n\n"
            "Send your question anytime!"
        )
    )


# ----------------------------------------------------------------------------
# Sub-handlers for Interactive Buttons, Images, and Text
# ----------------------------------------------------------------------------

def _handle_button_action(sender_phone: str, session: Dict[str, Any], button_id: str, button_title: str):
    """Processes button and list selections."""
    # Standard Selection (e.g. 'std_10' or 'btn_tier_senior')
    if button_id.startswith("std_"):
        try:
            grade = int(button_id.replace("std_", ""))
            subjects = get_subjects_for_grade(grade)
            default_subject = subjects[0] if subjects else "Mathematics"
            update_whatsapp_session(
                sender_phone,
                standard=grade,
                subject=default_subject,
                onboarding_step="ready"
            )

            whatsapp_client.send_text_message(
                to=sender_phone,
                text=(
                    f"✅ *Standard Updated to Class {grade} (GSEB English Medium)!* 🎓\n\n"
                    f"Default Subject: *{default_subject}*\n\n"
                    "You're all set! You can now:\n"
                    "1️⃣ Ask any syllabus doubt\n"
                    "2️⃣ Send a 📸 photo of a textbook problem\n"
                    "3️⃣ Type *quiz* for quick practice questions\n"
                    "4️⃣ Type *subjects* to switch your active subject."
                )
            )
            return
        except Exception:
            pass

    if button_id == "btn_tier_primary":
        _send_standard_list_tier(sender_phone, 1, 5, "Primary (Class 1 to 5)")
        return
    elif button_id == "btn_tier_middle":
        _send_standard_list_tier(sender_phone, 6, 8, "Middle School (Class 6 to 8)")
        return
    elif button_id == "btn_tier_senior":
        _send_standard_list_tier(sender_phone, 9, 12, "High School (Class 9 to 12)")
        return

    # Subject Selection
    if button_id.startswith("subj_"):
        subj_name = button_title or button_id.replace("subj_", "")
        update_whatsapp_session(sender_phone, subject=subj_name)
        whatsapp_client.send_text_message(
            to=sender_phone,
            text=f"📚 Subject switched to *{subj_name}* for Standard {session.get('standard', 10)}!\nWhat would you like to ask?"
        )
        return

    # Command buttons
    if button_id == "cmd_quiz":
        _trigger_quick_quiz(sender_phone, session)
        return
    elif button_id == "cmd_change_std":
        _send_onboarding_menu(sender_phone, session["name"])
        return
    elif button_id == "cmd_help":
        _send_help_menu(sender_phone, session)
        return


def _handle_image_doubt(sender_phone: str, session: Dict[str, Any], media_id: str, caption: str):
    """Processes a student's photo doubt using Gemini Vision."""
    grade = session.get("standard", 10)
    subject = session.get("subject", "Science & Mathematics")

    # Immediate acknowledgment
    whatsapp_client.send_text_message(
        to=sender_phone,
        text=f"🔍 *Examining your textbook photo for Class {grade}...* One moment please!"
    )

    # Download media bytes
    image_bytes, mime_type = whatsapp_client.download_media(media_id)
    if not image_bytes:
        whatsapp_client.send_text_message(
            to=sender_phone,
            text="⚠️ Sorry, I could not download the image. Please make sure the photo is clear and try sending it again."
        )
        return

    try:
        img_b64 = base64.b64encode(image_bytes).decode("utf-8")
        # Call teacher engine multimodal solver
        result = teacher_engine.solve_image_doubt(
            image_base64=img_b64,
            grade=grade,
            subject=subject,
            language="en",
            socratic_mode=True
        )

        response_text = (
            f"📖 *Question Extracted:*\n{result.extracted_text}\n\n"
            f"💡 *Concept:* {result.concept_identified}\n\n"
            f"📝 *Teacher's Explanation:*\n{result.teaching_response}"
        )

        if result.hints:
            hints_str = "\n".join([f"• {h}" for h in result.hints])
            response_text += f"\n\n🎯 *Socratic Practice Hints:*\n{hints_str}"

        # Save to DB history
        save_whatsapp_message(sender_phone, "user", f"[Photo Doubt]: {caption or result.extracted_text}")
        save_whatsapp_message(sender_phone, "assistant", response_text)

        whatsapp_client.send_text_message(to=sender_phone, text=response_text)

    except Exception as e:
        print(f"[Image Doubt Error] {e}")
        whatsapp_client.send_text_message(
            to=sender_phone,
            text="I had trouble reading the text in that photo. Please ensure it's well-lit and oriented right side up, or type the question directly!"
        )


def _handle_text_query(sender_phone: str, session: Dict[str, Any], text: str):
    """Processes student text questions, onboarding state, or commands."""
    clean_text = text.strip()
    lower_text = clean_text.lower()
    step = session.get("onboarding_step", "new")
    grade = session.get("standard", 10)
    subject = session.get("subject", "Science & Mathematics")
    name = session.get("name", "Student")

    # 1. Onboarding check: New or awaiting standard
    if step in ("new", "awaiting_standard"):
        # Check if user typed a standard number directly (e.g. "10", "Class 10", "std 8")
        match = re.search(r'\b(?:standard|std|class)?\s*([1-9]|1[0-2])\b', lower_text)
        if match:
            picked_grade = int(match.group(1))
            subjects = get_subjects_for_grade(picked_grade)
            default_subj = subjects[0] if subjects else "Mathematics"
            update_whatsapp_session(
                sender_phone,
                standard=picked_grade,
                subject=default_subj,
                onboarding_step="ready"
            )
            whatsapp_client.send_text_message(
                to=sender_phone,
                text=(
                    f"🎉 *Welcome, {name}!* You're registered for *Class {picked_grade} (GSEB English Medium)*.\n\n"
                    f"Active Subject: *{default_subj}*\n\n"
                    "You can now:\n"
                    "• Ask any math or science question\n"
                    "• Send a 📸 photo of your textbook question\n"
                    "• Type *quiz* for test questions\n"
                    "• Type *change class* to switch standard anytime."
                )
            )
            return

        # Show standard selection menu
        _send_onboarding_menu(sender_phone, name)
        update_whatsapp_session(sender_phone, onboarding_step="awaiting_standard")
        return

    # 2. Command: Switch Standard
    if lower_text in ("std", "class", "change class", "change standard", "standard"):
        _send_onboarding_menu(sender_phone, name)
        return

    # 3. Command: Switch Subject
    if lower_text in ("subject", "subjects", "change subject"):
        _send_subject_picker(sender_phone, grade)
        return

    # 4. Command: Help / Menu
    if lower_text in ("help", "menu", "commands", "start", "hi", "hello") and len(clean_text) <= 5:
        _send_help_menu(sender_phone, session)
        return

    # 5. Command: Quick Quiz
    if lower_text in ("quiz", "take quiz", "practice quiz", "test"):
        _trigger_quick_quiz(sender_phone, session)
        return

    # 6. Command: Reset Conversation
    if lower_text in ("clear", "reset", "restart"):
        clear_whatsapp_conversation_history(sender_phone)
        whatsapp_client.send_text_message(
            to=sender_phone,
            text="🔄 *Conversation memory refreshed!* Ask your next GSEB curriculum question."
        )
        return

    # 7. Standard Q&A with Gemini Teacher Engine
    history_rows = get_whatsapp_conversation_history(sender_phone, limit=6)
    history_messages = [
        ChatMessage(role=r["role"], content=r["content"])
        for r in history_rows
    ]
    history_messages.append(ChatMessage(role="user", content=clean_text))

    try:
        chat_resp = teacher_engine.generate_chat_reply(
            messages=history_messages,
            grade=grade,
            subject=subject,
            student_name=name,
            language="en",
            socratic_mode=True
        )

        reply_text = chat_resp.reply

        # Include follow-up questions if available
        if getattr(chat_resp, "suggested_followups", None):
            reply_text += "\n\n💡 *Think About This:*\n" + "\n".join([f"• {q}" for q in chat_resp.suggested_followups[:2]])

        # Save to DB history
        save_whatsapp_message(sender_phone, "user", clean_text)
        save_whatsapp_message(sender_phone, "assistant", reply_text)

        whatsapp_client.send_text_message(to=sender_phone, text=reply_text)

    except Exception as e:
        print(f"[Teacher Engine Error] {e}")
        whatsapp_client.send_text_message(
            to=sender_phone,
            text="I ran into a temporary hiccup generating the answer. Please try asking again in a slightly simpler way!"
        )


# ----------------------------------------------------------------------------
# Interactive Menus Helpers
# ----------------------------------------------------------------------------

def _send_onboarding_menu(to: str, name: str):
    """Presents standard tier buttons so student can select their class."""
    body_text = (
        f"👋 Namaste {name}!\n\n"
        "Welcome to *VidyAI* — Dedicated AI School Teacher for *GSEB English Medium* (Standards 1 to 12).\n\n"
        "Please select your class tier, or simply reply with your class number (e.g. *10* or *7*):"
    )
    buttons = [
        ("btn_tier_primary", "Class 1 - 5 (Primary)"),
        ("btn_tier_middle", "Class 6 - 8 (Middle)"),
        ("btn_tier_senior", "Class 9 - 12 (Board)"),
    ]
    sent = whatsapp_client.send_interactive_buttons(
        to=to,
        body_text=body_text,
        buttons=buttons,
        header_text="🎒 Select Your Class"
    )
    if not sent:
        # Fallback to plain text if buttons cannot be delivered
        whatsapp_client.send_text_message(
            to=to,
            text=(
                f"{body_text}\n\n"
                "Reply with your standard number:\n"
                "• *1* to *5*: Primary School\n"
                "• *6* to *8*: Middle School\n"
                "• *9* to *12*: High School / Board"
            )
        )


def _send_standard_list_tier(to: str, start_grade: int, end_grade: int, title: str):
    """Sends an interactive list for the selected grade tier."""
    rows = [
        {
            "id": f"std_{g}",
            "title": f"Class {g}",
            "description": f"GSEB English Medium Standard {g}"
        }
        for g in range(start_grade, end_grade + 1)
    ]
    sections = [{"title": title, "rows": rows}]
    sent = whatsapp_client.send_interactive_list(
        to=to,
        body_text=f"Please choose your specific GSEB English Medium grade from *{title}*:",
        button_label="Choose Grade",
        sections=sections,
        header_text=f"📚 {title}"
    )
    if not sent:
        options = ", ".join([str(g) for g in range(start_grade, end_grade + 1)])
        whatsapp_client.send_text_message(to=to, text=f"Reply with your grade ({options}).")


def _send_subject_picker(to: str, grade: int):
    """Sends subject selection list for current grade."""
    subjects = get_subjects_for_grade(grade)
    rows = [
        {
            "id": f"subj_{idx}",
            "title": s[:24],
            "description": f"GSEB Class {grade}"
        }
        for idx, s in enumerate(subjects[:10])
    ]
    sections = [{"title": f"Class {grade} Subjects", "rows": rows}]
    sent = whatsapp_client.send_interactive_list(
        to=to,
        body_text=f"Select which subject you'd like VidyAI to focus on for *Class {grade}*:",
        button_label="Select Subject",
        sections=sections,
        header_text="📖 Choose Subject"
    )
    if not sent:
        sub_list = "\n".join([f"• {s}" for s in subjects])
        whatsapp_client.send_text_message(to=to, text=f"Available subjects for Class {grade}:\n{sub_list}")


def _send_help_menu(to: str, session: Dict[str, Any]):
    """Sends the command list and current status."""
    grade = session.get("standard", 10)
    subject = session.get("subject", "General Science & Math")
    name = session.get("name", "Student")

    help_text = (
        f"🤖 *VidyAI Student Desk*\n\n"
        f"Student: *{name}*\n"
        f"Current Standard: *Class {grade} (GSEB English)*\n"
        f"Active Subject: *{subject}*\n\n"
        "⚡ *Quick Commands:*\n"
        "• *Ask any question*: Type your doubt or concept\n"
        "• *Send a photo 📸*: Solve textbook / handwritten problem\n"
        "• *quiz*: Get 3 practice questions\n"
        "• *class* or *std*: Switch to another standard (1-12)\n"
        "• *subject*: Change your active subject\n"
        "• *clear*: Clear chat memory and start fresh\n"
        "• *help*: Display this menu anytime."
    )
    buttons = [
        ("cmd_quiz", "📝 Take Quiz"),
        ("cmd_change_std", "🎒 Switch Class"),
        ("cmd_help", "ℹ️ Help Info")
    ]
    sent = whatsapp_client.send_interactive_buttons(
        to=to,
        body_text=help_text,
        buttons=buttons,
        header_text="💡 VidyAI Quick Help"
    )
    if not sent:
        whatsapp_client.send_text_message(to=to, text=help_text)


def _trigger_quick_quiz(to: str, session: Dict[str, Any]):
    """Generates a 3-question quick quiz and sends to student."""
    grade = session.get("standard", 10)
    subject = session.get("subject", "Science & Mathematics")

    whatsapp_client.send_text_message(
        to=to,
        text=f"📝 *Preparing a quick GSEB English Medium quiz for Class {grade} {subject}...*"
    )

    try:
        quiz_data = teacher_engine.generate_quiz(
            grade=grade,
            subject=subject,
            topic=subject,
            num_questions=3,
            difficulty="medium",
            language="en"
        )

        quiz_text = f"🎯 *Quick Quiz: Class {grade} {subject}*\n\n"
        for i, q in enumerate(quiz_data.questions, 1):
            quiz_text += f"*Q{i}. {q.question}*\n"
            for opt in q.options:
                quiz_text += f"   {opt}\n"
            quiz_text += "\n"

        quiz_text += (
            "💡 *Answer Key & Explanations:*\n"
        )
        for i, q in enumerate(quiz_data.questions, 1):
            quiz_text += f"*Q{i} Answer:* {q.correct_answer}\n_{q.explanation}_\n\n"

        whatsapp_client.send_text_message(to=to, text=quiz_text)

    except Exception as e:
        print(f"[Quiz Generation Error] {e}")
        whatsapp_client.send_text_message(
            to=to,
            text="Could not generate the quiz right now. Try asking a direct question!"
        )
