import os
import json
import re
from google import genai
from google.genai import types

def get_api_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables")
    return genai.Client(api_key=api_key)

def build_analysis_prompt(job_description, resume_text):
    system_instruction = (
        "You are a strict, top-tier technical recruiter and expert resume analyzer. Your task is to perform an in-depth "
        "evaluation of a candidate's resume against a provided job description. Be highly analytical and critical. "
        "You must identify their match score, an ATS readability score, evaluate their experience match, list specific strengths "
        "and weaknesses, generate 3 specific interview questions tailored to their gaps, and provide actionable recommendations. "
        "ADDITIONALLY: Perform a deep linguistic NLP analysis including identifying the professional tone, "
        "evaluating the impact of action verbs used, and calculating the structural reading complexity. "
        "IF AN IMAGE IS PROVIDED: Perform a 'Shadow Recruiter' visual audit. Evaluate the typography, white space, "
        "visual hierarchy, and '6-second scanability'. Provide brutal but constructive feedback on how it looks to a human eyes."
    )
    
    prompt = f"""
    Please analyze the following resume against the job description.
    
    --- JOB DESCRIPTION ---
    {job_description}
    
    --- CANDIDATE RESUME TEXT ---
    {resume_text}
    
    Respond with ONLY a valid, raw JSON object matching the extended schema below. Do NOT include markdown blocks.
    
    EXTENDED SCHEMA:
    {{
        "job_title": "string",
        "match_score": number (0-100 integer),
        "ats_score": number (0-100 integer),
        "experience_match": "string",
        "found_skills": ["string"],
        "missing_skills": ["string"],
        "strengths": ["string"],
        "weaknesses": ["string"],
        "interview_questions": ["string"],
        "recommendations": "string",
        "salary_estimate": "string annual range",
        "negotiation_tips": ["string"],
        "optimized_summary": "string",
        "tone_analysis": "string",
        "verb_strength": number (0-100 integer),
        "complexity_score": number (0-100 integer),
        "keyword_themes": ["string"],
        "radar_data": {{
            "labels": ["Technical", "Soft Skills", "Leadership", "Experience Depth", "Industry Knowledge", "Communication"],
            "user_scores": [number (0-100 integers)],
            "required_scores": [number (0-100 integers)]
        }},
        "visual_feedback": {{
            "score": number (0-100 integer),
            "hierarchy": "string",
            "typography": "string",
            "white_space": "string",
            "scanability": "string"
        }},
        "learning_roadmap": [
            {{
                "skill_name": "string",
                "steps": ["string"],
                "doc_link": "url",
                "project_idea": "string",
                "time_estimate": "string"
            }}
        ],
        "tone_rewriter": {{
            "original_bullets": ["string"],
            "rewritten_bullets": ["string"],
            "tone_applied": "string"
        }},
        "keyword_heatmap": [
            {{
                "section": "string",
                "density": number (0-100 integer),
                "status": "strong|moderate|weak"
            }}
        ],
        "role_fit_predictor": [
            {{
                "role": "string",
                "fit_score": number (0-100 integer),
                "reason": "string"
            }}
        ],
        "culture_fit": {{
            "collaboration": number (0-100 integer),
            "innovation": number (0-100 integer),
            "leadership": number (0-100 integer),
            "adaptability": number (0-100 integer),
            "detail_orientation": number (0-100 integer),
            "assessment": "string"
        }},
        "resume_age": {{
            "outdated_items": ["string"],
            "stale_certs": ["string"],
            "old_formatting": ["string"],
            "freshness_score": number (0-100 integer),
            "verdict": "string"
        }},
        "career_progression": {{
            "stages": [
                {{
                    "role": "string (Next Role title)",
                    "years_from_now": number,
                    "skills_needed": ["string"],
                    "salary_range": "string"
                }},
                {{
                    "role": "string (Senior/Lead Role title)",
                    "years_from_now": number,
                    "skills_needed": ["string"],
                    "salary_range": "string"
                }}
            ],
            "advice": "string"
        }}
    }}
    """
    return system_instruction, prompt

async def run_analysis(client, system_instruction, prompt, image_part=None):
    contents = [prompt]
    if image_part:
        contents.append(image_part)
        
    response = client.models.generate_content(
        model="gemini-2.5-flash", 
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json"
        ),
        contents=contents
    )
    
    response_text = response.text.strip()
    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
    if json_match:
        response_text = json_match.group(0)
    
    return json.loads(response_text)
