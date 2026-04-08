# ResuMind AI — Advanced Resume Intelligence 🚀

[![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Gemini](https://img.shields.io/badge/AI-Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Firebase](https://img.shields.io/badge/Auth-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)
[![Render](https://img.shields.io/badge/Cloud-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)

**ResuMind AI** is a premium, AI-powered career trajectory engine that goes far beyond simple keyword matching. Built for the modern professional, it uses deep NLP synthesis and computer vision to audit your resume like a top-tier technical recruiter.

---

## ✨ Key Features

### 🔍 Deep Technical Analysis
*   **ATS Readability Audit**: See exactly how automated systems parse your technical DNA.
*   **Match Scoring**: Get an instant percentage match against any specific job description.
*   **Missing Skills Discovery**: Identify critical gaps in your profile before you apply.

### 👁️ "Shadow Recruiter" Visual Audit
*   **Human-Eye Scanability**: Powered by Gemini Vision, get brutal feedback on your typography, white space, and visual hierarchy.
*   **6-Second Test**: Evaluate if your most important impact points are visible at a glance.

### 🗺️ Career Strategy & Negotiation
*   **Predictive Roadmaps**: Map out your next 10 years with specific role fit and salary milestones.
*   **Salary Coaching**: Receive estimated annual ranges and actionable negotiation tips tailored to your profile.
*   **Interview Preparation**: Dynamic, gaps-based interview questions to help you land the role.

---

## 🛠️ Tech Stack

-   **Frontend**: HTML5, Vanilla CSS3 (Premium Glassmorphism), ES6+ JavaScript, Lottie Animations.
-   **Backend**: Python, FastAPI, Uvicorn, Gunicorn.
-   **AI Engine**: Google Gemini 2.5 Flash (Vision + Text).
-   **Database/Auth**: Firebase Authentication & Firestore.
-   **Infrastructure**: Render (Unified Web Service).

---

## 🚀 Quick Start

### Local Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/shoibahmad/Resume-Analyzer.git
    cd Resume-Analyzer
    ```

2.  **Environment Variables**:
    Create a `.env` file in the `backend/` directory:
    ```env
    GEMINI_API_KEY=your_key_here
    ```

3.  **Install Dependencies**:
    ```bash
    pip install -r backend/requirements.txt
    ```

4.  **Run Locally**:
    ```bash
    uvicorn backend.main:app --reload
    ```
    Access the app at `http://localhost:8000`.

### Cloud Deployment (Render)

This project is pre-configured for Render via `render.yaml` and `Procfile`.

1.  Create a **New Web Service** on Render.
2.  Connect this GitHub repository.
3.  Add `GEMINI_API_KEY` as an environment variable in the Render Dashboard.
4.  Deploy! (The build and start commands are automatically managed by `render.yaml`).

---

## 📁 Project Structure

```bash
├── backend/
│   ├── main.py          # FastAPI Entry Point & Static Serving
│   ├── services/         # AI & Business Logic
│   ├── utils/            # Document Parsers (PDF/DOCX)
│   └── requirements.txt  # Python Dependencies
├── frontend/
│   ├── js/              # API, Auth, & UI Logic
│   ├── css/             # Premium Design System
│   └── *.html           # Modular UI Views
├── render.yaml          # Render Cloud Configuration
└── Procfile             # Process Definition
```

---

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

*Powered by Large Learning Model & Predictive AI.*
