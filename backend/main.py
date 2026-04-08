import os
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Import modular services
from backend.utils.parsers import (
    extract_text_from_pdf, 
    extract_vision_part_from_pdf, 
    extract_text_from_docx
)
from backend.services.analysis import (
    get_api_client, 
    build_analysis_prompt, 
    run_analysis
)
from backend.services.market import get_market_trends
from backend.services.career import generate_career_path

# Load environment variables
load_dotenv()

app = FastAPI(title="ResuMind AI API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client (shared)
try:
    client = get_api_client()
except Exception as e:
    print(f"⚠️ ERROR: {e}")
    client = None

@app.on_event("startup")
async def startup_event():
    print("\n" + "="*60)
    print("🚀 ResuMind AI Backend — V4 Predictive Intelligence")
    print("✨ Services: Modular Architecture / Gemini 2.5 Flash")
    print("="*60 + "\n")

@app.post("/api/analyze")
async def analyze_resume_route(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API client not initialized.")

    try:
        file_bytes = await resume.read()
        resume_text = ""
        image_part = None
        
        # 1. Parsing
        if resume.filename.endswith('.pdf'):
            resume_text = extract_text_from_pdf(file_bytes)
            image_part = extract_vision_part_from_pdf(file_bytes)
        elif resume.filename.endswith('.docx'):
            resume_text = extract_text_from_docx(file_bytes)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type.")
        
        # 2. Build Prompt
        sys_instr, prompt = build_analysis_prompt(job_description, resume_text)
        
        # 3. AI Analysis
        return await run_analysis(client, sys_instr, prompt, image_part)

    except Exception as e:
        print(f"Critical Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/career-path")
async def career_path_route(data: dict):
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API client not initialized.")
    
    skills = data.get("skills", [])
    current_role = data.get("current_role", "Software Developer")
    return await generate_career_path(client, current_role, skills)

@app.post("/api/market-trends")
async def market_trends_route(data: dict):
    skills = data.get("skills", [])
    if not skills:
        return {"trends": [], "summary": "No data"}
    return get_market_trends(skills)

# Static Frontend Serving
current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dir = os.path.abspath(os.path.join(current_dir, "..", "frontend"))
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
