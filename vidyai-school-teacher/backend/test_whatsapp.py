"""
Automated Test Suite for VidyAI WhatsApp Cloud API Integration
Tests:
1. LaTeX to Unicode and WhatsApp Text Formatting
2. Message chunking (< 4096 characters)
3. SQLite WhatsApp Session and History persistence
4. Webhook Handshake Verification (GET)
5. Inbound Message Processing (POST Simulation)
"""

import sys
import os
import unittest
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from config import WHATSAPP_VERIFY_TOKEN
from whatsapp_service import (
    format_for_whatsapp,
    split_message_chunks,
    process_whatsapp_event
)
from portal_db import (
    get_or_create_whatsapp_session,
    update_whatsapp_session,
    save_whatsapp_message,
    get_whatsapp_conversation_history,
    clear_whatsapp_conversation_history
)


class TestWhatsAppIntegration(unittest.TestCase):

    def test_01_latex_to_unicode_formatting(self):
        """Tests that LaTeX formulas and markdown convert cleanly to WhatsApp text."""
        raw_text = (
            "Here is the quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\n"
            "And Pythagoras theorem: $$a^2 + b^2 = c^2$$\n"
            "**Key Note:** The value of $\\pi$ is approximately $3.14159$ and $\\theta = 45^\\circ$."
        )
        formatted = format_for_whatsapp(raw_text)

        # Assert no raw LaTeX frac or sqrt remains
        self.assertNotIn(r"\frac", formatted)
        self.assertNotIn(r"\sqrt", formatted)
        # Assert superscripts converted
        self.assertIn("²", formatted)
        # Assert greek letters converted
        self.assertIn("π", formatted)
        self.assertIn("θ", formatted)
        # Assert markdown bold **Key Note:** converted to *Key Note:*
        self.assertIn("*Key Note:*", formatted)
        self.assertNotIn("**Key Note:**", formatted)
        print("✓ Test 1: Math and markdown formatting passed!")

    def test_02_message_chunking(self):
        """Tests that long messages over 3800 characters are properly chunked."""
        long_paragraph = "This is a detailed lesson on GSEB Science concepts. " * 100
        very_long_message = "\n\n".join([long_paragraph] * 3)
        self.assertGreater(len(very_long_message), 4000)

        chunks = split_message_chunks(very_long_message, max_length=3800)
        self.assertGreater(len(chunks), 1)
        for chunk in chunks:
            self.assertLessEqual(len(chunk), 3800)
        print(f"✓ Test 2: Chunking passed! Split {len(very_long_message)} chars into {len(chunks)} safe chunks.")

    def test_03_student_session_and_history(self):
        """Tests SQLite session creation, standard updating, and history tracking."""
        test_phone = "919000000001"
        test_name = "Aarav Sharma"

        # 1. Create or retrieve session
        session = get_or_create_whatsapp_session(test_phone, test_name)
        self.assertEqual(session["wa_id"], test_phone)
        self.assertEqual(session["name"], test_name)

        # 2. Update standard and subject
        updated = update_whatsapp_session(
            test_phone,
            standard=10,
            subject="Mathematics",
            onboarding_step="ready"
        )
        self.assertEqual(updated["standard"], 10)
        self.assertEqual(updated["subject"], "Mathematics")
        self.assertEqual(updated["onboarding_step"], "ready")

        # 3. Message history
        clear_whatsapp_conversation_history(test_phone)
        save_whatsapp_message(test_phone, "user", "What is Trigonometry?")
        save_whatsapp_message(test_phone, "assistant", "Trigonometry is the branch of math...")

        history = get_whatsapp_conversation_history(test_phone, limit=5)
        self.assertEqual(len(history), 2)
        self.assertEqual(history[0]["role"], "user")
        self.assertEqual(history[1]["role"], "assistant")
        print("✓ Test 3: Session state and history persistence passed!")

    def test_04_webhook_inbound_simulation(self):
        """Simulates an incoming WhatsApp message payload."""
        test_phone = "919000000002"
        simulated_event = {
            "object": "whatsapp_business_account",
            "entry": [
                {
                    "id": "TEST_BIZ_ID",
                    "changes": [
                        {
                            "value": {
                                "messaging_product": "whatsapp",
                                "metadata": {
                                    "display_phone_number": "15550269999",
                                    "phone_number_id": "123456789"
                                },
                                "contacts": [{"profile": {"name": "Priya"}, "wa_id": test_phone}],
                                "messages": [
                                    {
                                        "from": test_phone,
                                        "id": "wamid_unit_test_001",
                                        "timestamp": "1731920000",
                                        "type": "text",
                                        "text": {"body": "10"}
                                    }
                                ]
                            },
                            "field": "messages"
                        }
                    ]
                }
            ]
        }

        # Process should succeed without raising any exceptions
        result = process_whatsapp_event(simulated_event)
        self.assertTrue(result)

        # Check that Priya's standard was set to 10
        session = get_or_create_whatsapp_session(test_phone)
        self.assertEqual(session["standard"], 10)
        print("✓ Test 4: Webhook inbound event simulation passed!")

    def test_05_academic_doubt_flow(self):
        """Simulates an enrolled student asking an academic science doubt."""
        test_phone = "919000000002"
        # Ensure session is ready
        update_whatsapp_session(test_phone, standard=10, subject="Science", onboarding_step="ready")

        simulated_doubt_event = {
            "object": "whatsapp_business_account",
            "entry": [
                {
                    "id": "TEST_BIZ_ID",
                    "changes": [
                        {
                            "value": {
                                "messaging_product": "whatsapp",
                                "metadata": {
                                    "display_phone_number": "15550269999",
                                    "phone_number_id": "123456789"
                                },
                                "contacts": [{"profile": {"name": "Priya"}, "wa_id": test_phone}],
                                "messages": [
                                    {
                                        "from": test_phone,
                                        "id": "wamid_unit_test_002",
                                        "timestamp": "1731920005",
                                        "type": "text",
                                        "text": {"body": "Can you explain Ohm's Law simply?"}
                                    }
                                ]
                            },
                            "field": "messages"
                        }
                    ]
                }
            ]
        }
        result = process_whatsapp_event(simulated_doubt_event)
        self.assertTrue(result)

        # Verify message was saved to conversation history
        history = get_whatsapp_conversation_history(test_phone, limit=2)
        self.assertGreaterEqual(len(history), 2)
        self.assertEqual(history[-2]["role"], "user")
        self.assertEqual(history[-1]["role"], "assistant")
        print(f"✓ Test 5: Academic doubt processed and answered ({len(history[-1]['content'])} chars)!")



if __name__ == "__main__":
    unittest.main()
