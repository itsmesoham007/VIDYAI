import type { Metadata } from 'next';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  Cpu, 
  BookOpen, 
  Camera, 
  Mic, 
  UserCheck, 
  Mail, 
  ArrowLeft, 
  CheckCircle2, 
  HeartHandshake,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { VidyAILogo } from '@/components/VidyAILogo';

export const metadata: Metadata = {
  title: 'Privacy Policy | VidyAI — GSEB AI School Teacher',
  description: 'Official Privacy Policy and Student Data Protection guidelines for VidyAI GSEB English Medium student learning portal.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="h-full w-full overflow-y-auto bg-[#FAF9F5] text-[#1F1E1D]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-[#ECE9DF] bg-[#FAF9F5]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#6B6860] hover:text-[#1F1E1D] hover:bg-[#ECE9DF]/60 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to VidyAI</span>
          </Link>
          <div className="h-4 w-[1px] bg-[#ECE9DF]" />
          <VidyAILogo size="sm" showText={true} subtitle="Privacy & Student Safety" />
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#C96442] bg-[#C96442]/10 rounded-full border border-[#C96442]/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Google Play Families Compliant
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header Hero */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECE9DF]/60 text-xs font-medium text-[#6B6860] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#C96442]" />
            <span>Effective Date: November 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1E1D] tracking-tight">
            VidyAI Privacy Policy
          </h1>
          <p className="mt-3 text-base text-[#6B6860] leading-relaxed max-w-2xl">
            VidyAI is an educational AI school teacher and comprehensive student study portal built exclusively for 
            <strong> Gujarat Secondary and Higher Secondary Education Board (GSEB)</strong> English Medium students 
            from Standard 1 to Standard 12. We are committed to maintaining the highest standards of student data privacy and safety.
          </p>
        </div>

        {/* Core Commitments Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-10">
          <div className="p-4 rounded-xl border border-[#ECE9DF] bg-white shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-[#C96442]/10 flex items-center justify-center text-[#C96442] mb-3">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#1F1E1D]">We Never Sell Data</h3>
            <p className="text-xs text-[#6B6860] mt-1 leading-relaxed">
              Student study records, questions, and notes are never sold, rented, or traded to advertisers or data brokers.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#ECE9DF] bg-white shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-[#2D7A5C]/10 flex items-center justify-center text-[#2D7A5C] mb-3">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#1F1E1D]">No Commercial Ads</h3>
            <p className="text-xs text-[#6B6860] mt-1 leading-relaxed">
              VidyAI provides an ad-free, distraction-free environment completely compliant with Google Play Families guidelines.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#ECE9DF] bg-white shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-[#C96442]/10 flex items-center justify-center text-[#C96442] mb-3">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-[#1F1E1D]">Google Gemini AI</h3>
            <p className="text-xs text-[#6B6860] mt-1 leading-relaxed">
              Academic explanations are generated via secure API backend proxies. Prompts are not used for advertising.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8">
          {/* Section 1: Who We Are & Scope */}
          <section className="bg-white rounded-2xl border border-[#ECE9DF] p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#C96442]/10 text-[#C96442] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#1F1E1D]">1. About VidyAI & Scope of Service</h2>
            </div>
            <p className="text-sm text-[#4A4843] leading-relaxed">
              VidyAI (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the VidyAI web and mobile application portal. 
              The application serves as an adaptive academic teacher and study companion aligned with the official GSEB 
              curriculum for Standard 1 to 12. Its features include interactive Socratic doubt clearing, chapter-wise 
              syllabus progress tracking, personal revision notebooks, past GSEB SSC & HSC board paper hubs, and timed mock tests.
            </p>
          </section>

          {/* Section 2: Data We Collect & How We Use It */}
          <section className="bg-white rounded-2xl border border-[#ECE9DF] p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#C96442]/10 text-[#C96442] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#1F1E1D]">2. Information Collected & Educational Purpose</h2>
            </div>
            <div className="space-y-4 text-sm text-[#4A4843] leading-relaxed">
              <p>
                To provide an educational experience tailored to the student&apos;s grade and subject, VidyAI processes 
                minimal learning-specific information:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-[#4A4843]">
                <li>
                  <strong>Grade & Stream Selection:</strong> The standard chosen (e.g., Standard 10 SSC or Standard 12 HSC Science) 
                  to align curriculum syllabus points and GSEB textbook solutions.
                </li>
                <li>
                  <strong>Academic Chat Prompts & Inquiries:</strong> Questions asked by the student regarding mathematics, 
                  science, physics, chemistry, biology, or social studies.
                </li>
                <li>
                  <strong>Local Study Progress & Notebook:</strong> Chapter completion checkboxes, bookmark flags, and formula revision notes 
                  stored directly inside the user&apos;s device browser storage (`localStorage`).
                </li>
                <li>
                  <strong>Mock Exam Records:</strong> Scores and answers submitted during timed test sessions to calculate instantaneous score summaries.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3: AI Processing with Google Gemini API */}
          <section className="bg-white rounded-2xl border border-[#ECE9DF] p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#C96442]/10 text-[#C96442] flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#1F1E1D]">3. Artificial Intelligence & Google Gemini API</h2>
            </div>
            <div className="space-y-3 text-sm text-[#4A4843] leading-relaxed">
              <p>
                VidyAI utilizes Google&apos;s enterprise-grade <strong>Gemini API</strong> (including Gemini reasoning models) 
                via secure backend servers to understand student questions, format LaTeX formulas via KaTeX, and provide 
                age-appropriate educational explanations.
              </p>
              <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#ECE9DF] text-xs space-y-1.5 text-[#6B6860]">
                <p className="font-semibold text-[#1F1E1D]">Key AI Privacy Safeguards:</p>
                <p>• API communications are encrypted in transit via Transport Layer Security (TLS 1.3 / HTTPS).</p>
                <p>• Student queries are passed strictly to generate academic answers and are never retained for behavioral profiling.</p>
                <p>• System instructions strictly enforce NCERT/GSEB academic guardrails, child-safety filtering, and polite Socratic teaching etiquette.</p>
              </div>
            </div>
          </section>

          {/* Section 4: Device Permissions (Camera & Microphone) */}
          <section className="bg-white rounded-2xl border border-[#ECE9DF] p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#C96442]/10 text-[#C96442] flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#1F1E1D]">4. Device Permissions (Camera & Microphone)</h2>
            </div>
            <div className="space-y-4 text-sm text-[#4A4843] leading-relaxed">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#FAF9F5] border border-[#ECE9DF] shrink-0 text-[#C96442]">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-[#1F1E1D]">Camera & Image Upload (Optional Doubt Solver)</h4>
                  <p className="text-xs text-[#6B6860] mt-0.5">
                    Students can optionally snap a picture of a handwritten notebook math problem or textbook diagram. 
                    Images are analyzed purely to extract academic text via OCR and provide step-by-step problem guidance. 
                    We do not store pictures in facial recognition databases or use them for non-academic purposes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#FAF9F5] border border-[#ECE9DF] shrink-0 text-[#C96442]">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-[#1F1E1D]">Microphone & Speech Audio (Optional Voice Tutor)</h4>
                  <p className="text-xs text-[#6B6860] mt-0.5">
                    For junior students (Class 1–5), VidyAI supports voice interaction using standard browser Web Speech APIs. 
                    Audio is transcribed on the fly; we do not retain or record voice recordings on our servers.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Children's Privacy & Google Play Families Policy */}
          <section className="bg-white rounded-2xl border border-[#ECE9DF] p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#C96442]/10 text-[#C96442] flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#1F1E1D]">5. Children&apos;s Privacy & Family Safety (COPPA Compliance)</h2>
            </div>
            <div className="space-y-3 text-sm text-[#4A4843] leading-relaxed">
              <p>
                Because VidyAI is used by students under 13 (Class 1 through 5) as well as middle and high school students, 
                our platform strictly complies with the <strong>Children&apos;s Online Privacy Protection Act (COPPA)</strong> and 
                Google Play&apos;s <strong>Designed for Families Policy</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#4A4843]">
                <li>We do not condition a child&apos;s participation on disclosing personal identification details.</li>
                <li>We do not serve targeted or behavioral advertisements to children.</li>
                <li>Content safety mechanisms prevent inappropriate, harmful, or non-educational responses.</li>
                <li>Parents and guardians can review or request deletion of any locally stored data at any time.</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Data Retention, Storage & Deletion */}
          <section className="bg-white rounded-2xl border border-[#ECE9DF] p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#C96442]/10 text-[#C96442] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#1F1E1D]">6. Data Retention and Control</h2>
            </div>
            <div className="space-y-3 text-sm text-[#4A4843] leading-relaxed">
              <p>
                All study progress, bookmark markers, and notebook entries are stored locally on your device storage. 
                You can reset or erase your study data at any time by clearing your browser cache/storage or clicking 
                the reset button inside the VidyAI settings panel.
              </p>
            </div>
          </section>

          {/* Section 7: Contact Us */}
          <section className="bg-white rounded-2xl border border-[#ECE9DF] p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#C96442]/10 text-[#C96442] flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-[#1F1E1D]">7. Contact & Grievance Redressal</h2>
            </div>
            <p className="text-sm text-[#4A4843] leading-relaxed">
              If parents, students, or educators have questions, feedback, or concerns regarding this Privacy Policy 
              or data handling practices, please contact our education support team:
            </p>
            <div className="mt-4 p-4 rounded-xl bg-[#FAF9F5] border border-[#ECE9DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#1F1E1D]">VidyAI Education Support Team</p>
                <p className="text-xs text-[#6B6860] mt-0.5">Gujarat Secondary Education Portal Assistance</p>
                <a 
                  href="mailto:vidyai.education@gmail.com" 
                  className="text-xs font-semibold text-[#C96442] hover:underline mt-1 inline-block"
                >
                  vidyai.education@gmail.com
                </a>
              </div>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#C96442] text-white text-xs font-medium rounded-lg hover:bg-[#B35334] transition-colors"
              >
                <span>Return to Study Portal</span>
              </Link>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-[#ECE9DF] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B6860]">
          <p>© {new Date().getFullYear()} VidyAI Education. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[#1F1E1D] transition-colors">Study Portal</Link>
            <span>•</span>
            <span className="text-[#C96442] font-medium">GSEB English Medium Std 1–12</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
