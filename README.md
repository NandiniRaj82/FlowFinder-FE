<div align="center">

# ⚡ Flow Finder — Frontend

**AI-powered web accessibility, design matching, and website redesign platform**

Built with **Next.js** · **TypeScript** · **Tailwind CSS** · **Gemini AI**

![Flow Finder](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=for-the-badge&logo=tailwind-css)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-orange?style=for-the-badge&logo=google)

</div>

---

## 📖 Overview

Flow Finder is a full-stack AI web tool that helps developers and designers build more accessible, pixel-perfect, and beautifully redesigned websites. It connects to a Chrome Extension to import real accessibility errors, compares live sites against Figma designs, and generates complete HTML redesigns from any URL.

---

## ✨ Features

### 🛡️ Fix Accessibility
Upload your code files and import real accessibility errors directly from the **Flow Finder Chrome Extension**. Gemini AI analyses your code and provides:
- Exact problematic code snippets
- Minimal surgical fixes (only accessibility attributes changed)
- WCAG 2.1 AA references
- Interactive chat to ask follow-up questions about any issue

### 🎨 Match Design
Compare your live website against a Figma design to catch every visual mismatch:
- Screenshots your live site using Puppeteer
- Fetches your Figma frame via the Figma API
- Gemini Vision compares both images
- Reports mismatches in colors, fonts, spacing, layout, and missing elements

### 🖥️ Website Redesigner
Paste any URL and get 3 complete redesigned versions of the site:
- **Minimal & Clean** — editorial, whitespace-first
- **Bold & Dark** — dark mode, high contrast, neon accents
- **Colorful & Vibrant** — gradients, rounded corners, energetic
- **Custom** — describe your own style (optional 4th design)
- Live iframe preview for all designs
- Download as HTML

---

## 🗂️ Project Structure

```
frontend/
├── src/
│   └── app/
│       ├── components/
│       │   ├── dashboard.tsx           # Main app shell — routes between features
│       │   ├── FeatureSelect.tsx       # Post-login feature selection screen
│       │   ├── uploadSection.tsx       # File upload + Chrome extension import
│       │   ├── choiceSection.tsx       # Suggestions vs Full Correction cards
│       │   ├── AccessibilityChat.tsx   # Chat UI for accessibility results
│       │   ├── extensionBridge.ts      # Chrome extension postMessage bridge
│       │   ├── MatchDesignForm.tsx     # Match Design URL input form
│       │   ├── MatchDesignChat.tsx     # Match Design results chat UI
│       │   ├── WebsiteRedesignerForm.tsx     # Redesigner URL + style input
│       │   └── WebsiteRedesignerResults.tsx  # Redesigner preview cards + download
│       ├── dashboard/
│       │   └── page.tsx               # Dashboard page (protected route)
│       ├── signin/
│       │   └── page.tsx               # Sign in page
│       ├── signup/
│       │   └── page.tsx               # Sign up page
│       └── layout.tsx                 # Root layout
├── public/
├── package.json
└── tailwind.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend server running (see [backend repo](#))
- Chrome Extension installed (see [extension repo](#))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/flow-finder-frontend.git
cd flow-finder-frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_EXTENSION_ID=your_chrome_extension_id_here
```

To find your extension ID:
1. Go to `chrome://extensions`
2. Enable Developer mode
3. Find **Flow Finder** extension → copy the ID

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

---

## 🔄 User Flow

