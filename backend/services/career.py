import re
import json
from google.genai import types

async def generate_career_path(client, current_role, skills):
    prompt = f"""
    Based on the following skills and current role, generate 3 realistic career trajectories.
    
    Current Role: {current_role}
    Skills: {', '.join(skills)}
    
    Respond with ONLY valid raw JSON:
    {{
        "paths": [
            {{
                "path_name": "<short descriptive path name>",
                "color": "<one of: '#4f46e5', '#10b981', '#ec4899'>",
                "stages": [
                    {{
                        "role": "<job title>",
                        "years_from_now": <integer>,
                        "skills_needed": ["<skill1>", "<skill2>"],
                        "salary_range": "<e.g. $80k - $100k>"
                    }}
                ]
            }}
        ],
        "advice": "<2-3 sentences of career advice>"
    }}
    Each path should have 4-5 stages progressing from current level to senior/leadership.
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[prompt],
        config=types.GenerateContentConfig(temperature=0.5)
    )
    
    response_text = response.text.strip()
    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
    if json_match:
        response_text = json_match.group(0)
    
    return json.loads(response_text)
