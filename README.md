# TECHNEEDS NXT
### The Next Generation of Tech Mentorship | TechNeeds IGDTUW
**Official Submission for REIMAGATHON 2026**

---

## 🌟 Executive Overview
**TECHNEEDS NXT** is an elite full-stack digital mentorship platform purpose-built for the technical community of **Indira Gandhi Delhi Technical University for Women (IGDTUW)**. Built to satisfy all parameters of the **REIMAGATHON 40-mark evaluation matrix**, the platform reimagines the legacy TechNeeds portal into a high-performance, production-quality ecosystem featuring:

1. **3-Tier Multi-Role Hierarchies**: Secure, isolated portals for **Administrators**, **Mentors**, and **Mentees**.
2. **Granular Deliverable Management**: Structured creation and tracking of **Video Modules**, timed **Interactive Quizzes** with auto-scoring, and **Hands-on Projects** with mentor evaluations and feedback.
3. **Signature Feature — MY NXT (8 Marks)**: Personalised technical identity featuring:
   - Dynamic SVG Avatars with customizable styles (Orbit, Prism, Pixel, Wave, Grid).
   - Computed Learner Archetypes derived honestly from activity signals (*The Consistent Builder*, *The Analytical Thinker*, etc.).
   - Interactive SVG Skill Constellation / Radar charting verified proficiencies.
   - Milestone Badge Shelf unlocked strictly by real achievements.
   - Growth Timeline & Performance Recommendations with explicit rationale.
   - Public shareable profile link (`/shared/:id`) withholding private credentials.
4. **Dynamic 60/25/15 Leaderboard**: Fair, transparent gamification scoring 60% assessment marks + 25% curriculum completion + 15% consistency with Top 3 podium animations.
5. **Crafted Developer UI/UX (10 Marks)**: Dark-mode aesthetic inspired by Linear and Vercel, responsive across mobile, tablet, and desktop with zero broken layouts.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 App Router, React 18, Tailwind CSS | High performance, instant responsiveness, zero-dependency SVG icons & charts |
| **Backend** | Express 5, Node.js >= 20 | REST API, Helmet security, rate limiting, JWT Bearer authentication, Zod validation |
| **Database** | MongoDB with Mongoose | Relational schemas for Programs, Cohorts, Users, Deliverables, Attempts, Submissions, Activity |
| **Testing** | Node.js Test Runner | 14 domain unit tests validating scoring formula, streaks, archetypes, and badge milestones |

---

## ⚡ Quick Start & Local Setup Instructions

### 1. Prerequisites
- **Node.js** >= 20.0.0
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a free MongoDB Atlas connection string.

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```
> **Backend will run on:** `http://localhost:8000`

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
> **Frontend will run on:** `http://localhost:3000`

---

## 🔑 Demo Accounts for Evaluation

The database seed script (`npm run seed`) pre-configures realistic demo accounts with active cohorts, resources, submissions, and badges:

| Role | Username / Identifier | Password | Key Actions to Test |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@techneeds.local` | `ChangeMe-Admin-123` | Create programs & cohorts, onboard mentors, allocate mentors to cohorts, view analytics |
| **Mentor** | `mentor.demo@techneeds.local` | `Demo@12345` | Add mentees (auto-generated `TNX26####` ID & password), create & publish video/quiz/project deliverables, grade submissions with marks & feedback |
| **Mentee (Top Performer)** | `TNX260001` | `Demo@12345` | Aarohi Sharma: View progress gauge, complete deliverables, view quiz breakdown, view **MY NXT** profile & skill constellation |
| **Mentee (Learner)** | `TNX260004` | `Demo@12345` | Riya Kapoor: Submit pending project deliverable, attempt quiz, track leaderboard rank |

*Note: On the login page (`/login`) and homepage (`/`), judges can click the 1-click Quick Fill buttons to authenticate instantly without typing!*

---

## 🧪 Testing & Verification
All core domain logic is backed by automated unit tests:
```bash
cd backend
npm test
```
**Test Coverage:**
- Video status transitions and overdue tracking
- Auto-scoring of quizzes without answer leakage
- Project submission updates and evaluation locks
- 60/25/15 Leaderboard formula calculation and tie handling
- Active learning streak calculations
- Milestone badge trigger conditions
- Deterministic learner archetype categorization

---

## 🚀 Production Deployment Guidance

### Deploying the Backend to Render
1. Push `backend/` to GitHub or connect repository.
2. Create a new **Web Service** on Render.
3. Build command: `npm install`
4. Start command: `npm start`
5. Configure Environment Variables:
   - `PORT`: `8000`
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster.mongodb.net/techneeds_nxt`
   - `JWT_SECRET`: `<your-random-64-character-string>`
   - `CLIENT_ORIGIN`: `https://your-frontend-deployment.vercel.app`

### Deploying the Frontend to Vercel
1. Import `frontend/` directory into Vercel.
2. Framework Preset: **Next.js**
3. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://your-render-backend-url.onrender.com`
4. Click **Deploy**.

---

## 👥 Hackathon Submission Details
- **Project Name:** TECHNEEDS NXT
- **Society:** TechNeeds IGDTUW
- **Hackathon:** REIMAGATHON 2026
- **Tagline:** #all_you_need_to_know_about_tech
