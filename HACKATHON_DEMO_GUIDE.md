# TECHNEEDS NXT — End-to-End Judge Walkthrough Guide
**REIMAGATHON 2026 Evaluation Matrix (40 Marks)**

This guide walks through the exact 6-step end-to-end evaluation demonstration requested in the Master Project Prompt.

---

### STEP 1 — ADMIN WORKFLOW
1. Go to `http://localhost:3000/login`.
2. Click **Admin** in the quick fill bar (or enter `admin@techneeds.local` / `ChangeMe-Admin-123`).
3. You are redirected to the **Admin Command Center** (`/admin`).
4. **Create a Program**:
   - Go to **Programs & Cohorts** (`/admin/programs`).
   - Click `+ Create Program`.
   - Enter name e.g. "Cloud & DevOps Intensive", description, tags. Click **Create Program**.
5. **Create a Cohort**:
   - Click `+ New Cohort`.
   - Select program, name e.g. "Cloud Cohort 2026", set dates and capacity. Click **Create Cohort**.
6. **Onboard a Mentor**:
   - Go to **Mentors** (`/admin/mentors`).
   - Click `+ Onboard New Mentor`.
   - Enter name e.g. "Neha Verma" and email e.g. "neha.mentor@techneeds.local".
   - Submit. **Notice the credentials popup**: A secure password is automatically generated with a 1-click **Copy Credentials** button!
7. **Allocate Mentor**:
   - Click **Assign Cohort** next to the mentor, pick the newly created cohort, and submit.
   - The mentor is now assigned with isolated cohort permissions!

---

### STEP 2 — MENTOR WORKFLOW
1. Log out or sign in as Mentor: `mentor.demo@techneeds.local` / `Demo@12345`.
2. You arrive at the **Mentor Workspace** (`/mentor`).
3. **Onboard a Mentee**:
   - Go to **My Mentees** (`/mentor/mentees`).
   - Click `+ Add Mentee to Cohort`.
   - Select cohort and enter student name e.g. "Kritika Sen".
   - Submit. **Notice the credential modal**: A unique `TNX26####` enrollment number and secure initial password are automatically created!
4. **Publish Resources**:
   - Go to **Resource Creation Studio** (`/mentor/resources`).
   - Click `+ Create Resource`.
   - **Video**: Select Video, input YouTube URL, instructions, deadline, and publish.
   - **Quiz**: Select Interactive Quiz. Use the built-in **Question Builder** to add questions, multiple choice options, select the correct answer radio button, and set marks. Click publish.
   - **Project**: Select Hands-on Project. Set submission format (e.g. GitHub repo link) and max marks (100). Click publish.

---

### STEP 3 — MENTEE WORKFLOW
1. Sign in as Mentee: `TNX260001` / `Demo@12345` (Aarohi Sharma).
2. You land on the **Mentee Dashboard** (`/mentee`).
3. Review the **Overall Score Gauge** (showing real-time Assessment 60%, Completion 25%, Consistency 15%).
4. Go to **Learning Hub** (`/mentee/resources`).
5. **Attempt Video**: Open Git Essentials. Click "Start Learning", then "Mark as Completed".
6. **Attempt Quiz**: Open Data Structures Quiz. Answer questions on the clean radio UI, click "Submit Quiz". **Immediately inspect the result breakdown**: See score, percentage, and correct answer explanations without answer leaks before submission!
7. **Submit Project**: Open Mini Dashboard Project. Enter your GitHub URL and reflection notes. Click "Submit Project".

---

### STEP 4 — EVALUATION WORKFLOW
1. Switch back to Mentor: `mentor.demo@techneeds.local` / `Demo@12345`.
2. Go to **Resource Studio** (`/mentor/resources`). Click on the Project deliverable.
3. On the **Submissions & Grading Desk**, view the mentee's submission with timestamp and repository link.
4. Click **Grade & Feedback**.
5. Input marks (e.g. 95/100) and detailed constructive feedback. Submit evaluation.

---

### STEP 5 — RESULTS & LEADERBOARD
1. Return to Mentee portal (`TNX260001`).
2. Notice:
   - Updated score in the circular gauge.
   - Feedback reflected in **Mentor Feedback Archive** (`/mentee/feedback`).
   - New milestone badges unlocked!
3. Go to **Leaderboard** (`/leaderboard`).
   - View top 3 podium standings.
   - Check formula: (Assessment × 0.6) + (Completion × 0.25) + (Consistency × 0.15).
   - Find your highlighted row in the rankings.

---

### STEP 6 — SIGNATURE FEATURE: MY NXT
1. Click **MY NXT Profile** (`/mentee/my-nxt`).
2. **Personalised Avatar**: Click the edit button to switch avatar style between Orbit, Prism, Pixel, Wave, and Grid, and change accent colors.
3. **Learner Archetype**: Read your computed archetype (*The Consistent Builder*) and its activity signals.
4. **Skill Constellation**: Inspect the interactive SVG constellation chart plotting proficiency across Programming, Web Dev, Data Analysis, and Machine Learning.
5. **Milestone Badges**: View unlocked badges with timestamps and locked criteria.
6. **Growth Timeline**: Trace chronological milestones from cohort enrollment to first quiz and project evaluations.
7. **AI Performance Insights**: Review key strengths, areas for improvement, and next recommendations with reasons.
8. **Shareable Showcase**: Click **Share Profile** -> Toggle Active -> Copy the public link (`/shared/:id`). Open it in an incognito window: View verified achievements while private credentials remain hidden!
