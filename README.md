# ATS Resume Optimizer

> **Beat every ATS filter. Free. Private. Offline-capable.**

Upload your resume in any format → paste any job description → get a real-time ATS score → fix every issue → download an optimized resume. Target **90-95%+ ATS pass rate**.

## Features

- **Parse any resume format**: PDF, DOCX, HTML, Markdown, or even a photo (OCR via Tesseract.js)
- **Score against 15+ ATS systems**: Taleo, Workday, Greenhouse, iCIMS, Lever, SAP SuccessFactors, Jobvite, ADP, BambooHR, SmartRecruiters, Bullhorn, Rippling, Ashby, JazzHR, Workable
- **6-dimension scoring**: Keyword Match, Format Compliance, Section Completeness, Achievement Quality, Contact Info, Length/Density
- **Real-time keyword gap analysis**: TF-IDF + exact match + acronym expansion (ML = Machine Learning, etc.)
- **Editable resume**: Section-aware editor — contact, summary, experience, education, skills
- **One-click fixes**: Apply suggestions directly in the editor; missing keywords auto-added to skills
- **Export ATS-safe formats**: PDF, DOCX, HTML, Markdown
- **100% private**: Everything runs in your browser, nothing sent to any server
- **Offline PWA**: Works fully offline after first load; installable on any device

## Getting Started

### Deploy to Vercel (Free, 1-click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/ats-resume-optimizer)

### Run Locally

```bash
git clone https://github.com/YOUR_USERNAME/ats-resume-optimizer
cd ats-resume-optimizer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Optional Pro Features (Bring Your Own API Key)

The core 90-95% ATS scoring is completely free. Optionally, add an API key for AI-powered rewrites:

- **Groq** (free tier: 30 req/min) — fastest
- **OpenAI** GPT-4o
- **Anthropic** Claude

Your key is stored only in localStorage and sent directly to the AI provider. It never goes through any backend.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS 4 |
| Resume Parsing | pdfjs-dist, mammoth, Tesseract.js (OCR) |
| ATS Scoring | Custom TF-IDF engine + researched ATS rules DB |
| Offline | Service Worker + IndexedDB |
| Export | html2pdf.js, docx, turndown |
| Deployment | Vercel (free tier) |

## How 90-95% ATS Scores Are Achieved

The scoring engine combines:

1. **Keyword Match (30%)** — TF-IDF extraction from JD + exact/acronym matching in resume
2. **Format Compliance (25%)** — No tables/columns/images, standard fonts, correct date formats
3. **Section Completeness (20%)** — All ATS-required sections present with correct names
4. **Achievement Quality (15%)** — Quantified bullets, strong action verbs, impact language
5. **Contact & Meta (5%)** — Email, phone, LinkedIn, location all present
6. **Length & Density (5%)** — Word count appropriate for experience level

## ATS Systems Covered

Taleo · Workday · Greenhouse · iCIMS · Lever · SAP SuccessFactors · Jobvite · ADP Recruiting · BambooHR · SmartRecruiters · Bullhorn · JazzHR · Recruitee · Rippling · Ashby · Workable

## Privacy

- No backend server
- No database
- No analytics
- No cookies
- No account required
- Resume data stored locally in IndexedDB

## License

MIT