```
Login / Signup
      ↓
Feature Select Screen
      ↓
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Fix Accessibility    Match Design    Website Redesign  │
│         ↓                  ↓                 ↓         │
│   Upload Files        Enter URLs        Enter URL       │
│   Import Errors       (Site + Figma)    Pick Style      │
│         ↓                  ↓                 ↓         │
│   Choose Mode         AI Compares       AI Scrapes      │
│  (Suggest / Fix)      Screenshots       All Content     │
│         ↓                  ↓                 ↓         │
│   Chat Results        Mismatch List     3 Previews      │
│   + Chat Input        in Chat UI        + Download      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Details

### `dashboard.tsx`
The central state manager. Controls which feature is active and manages all state for all three features. Handles API calls to the backend and passes results down to child components.

**State managed:**
- `feature` — which tool is active (`accessibility | match-design | website-redesigner | null`)
- Accessibility: `uploadedFiles`, `accessibilityErrors`, `stage`, `apiResult`, `chatSessionId`
- Match Design: `matchStage`, `matchMismatches`, `matchWebsiteUrl`, `matchFigmaUrl`
- Redesigner: `redesignerStage`, `redesignerDesigns`, `redesignerStats`

### `FeatureSelect.tsx`
Shown right after login. Three clickable cards leading to each feature. Includes animated hover effects and feature descriptions.

### `uploadSection.tsx`
Handles file uploads (drag & drop or click) and imports errors from the Chrome Extension via `extensionBridge.ts`. Shows a green banner when extension errors are successfully imported.

### `extensionBridge.ts`
Communicates with the Flow Finder Chrome Extension using `postMessage` → `content.js` relay → `background.js` → `chrome.storage.local`. Falls back to `window.__flowFinderErrors` if relay fails.

### `choiceSection.tsx`
Two cards: **Get Suggestions** and **Full AI Correction**. Suggestions mode sends files to Gemini for analysis. Full Correction mode returns a corrected ZIP download.

### `AccessibilityChat.tsx`
Chat interface for accessibility results. Features:
- Expandable suggestion cards (click to see original code vs fixed code)
- Severity badges (critical / serious / moderate / minor)
- Source badges (🔦 Lighthouse / 🪓 Axe)
- Live chat input with session-based conversation (asks Gemini about your specific issues)
- Quick question buttons

### `MatchDesignForm.tsx` / `MatchDesignChat.tsx`
Input form for website URL + Figma share link. Results shown as mismatch cards in a chat UI with severity levels and Figma vs Live value comparison.

### `WebsiteRedesignerForm.tsx`
URL input with:
- Framework selector (HTML / React / Next.js / Vue / Angular)
- 3 style previews (Minimal, Bold, Colorful)
- Optional custom style textarea with example prompts

### `WebsiteRedesignerResults.tsx`
Shows 3-4 design cards with:
- Live iframe thumbnail preview
- Full-screen modal with Preview tab and Code tab
- Download as HTML button
- Scrape stats (headings, paragraphs, list items, tags scraped)

---

## 🔌 Chrome Extension Integration

The frontend communicates with the **Flow Finder Chrome Extension** to import real accessibility errors from a scanned website.

### How it works:
1. User runs the extension on any website
2. Extension scans with **Axe** + **Lighthouse** and stores errors in `chrome.storage.local`
3. User opens Flow Finder web app and clicks **Import Errors from Extension**
4. `extensionBridge.ts` sends a `postMessage` to the content script
5. Content script relays to background → reads `chrome.storage.local` → returns errors
6. Errors are displayed and sent to backend with uploaded files

### Extension connection methods (in order of fallback):
1. Direct `chrome.runtime.sendMessage` (if same origin)
2. `postMessage` → content script relay
3. `window.__flowFinderErrors` (injected by content script on page load)

---

## 🎨 Design System

- **Primary color:** Orange/Amber gradient (`from-orange-500 to-amber-600`)
- **Accessibility feature:** Orange theme
- **Match Design feature:** Violet/Purple theme
- **Redesigner feature:** Indigo/Blue theme
- **Font:** Playfair Display (headings) + system sans-serif (body)
- **Background:** `from-orange-50 via-amber-50 to-rose-50` gradient
- **Glass effect:** `backdrop-blur` with semi-transparent white

---

## 🔒 Authentication

Uses JWT token stored in `localStorage`. Protected routes check for token existence. On session expiry, user is redirected to `/signin`.

---

## 📡 API Endpoints Used

| Method | Endpoint | Feature |
|--------|----------|---------|
| POST | `/api/accessibility/process` | Upload files + get suggestions or corrected ZIP |
| POST | `/api/accessibility/chat` | Follow-up chat about accessibility results |
| POST | `/api/match-design` | Compare website vs Figma design |
| POST | `/api/redesign` | Generate website redesigns |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 14 | React framework with App Router |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| Gemini AI | AI suggestions, chat, vision comparison |
| Puppeteer | Headless browser for screenshots & scraping |
| Figma API | Fetch design frames for comparison |
| Chrome Extension API | Import real accessibility errors |

---

## 🤝 Related Repositories

- **Backend:** [flow-finder-backend](https://github.com/NandiniRaj82/FlowFinder-BE) — Node.js/Express API with Gemini AI integration
- **Chrome Extension:** [flow-finder-extension(https://github.com/NandiniRaj82/FlowFinder)] — Axe + Lighthouse scanner with storage bridge

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">


</div>
