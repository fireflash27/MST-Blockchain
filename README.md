# OcuTrust — Secure Patient-Hospital Glaucoma Screening Platform

OcuTrust is a healthcare web platform for glaucoma screening and clinical data management with cryptographic integrity verification, designed for future notarization onto the **MST Blockchain**.

---

## 🌟 Key Features

### 1. Patient Portal
* **Intake & Risk Evaluation:** Record symptoms (peripheral vision dimming, halos, ocular dull ache) and systemic risk factors (family history of glaucoma, diabetes, hypertension, past eye surgeries).
* **Fundus & OCT Image Upload:** Upload Left Eye (OS) and Right Eye (OD) retinal photographs with immediate client-side **SHA-256 cryptographic digest calculation**.
* **Real-time Status Tracking:** Track progress from *Submitted* &rarr; *Under Evaluation* &rarr; *Glaucoma Screening Completed* &rarr; *Urgent Referral*.
* **Official Glaucoma Screening Report:** View comprehensive findings including Cup-to-Disc Ratio (CDR) gauges, measured Intraocular Pressures (IOP), doctor recommendations, and prescription schedules.

### 2. Hospital / Clinician Workstation
* **Triage Dashboard:** Prioritize high-risk, urgent, and routine patient screening submissions.
* **Retinal Image Examination Console:** Side-by-side fundus comparison with real-time digital enhancements:
  * High-Contrast Rim Visualization
  * Inverted Optic Cup Mode
  * Red-Free Filter (for Retinal Nerve Fiber Layer / RNFL assessment)
  * Interactive Cup-to-Disc Ratio (CDR) Optical Grading Reticle (0.3, 0.5, 0.7, 0.9 CDR thresholds)
* **Clinical Glaucoma Grading & Staging:** Grade Primary Open-Angle Glaucoma (POAG), Primary Angle-Closure (PACG), Glaucoma Suspect, Normal Tension, or Ocular Hypertension.
* **Medication Prescriptions & Follow-up Plans:** Manage topical IOP-lowering drop regimens (e.g., Latanoprost, Brimonidine, Timolol).
* **Digital Signing & Cryptographic Seal:** Clinician cryptographically signs the finalized diagnostic record.

### 3. MST Blockchain Readiness
* **Canonical Hashing:** Every retinal image, intake metadata payload, and doctor evaluation is deterministically hashed using standard SHA-256.
* **Dual Web2 + Web3 Architecture:** Large medical data remains off-chain in Supabase PostgreSQL + Storage under strict Row Level Security (RLS), while 32-byte hashes are prepared for EVM-compatible MST Smart Contracts (Parlia consensus).
* **Simulated On-Chain Anchoring:** Includes an interactive simulation of MST Chain transaction receipts and block confirmation numbers.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite |
| **Styling** | Tailwind CSS + Modern Healthcare Glassmorphism |
| **Icons** | Lucide React |
| **Backend & DB** | Supabase PostgreSQL + Row Level Security (RLS) |
| **Authentication** | Supabase Auth (with instant one-click Demo Role Switcher) |
| **Storage** | Supabase Storage (`retinal-images` bucket) |
| **Cryptography** | Web Crypto API (SHA-256) |
| **Blockchain Target** | MST Chain (EVM compatible, Parlia consensus) |

---

## 🚀 Getting Started

### 1. Install Dependencies
\`\`\`bash
cd Product_folder
npm install
\`\`\`

### 2. Configure Supabase (Optional for Live Cloud Mode)
Copy `.env.example` to `.env` and fill in your Supabase credentials:
\`\`\`bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
\`\`\`

> **Demo / Offline Mode:** If no Supabase keys are provided, OcuTrust automatically runs in **Seamless Local Sandbox Engine mode** with pre-loaded realistic clinical datasets, allowing judges to test everything immediately without setup friction.

### 3. Run Development Server
\`\`\`bash
npm run dev
\`\`\`

### 4. Build for Production
\`\`\`bash
npm run build
\`\`\`

---

## 🗄️ Database Setup (Supabase PostgreSQL)

Execute the SQL script located at:
\`\`\`
supabase/schema.sql
\`\`\`
This script provisions:
* `profiles` (linked to `auth.users`)
* `screening_requests` (intake data, image URLs, SHA-256 hashes, MST anchor fields)
* `screening_reports` (doctor findings, CDRs, IOPs, prescriptions, report hash)
* `audit_logs` (tamper-evident audit trail)
* Row Level Security (RLS) policies for complete HIPAA-compliant data separation
* Storage bucket policies for `retinal-images`
