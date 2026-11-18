# VidyAI — WhatsApp Cloud API Setup Guide (₹0 Direct Integration)

This guide walks you through connecting your **VidyAI GSEB English Medium School Teacher** directly to Meta's official WhatsApp Cloud API at **zero cost** for development and production (up to 1,000 bot replies/month completely free).

---

## 1. Prerequisites & Meta Cloud API Credentials (100% Free)

Meta provides a **free developer sandbox** that includes a test phone number and requires no credit card.

### Step 1.1: Create Meta Developer Account & App
1. Go to [developers.facebook.com](https://developers.facebook.com) and log in with your Facebook account.
2. Click **My Apps** > **Create App**.
3. Select **Other** as the use case > click **Next**.
4. Select **Business** as the app type > click **Next**.
5. Give your app a name (e.g., `VidyAI School Teacher`) and enter your email.
6. Click **Create App**.

### Step 1.2: Add WhatsApp Product
1. In your App Dashboard, scroll down to **WhatsApp** and click **Set up**.
2. Under the left navigation menu, click **WhatsApp** > **API Setup** (or **Quickstart**).
3. Meta will display:
   * **Temporary access token** (valid for 24 hours, or you can create a permanent System User token).
   * **Phone number ID** (e.g., `10423850589...`).
   * **WhatsApp Business Account ID**.
   * **Test Phone Number** provided by Meta.

### Step 1.3: Add Your Personal WhatsApp Number for Sandbox Testing
1. On the **API Setup** page, locate **Step 1: Select phone numbers**.
2. In the **To** dropdown, select **Manage phone number list**.
3. Add your personal phone number (with country code `+91`) and enter the OTP code sent to your WhatsApp.
4. You can add up to 5 tester numbers for free.

---

## 2. Configure Local Environment Variables

Open `vidyai-school-teacher/.env` (and `vidyai-school-teacher/backend/.env`) and add your Meta credentials:

```bash
# Meta WhatsApp Cloud API
WHATSAPP_TOKEN=EAAG...your_token_from_meta_portal...
WHATSAPP_PHONE_NUMBER_ID=10423850589...
WHATSAPP_VERIFY_TOKEN=vidyai_whatsapp_verify_token
WHATSAPP_API_VERSION=v21.0
```

---

## 3. Local Webhook Tunneling (Test From Your Own Phone)

Because Meta needs to deliver incoming WhatsApp messages to your computer, create a secure public HTTPS tunnel to port `8000`:

### Option A: Using Cloudflare Tunnel (Free, no login required)
```powershell
# In PowerShell:
winget install Cloudflare.cloudflared
cloudflared tunnel --url http://localhost:8000
```
Copy the generated HTTPS URL (e.g. `https://random-subdomain.trycloudflare.com`).

### Option B: Using ngrok
```powershell
ngrok http 8000
```
Copy the generated HTTPS URL (e.g. `https://xxxx-xx-xx.ngrok-free.app`).

---

## 4. Register Webhook in Meta Developer Portal

1. In your Meta App Dashboard, navigate to **WhatsApp** > **Configuration**.
2. In the **Webhook** section, click **Edit**:
   * **Callback URL**: `https://YOUR_TUNNEL_URL/api/whatsapp/webhook`
   * **Verify token**: `vidyai_whatsapp_verify_token` (matches `WHATSAPP_VERIFY_TOKEN` in your `.env`)
3. Click **Verify and Save**.
   *(FastAPI will automatically respond with `hub.challenge` and log `[WhatsApp Webhook] Handshake verified successfully!`)*
4. Under **Webhook fields**, click **Manage** and subscribe to:
   * ✅ `messages`

---

## 5. Test VidyAI on WhatsApp

From your registered phone number, send a message to the Meta Sandbox Number:

1. **Onboarding:**
   * Send: `Hi`
   * VidyAI will greet you and prompt you to choose your **Class (Standard 1 to 12)** via interactive buttons or by typing `10`.
2. **Curriculum Doubts:**
   * Send: `Explain Ohm's Law and its formula`
   * VidyAI responds with clean, formatted Unicode equations (e.g., $V = I \times R$), GSEB textbook concepts, and self-check questions.
3. **Photo Doubts (Multimodal Vision):**
   * Snap a photo of a textbook problem or handwritten homework and send it with or without a caption.
   * VidyAI will extract the question, identify the concept, provide a step-by-step Socratic solution, and give practice hints.
4. **Practice Quiz:**
   * Send: `quiz`
   * VidyAI generates a 3-question diagnostic quiz tailored to your active standard.
5. **Switch Standard / Subject:**
   * Send: `class` to switch to any standard between 1 and 12.
   * Send: `subject` to select an active subject.

---

## 6. Production Deployment (Free 24/7 Hosting)

When you are ready to deploy 24/7 without keeping your local PC on:

1. Push your repository to GitHub.
2. Deploy on **Render** (using the included `render.yaml`):
   * Add `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `GEMINI_API_KEY` in the Render dashboard.
3. Update your Meta Webhook URL to:
   `https://vidyai-backend.onrender.com/api/whatsapp/webhook`
4. The first **1,000 service replies each month are 100% free** under Meta's Cloud API pricing.
